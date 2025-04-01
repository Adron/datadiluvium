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
  const [selectedExportFormat, setSelectedExportFormat] = useState<string>('json');

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

  const exportData = () => {
    if (!generatedData) return;

    Object.entries(generatedData).forEach(([tableName, tableData]) => {
      let content: string;
      let extension: string;
      let mimeType: string;

      switch (selectedExportFormat) {
        case 'json':
          content = JSON.stringify(tableData, null, 2);
          extension = '.json';
          mimeType = 'application/json';
          break;
        case 'json-rich':
          // Convert rows to array of objects with column names as keys
          const richData = tableData.rows.map(row => {
            const obj: { [key: string]: any } = {};
            tableData.columns.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          });
          content = JSON.stringify(richData, null, 2);
          extension = '.json';
          mimeType = 'application/json';
          break;
        case 'csv':
          // Create CSV header
          const header = tableData.columns.join(',');
          // Create CSV rows
          const rows = tableData.rows.map(row => 
            row.map(cell => {
              // Escape commas and quotes in cell values
              const cellStr = String(cell);
              if (cellStr.includes(',') || cellStr.includes('"')) {
                return `"${cellStr.replace(/"/g, '""')}"`;
              }
              return cellStr;
            }).join(',')
          );
          content = [header, ...rows].join('\n');
          extension = '.csv';
          mimeType = 'text/csv';
          break;
        case 'xml':
          // Create XML structure
          const xmlRows = tableData.rows.map(row => {
            const rowData = row.map((cell, index) => 
              `    <${tableData.columns[index]}>${String(cell)}</${tableData.columns[index]}>`
            ).join('\n');
            return `  <row>\n${rowData}\n  </row>`;
          }).join('\n');
          content = `<?xml version="1.0" encoding="UTF-8"?>\n<${tableName}>\n${xmlRows}\n</${tableName}>`;
          extension = '.xml';
          mimeType = 'application/xml';
          break;
        case 'txt':
          // Create plain text format with numbered rows and column-value pairs
          const textRows = tableData.rows.map((row, index) => {
            const pairs = row.map((cell, colIndex) => 
              `${tableData.columns[colIndex]}: ${String(cell)}`
            );
            return `${index + 1} - ${pairs.join(', ')}.`;
          });
          content = textRows.join('\n');
          extension = '.txt';
          mimeType = 'text/plain';
          break;
        case 'sql':
          // Create SQL INSERT statements for each row
          const sqlStatements = tableData.rows.map(row => {
            // Format values based on their type
            const formattedValues = row.map(cell => {
              if (cell === null) return 'NULL';
              if (typeof cell === 'number') return cell;
              // Escape single quotes and wrap strings
              return `'${String(cell).replace(/'/g, "''")}'`;
            });
            
            return `INSERT INTO ${tableName} (${tableData.columns.join(', ')}) VALUES (${formattedValues.join(', ')});`;
          });
          content = sqlStatements.join('\n');
          extension = '.sql';
          mimeType = 'application/sql';
          break;
        default:
          return;
      }

      // Create and trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
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
              <select
                value={selectedExportFormat}
                onChange={(e) => setSelectedExportFormat(e.target.value)}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-300 dark:border-gray-600"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
                <option value="txt">Plain Text</option>
                <option value="sql">SQL Inserts</option>
                <option value="json-rich">JSON (rich)</option>
              </select>
              <button
                onClick={exportData}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors"
              >
                Export
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