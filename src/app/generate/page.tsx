'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { generatorRegistry } from '../lib/generators/registry';
import type { GeneratorConfig, GeneratedValue } from '../lib/generators/types';

type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  defaultValue: string | null;
  generator?: string;
  referencedTable?: string;
  referencedColumn?: string;
};

export default function GeneratePage() {
  const router = useRouter();
  const [rowCount, setRowCount] = useState<number>(10);
  const [tableRowCounts, setTableRowCounts] = useState<{ [key: string]: number | null }>({});
  const [schema, setSchema] = useState<{ columns: SchemaColumn[]; sql: string } | null>(null);
  const [sampleValues, setSampleValues] = useState<{ [key: string]: string[] }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    // Load schema from localStorage
    const savedSchema = localStorage.getItem('currentSchema');
    if (!savedSchema) {
      router.push('/');
      return;
    }
    setSchema(JSON.parse(savedSchema));
  }, [router]);

  // Generate sample values when schema loads or changes
  useEffect(() => {
    if (!schema?.columns) return;

    const generateSamples = async () => {
      const samples: { [key: string]: string[] } = {};
      const candidateKeyValues: { [key: string]: string[] } = {};

      try {
        // First pass: Generate samples for non-foreign key columns
        for (const column of schema.columns) {
          if (!column.generator || column.generator === 'Foreign Key') continue;

          const columnKey = `${column.tableName}.${column.columnName}`;
          console.log(`Attempting to generate samples for ${columnKey} using generator: ${column.generator}`);
          const generator = generatorRegistry.get(column.generator);
          console.log(`Found generator:`, generator?.name);
          
          try {
            if (generator) {
              const values = await generator.generate(5);
              samples[columnKey] = values.map(String);
              
              // Store candidate key values for foreign key references
              candidateKeyValues[columnKey] = values.map(String);
            }
          } catch (error) {
            console.error(`Error generating samples for ${columnKey}:`, error);
            // Don't redirect, just log the error
          }
        }

        // Second pass: Try to generate foreign key samples
        for (const column of schema.columns) {
          if (column.generator !== 'Foreign Key') continue;

          const columnKey = `${column.tableName}.${column.columnName}`;
          const referencedKey = column.referencedTable && column.referencedColumn ? 
            `${column.referencedTable}.${column.referencedColumn}` : null;

          if (referencedKey && candidateKeyValues[referencedKey]) {
            samples[columnKey] = candidateKeyValues[referencedKey];
          } else {
            samples[columnKey] = ['(Values will be generated from referenced column)'];
          }
        }

        setSampleValues(samples);
      } catch (error) {
        console.error('Error generating samples:', error);
        // Don't redirect, just show an error message if needed
      }
    };

    generateSamples();
  }, [schema]);

  // Get unique table names
  const getUniqueTables = () => {
    if (!schema?.columns) return [];
    return Array.from(new Set(schema.columns.map(col => col.tableName)));
  };

  // Calculate total rows and organize data for the treeview
  const getGenerationSummary = () => {
    const tables = getUniqueTables();
    let totalRows = 0;
    
    const tableDetails = tables.map(tableName => {
      const rowsForTable = tableRowCounts[tableName] || rowCount;
      totalRows += rowsForTable;
      
      const columns = schema!.columns
        .filter(col => col.tableName === tableName)
        .map(col => ({
          name: col.columnName,
          generator: col.generator || 'None'
        }));

      return {
        name: tableName,
        rows: rowsForTable,
        columns
      };
    });

    return {
      tables: tableDetails,
      totalRows,
      tableCount: tables.length
    };
  };

  const handleGenerateClick = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmGenerate = async () => {
    const summary = getGenerationSummary();
    
    // Store generation settings
    localStorage.setItem('generationSettings', JSON.stringify({
      defaultRowCount: rowCount,
      tableRowCounts,
      schema
    }));

    // Generate data for each table
    const generatedData: { [tableName: string]: { columns: string[]; rows: any[][] } } = {};
    const candidateKeyValues: { [key: string]: any[] } = {};

    try {
      // First pass: Generate data for non-foreign key columns
      for (const table of summary.tables) {
        const tableColumns = schema!.columns.filter(col => col.tableName === table.name);
        const rowsToGenerate = tableRowCounts[table.name] || rowCount;
        
        generatedData[table.name] = {
          columns: tableColumns.map(col => col.columnName),
          rows: Array(rowsToGenerate).fill(null).map(() => Array(tableColumns.length).fill(null))
        };

        // Generate data for non-foreign key columns first
        for (const [colIndex, column] of tableColumns.entries()) {
          if (!column.generator || column.generator === 'Foreign Key') continue;

          const generator = generatorRegistry.get(column.generator);
          if (!generator) continue;

          const columnKey = `${column.tableName}.${column.columnName}`;
          const values = await generator.generate(rowsToGenerate);
          
          // Store values for potential foreign key references
          candidateKeyValues[columnKey] = values;
          
          // Store values in the rows
          values.forEach((value, rowIndex) => {
            generatedData[table.name].rows[rowIndex][colIndex] = value;
          });
        }
      }

      // Second pass: Handle foreign key columns
      for (const table of summary.tables) {
        const tableColumns = schema!.columns.filter(col => col.tableName === table.name);
        
        for (const [colIndex, column] of tableColumns.entries()) {
          if (column.generator !== 'Foreign Key' || !column.referencedTable || !column.referencedColumn) continue;

          const referencedKey = `${column.referencedTable}.${column.referencedColumn}`;
          const referencedValues = candidateKeyValues[referencedKey];

          if (!referencedValues || referencedValues.length === 0) {
            throw new Error(`No referenced values available for foreign key from ${column.referencedTable}.${column.referencedColumn}`);
          }

          // For each row, randomly select a value from the referenced values
          generatedData[table.name].rows.forEach((row, rowIndex) => {
            const randomIndex = Math.floor(Math.random() * referencedValues.length);
            row[colIndex] = referencedValues[randomIndex];
          });
        }
      }

      localStorage.setItem('generatedData', JSON.stringify(generatedData));
      setIsConfirmModalOpen(false);
      router.push('/generated');
    } catch (error) {
      console.error('Error generating data:', error);
      // TODO: Show error message to user
    }
  };

  if (!schema) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen p-8 sm:p-20 ml-48">
          <div>Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen p-8 sm:p-20 ml-48">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Generate Data</h1>
        
        <div className="max-w-6xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-start gap-8">
              <label 
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                title="This is the default number of rows to generate for each table. You can override the default number by selecting a value in the table row count to the right."
              >
                Default Number of Rows:
                <input
                  type="number"
                  min="1"
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="ml-2 w-24 px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </label>

              <div className="w-auto">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table-Specific Row Counts</h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <table className="w-auto">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-2 whitespace-nowrap pr-8">
                          Table Name
                        </th>
                        <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-2 whitespace-nowrap">
                          Row Count Override
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {getUniqueTables().map((tableName) => (
                        <tr key={tableName}>
                          <td className="py-2 text-sm text-gray-900 dark:text-gray-100 pr-8 whitespace-nowrap">
                            {tableName}
                          </td>
                          <td className="py-2 whitespace-nowrap">
                            <input
                              type="number"
                              min="1"
                              value={tableRowCounts[tableName] || ''}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : null;
                                setTableRowCounts(prev => ({
                                  ...prev,
                                  [tableName]: value && value > 0 ? value : null
                                }));
                              }}
                              placeholder={`Default (${rowCount})`}
                              className="w-32 px-2 py-1 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateClick}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
              >
                Generate
              </button>
              <button
                onClick={() => router.push('/schema')}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Back
              </button>
            </div>

            {/* Confirmation Modal */}
            {isConfirmModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Confirm Data Generation
                    </h2>
                    
                    <div className="overflow-auto max-h-[50vh] mb-6">
                      {/* Treeview */}
                      <div className="space-y-4">
                        {getGenerationSummary().tables.map(table => (
                          <div key={table.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {table.name}
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-400">
                                {table.rows} rows
                              </div>
                            </div>
                            <div className="pl-4 space-y-1">
                              {table.columns.map(column => (
                                <div key={column.name} className="flex items-center justify-between text-sm">
                                  <div className="text-gray-600 dark:text-gray-300">
                                    {column.name}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    {column.generator}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p>Total rows to be generated: <span className="font-medium text-gray-900 dark:text-gray-100">{getGenerationSummary().totalRows}</span></p>
                        <p>Across <span className="font-medium text-gray-900 dark:text-gray-100">{getGenerationSummary().tableCount}</span> tables</p>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setIsConfirmModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmGenerate}
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
                      >
                        Generate Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Schema Preview</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Table Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Column Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Generator
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sample Values
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {schema.columns.map((column, index) => {
                      const columnKey = `${column.tableName}.${column.columnName}`;
                      const samples = sampleValues[columnKey] || [];
                      
                      return (
                        <tr key={`${column.tableName}-${column.columnName}-${index}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {column.tableName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {column.columnName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {column.dataType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {column.generator || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {samples.length > 0 ? (
                              <div className="font-mono text-xs">
                                {samples.join(', ')}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 