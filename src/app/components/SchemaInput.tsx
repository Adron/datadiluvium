'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  defaultValue: string | null;
};

type SQLDialect = {
  name: string;
  isValid: boolean;
  confidence: number;
  features: string[];
};

type ValidationResult = {
  isValid: boolean;
  error?: string;
  dialects: SQLDialect[];
};

export default function SchemaInput() {
  const [schemaText, setSchemaText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [schemaColumns, setSchemaColumns] = useState<SchemaColumn[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setSchemaText(text);
          setValidationResult(null);
          setSchemaColumns([]);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.json', '.yaml', '.yml', '.xml', '.csv', '.sql'],
    },
    multiple: false,
  });

  const processSchema = () => {
    const columns: SchemaColumn[] = [];
    const tables = schemaText.split(/create\s+table\s+/gi);
    
    tables.slice(1).forEach(tableDefinition => {
      // Extract table name
      const tableNameMatch = tableDefinition.match(/[\[\`"]?(\w+)[\]\`"]?\s*\(/i);
      if (!tableNameMatch) return;
      
      const tableName = tableNameMatch[1].replace(/[\[\]"`]/g, '');
      const columnDefinitions = tableDefinition
        .slice(tableDefinition.indexOf('(') + 1, tableDefinition.lastIndexOf(')'))
        .split(',')
        .filter(line => {
          const trimmedLine = line.trim().toUpperCase();
          return !trimmedLine.startsWith('CONSTRAINT') && 
                 !trimmedLine.startsWith('PRIMARY KEY') &&
                 !trimmedLine.startsWith('FOREIGN KEY') &&
                 !trimmedLine.startsWith('INDEX') &&
                 trimmedLine !== '';
        });

      columnDefinitions.forEach(colDef => {
        const cleanColDef = colDef.trim().replace(/[\[\]"`]/g, '');
        
        // Extract column details using regex
        const colMatch = cleanColDef.match(/^(\w+)\s+([^\s]+(?:\([^\)]+\))?)\s*(.*)$/i);
        if (!colMatch) return;

        const [, columnName, dataType, rest] = colMatch;
        
        // Extract default value
        let defaultValue: string | null = null;
        const defaultMatch = rest.match(/default\s+([^,\s]+)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1].replace(/['"`]/g, '');
        }

        columns.push({
          tableName,
          columnName,
          dataType: dataType.toUpperCase(),
          defaultValue
        });
      });
    });

    setSchemaColumns(columns);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      >
        <input {...getInputProps()} />
        
        <textarea
          value={schemaText}
          onChange={(e) => {
            setSchemaText(e.target.value);
            setValidationResult(null);
            setSchemaColumns([]);
          }}
          placeholder="Paste your schema here or drag and drop a file..."
          className="w-full h-64 p-4 bg-transparent resize-y rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {!schemaText && (
            <div className="text-gray-400 dark:text-gray-500 text-center">
              <p className="text-sm">Drop your schema file here</p>
              <p className="text-xs mt-1">or paste directly in the text area</p>
            </div>
          )}
        </div>
      </div>

      {validationResult && (
        <div className="mt-4 space-y-4">
          <div className={`p-4 rounded-md ${
            validationResult.isValid 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            {validationResult.isValid 
              ? 'Schema is valid SQL'
              : `Schema validation failed: ${validationResult.error}`
            }
          </div>

          {validationResult.isValid && validationResult.dialects.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4">
              <h3 className="text-sm font-semibold mb-3">Detected SQL Dialects:</h3>
              <ul className="space-y-3">
                {validationResult.dialects.map(dialect => (
                  <li key={dialect.name} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dialect.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {dialect.confidence.toFixed(0)}% confidence
                      </span>
                    </div>
                    {dialect.features.length > 0 && (
                      <ul className="mt-1 pl-4 text-xs text-gray-600 dark:text-gray-400">
                        {dialect.features.map((feature, index) => (
                          <li key={index} className="list-disc">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-4 justify-end items-center">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setSchemaText('');
              setValidationResult(null);
              setSchemaColumns([]);
            }}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            Clear
          </button>
          {schemaText && (
            <button
              onClick={processSchema}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Process Schema
            </button>
          )}
        </div>

        {schemaColumns.length > 0 && (
          <>
            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-4" />
            <div className="flex gap-4">
              <button
                onClick={() => {/* TODO: Handle schema saving */}}
                className="px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
              >
                Save Schema
              </button>
              <button
                onClick={() => {/* TODO: Handle data generation */}}
                className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
              >
                Generate Data
              </button>
            </div>
          </>
        )}
      </div>

      {schemaColumns.length > 0 && (
        <div className="mt-8">
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
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {schemaColumns.map((column, index) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 