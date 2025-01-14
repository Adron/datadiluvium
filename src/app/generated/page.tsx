'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import { generatorRegistry } from '../lib/generators/registry';
import type { GeneratorConfig } from '../lib/generators/types';

type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  defaultValue: string | null;
  generator?: string;
  referencedTable?: string;
  referencedColumn?: string;
};

type GenerationSettings = {
  schema: { columns: SchemaColumn[] };
  defaultRowCount: number;
  tableRowCounts: { [key: string]: number | null };
};

type GeneratedData = {
  [tableName: string]: {
    columns: string[];
    rows: any[][];
  };
};

export default function GeneratedDataPage() {
  const router = useRouter();
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<{ [tableName: string]: number }>({});
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings | null>(null);

  // Safe JSON parse helper
  const safeJSONParse = (str: string | null, fallback: any = null) => {
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error('Error parsing JSON:', e);
      return fallback;
    }
  };

  useEffect(() => {
    const data = localStorage.getItem('generatedData');
    const settings = localStorage.getItem('generationSettings');

    if (data && settings) {
      setGeneratedData(safeJSONParse(data));
      setGenerationSettings(safeJSONParse(settings));
    }
  }, []);

  const handleGenerateAgain = async () => {
    if (!generationSettings) return;

    const { schema, defaultRowCount, tableRowCounts } = generationSettings;
    const generatedData: GeneratedData = {};
    const candidateKeyValues: { [key: string]: any[] } = {};

    try {
      // Get unique tables
      const tables = Array.from(new Set(schema.columns.map(col => col.tableName)))
        .map(tableName => ({
          name: tableName,
          columns: schema.columns.filter(col => col.tableName === tableName)
        }));

      // First pass: Generate data for non-foreign key columns
      for (const table of tables) {
        const rowsToGenerate = tableRowCounts[table.name] || defaultRowCount;
        
        generatedData[table.name] = {
          columns: table.columns.map(col => col.columnName),
          rows: Array(rowsToGenerate).fill(null).map(() => Array(table.columns.length).fill(null))
        };

        // Generate data for non-foreign key columns first
        for (const [colIndex, column] of table.columns.entries()) {
          if (!column.generator || column.generator === 'Foreign Key') continue;

          const generator = generatorRegistry.get(column.generator);
          if (!generator) continue;

          const columnKey = `${column.tableName}.${column.columnName}`;
          const values = await generator.generate(rowsToGenerate);
          
          // Store values for potential foreign key references
          candidateKeyValues[columnKey] = values;
          
          // Store values in the rows
          values.forEach((value: any, rowIndex: number) => {
            generatedData[table.name].rows[rowIndex][colIndex] = value;
          });
        }
      }

      // Second pass: Handle foreign key columns
      for (const table of tables) {
        for (const [colIndex, column] of table.columns.entries()) {
          if (column.generator !== 'Foreign Key' || !column.referencedTable || !column.referencedColumn) continue;

          const referencedKey = `${column.referencedTable}.${column.referencedColumn}`;
          const referencedValues = candidateKeyValues[referencedKey];

          if (!referencedValues || referencedValues.length === 0) {
            throw new Error(`No referenced values available for foreign key from ${column.referencedTable}.${column.referencedColumn}`);
          }

          // For each row, randomly select a value from the referenced values
          generatedData[table.name].rows.forEach((row: any[], rowIndex: number) => {
            const randomIndex = Math.floor(Math.random() * referencedValues.length);
            row[colIndex] = referencedValues[randomIndex];
          });
        }
      }

      // Update the stored data and state
      localStorage.setItem('generatedData', JSON.stringify(generatedData));
      setGeneratedData(generatedData);
    } catch (error) {
      console.error('Error regenerating data:', error);
      // TODO: Show error message to user
    }
  };

  const getPageCount = (totalRows: number) => {
    return Math.ceil(totalRows / rowsPerPage);
  };

  const getCurrentPageRows = (rows: any[], tableName: string) => {
    const page = currentPage[tableName] || 0;
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  };

  if (!generatedData) {
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
        <div className="max-w-[90vw]">
          {/* Controls */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => router.push('/generate')}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleGenerateAgain}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors"
              >
                Generate Again
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rows per page:
                <input
                  type="number"
                  min="1"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Math.max(1, parseInt(e.target.value) || 10))}
                  className="ml-2 w-20 px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </label>
            </div>
          </div>

          {/* Data Grids */}
          <div className="space-y-8">
            {Object.entries(generatedData).map(([tableName, tableData]) => (
              <div key={tableName} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {tableName}
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {tableData.columns.map((column, index) => (
                          <th
                            key={index}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {getCurrentPageRows(tableData.rows, tableName).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell: any, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {tableData.rows.length > rowsPerPage && (
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => ({
                          ...prev,
                          [tableName]: Math.max(0, (prev[tableName] || 0) - 1)
                        }))}
                        disabled={(currentPage[tableName] || 0) === 0}
                        className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {((currentPage[tableName] || 0) + 1)} of {getPageCount(tableData.rows.length)}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => ({
                          ...prev,
                          [tableName]: Math.min(getPageCount(tableData.rows.length) - 1, (prev[tableName] || 0) + 1)
                        }))}
                        disabled={(currentPage[tableName] || 0) >= getPageCount(tableData.rows.length) - 1}
                        className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 