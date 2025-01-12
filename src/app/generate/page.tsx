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

      // First pass: Generate samples for non-foreign key columns
      for (const column of schema.columns) {
        if (!column.generator) continue;

        const columnKey = `${column.tableName}.${column.columnName}`;
        console.log(`Attempting to generate samples for ${columnKey} using generator: ${column.generator}`);
        const generator = generatorRegistry.get(column.generator);
        console.log(`Found generator:`, generator?.name);
        
        if (generator && generator.name !== 'Candidate Key') {
          try {
            let values;
            if (generator.name === 'Sequential Number') {
              // For sequential numbers, start at a random number between 1-10
              const startAt = Math.floor(Math.random() * 10) + 1;
              console.log(`Generating sequential numbers starting at ${startAt}`);
              values = await generator.generate(3, { startAt });
            } else if (generator.name === 'Product Code') {
              console.log(`Generating product codes with default format`);
              values = await generator.generate(3);
            } else {
              values = await generator.generate(3);
            }
            console.log(`Generated values for ${columnKey}:`, values);
            samples[columnKey] = values.map(v => v?.toString() || '');
            // Store values for potential foreign key references
            candidateKeyValues[columnKey] = values.map(v => v?.toString() || '');
          } catch (error) {
            console.error(`Error generating samples for ${columnKey}:`, error);
            samples[columnKey] = ['Error generating samples'];
          }
        }
      }

      // Second pass: Handle foreign key references
      for (const column of schema.columns) {
        if (!column.generator) continue;

        const columnKey = `${column.tableName}.${column.columnName}`;
        console.log(`Checking foreign key for ${columnKey} using generator: ${column.generator}`);
        const generator = generatorRegistry.get(column.generator);
        
        if (generator && generator.name === 'Candidate Key' && column.referencedTable && column.referencedColumn) {
          // For foreign keys, use the referenced column's values
          const referencedKey = `${column.referencedTable}.${column.referencedColumn}`;
          console.log(`Looking up referenced values from ${referencedKey}`);
          const referencedValues = candidateKeyValues[referencedKey];
          if (referencedValues) {
            console.log(`Found referenced values:`, referencedValues);
            samples[columnKey] = referencedValues;
          } else {
            console.log(`No referenced values found for ${referencedKey}`);
            samples[columnKey] = ['Referenced values not found'];
          }
        }
      }

      setSampleValues(samples);
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
                              <div className="space-y-1">
                                {samples.map((value, i) => (
                                  <div key={i} className="font-mono text-xs">
                                    {value}
                                  </div>
                                ))}
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