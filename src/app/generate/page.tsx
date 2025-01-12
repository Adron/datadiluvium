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
  const [schema, setSchema] = useState<{ columns: SchemaColumn[]; sql: string } | null>(null);
  const [sampleValues, setSampleValues] = useState<{ [key: string]: string[] }>({});

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
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Rows:
                <input
                  type="number"
                  min="1"
                  value={rowCount}
                  onChange={(e) => setRowCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="ml-2 w-24 px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // TODO: Implement data generation
                }}
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
                        Default Value
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
                            {column.defaultValue || '-'}
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