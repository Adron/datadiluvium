'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSearchParams, useRouter } from 'next/navigation';
import Modal from './Modal';
import { generatorRegistry } from '../lib/generators/registry';
import type { GeneratorConfig } from '../lib/generators/types';

type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  defaultValue: string | null;
  generator?: string;
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

function SchemaInputContent() {
  const [schemaText, setSchemaText] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [schemaColumns, setSchemaColumns] = useState<SchemaColumn[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<{index: number, column: SchemaColumn} | null>(null);
  const [unselectedColumns, setUnselectedColumns] = useState<SchemaColumn[]>([]);
  const [availableGenerators, setAvailableGenerators] = useState<{ [key: string]: GeneratorConfig[] }>({});
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const loadSchema = searchParams.get('load');
    if (loadSchema) {
      const savedSchemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
      const schema = savedSchemas[loadSchema];
      if (schema) {
        setSchemaText(schema.sql);
        setSchemaColumns(schema.columns);
        // Clear the URL parameter after loading
        const url = new URL(window.location.href);
        url.searchParams.delete('load');
        window.history.replaceState({}, '', url);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const newAvailableGenerators: { [key: string]: GeneratorConfig[] } = {};
    console.log('Updating available generators for columns:', schemaColumns);
    
    schemaColumns.forEach(column => {
      console.log(`Processing column ${column.tableName}.${column.columnName} with type ${column.dataType}`);
      const compatibleGenerators = generatorRegistry.getCompatibleGenerators(column.dataType);
      console.log(`Found generators for ${column.tableName}.${column.columnName}:`, compatibleGenerators);
      newAvailableGenerators[`${column.tableName}.${column.columnName}`] = compatibleGenerators;
    });

    console.log('Final available generators:', newAvailableGenerators);
    setAvailableGenerators(newAvailableGenerators);
  }, [schemaColumns]);

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
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sql'],
      'application/sql': ['.sql']
    },
    multiple: false,
    noClick: false,
    preventDropOnDocument: true
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

        // Normalize the data type to match our generator compatibility
        const normalizedDataType = dataType.toUpperCase().trim();
        
        columns.push({
          tableName,
          columnName,
          dataType: normalizedDataType,
          defaultValue,
          generator: '' // Initialize with empty generator
        });
      });
    });

    setSchemaColumns(columns);
    
    // Log the processed columns and available generators for debugging
    console.log('Processed Columns:', columns);
    columns.forEach(col => {
      const compatibleGens = generatorRegistry.getCompatibleGenerators(col.dataType);
      console.log(`Compatible generators for ${col.tableName}.${col.columnName} (${col.dataType}):`, compatibleGens);
    });
  };

  const handleSaveSchema = (schemaName?: string) => {
    if (!schemaName?.trim()) {
      return;
    }

    // Get existing schemas from localStorage
    const savedSchemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
    
    // Save the new schema
    savedSchemas[schemaName] = {
      sql: schemaText,
      timestamp: new Date().toISOString(),
      columns: schemaColumns
    };

    // Save back to localStorage
    localStorage.setItem('savedSchemas', JSON.stringify(savedSchemas));
    
    setIsModalOpen(false);

    // Dispatch a custom event to notify Navigation component
    const event = new CustomEvent('schemasUpdated');
    window.dispatchEvent(event);
  };

  const detectSQLFeatures = (sql: string) => {
    const features: Record<string, string[]> = {
      'T-SQL': [
        'DECLARE @',
        'EXEC ',
        'EXECUTE ',
        'IDENTITY(',
        'NVARCHAR',
        'TOP ',
        'MERGE',
        'OUTPUT',
        'CROSS APPLY',
        'OUTER APPLY',
        'NOLOCK',
        'ROWGUIDCOL',
        'UNIQUEIDENTIFIER',
        'DATETIME2',
        'DATETIMEOFFSET',
      ],
      'PL/SQL': [
        'BEGIN',
        'END;',
        'DECLARE',
        'PACKAGE',
        'VARCHAR2',
        'NUMBER(',
        'CLOB',
        'NCLOB',
        'BINARY_INTEGER',
        'EXCEPTION',
        'RAISE',
        'ROWTYPE',
      ],
      'PostgreSQL': [
        'SERIAL',
        'TEXT',
        'RETURNING',
        'CREATE EXTENSION',
        'USING INDEX TABLESPACE',
        'BYTEA',
        'UUID',
        'JSONB',
        'WITH OIDS',
        'TABLESPACE',
        'CONCURRENTLY',
        'MATERIALIZED VIEW',
        'USING GIST',
        'USING GIN',
      ],
      'MySQL': [
        'ENGINE=',
        'AUTO_INCREMENT',
        'UNSIGNED',
        'SHOW ',
        'TINYINT',
        'MEDIUMINT',
        'LONGTEXT',
        'ENUM',
        'SPATIAL',
        'FULLTEXT',
      ],
      'SQLite': [
        'AUTOINCREMENT',
        'PRAGMA',
        'VACUUM',
        'WITHOUT ROWID',
        'STRICT',
        'DEFERRABLE',
      ],
      'Oracle': [
        'VARCHAR2',
        'NUMBER(',
        'ROWNUM',
        'CONNECT BY',
        'MINUS',
        'LONG RAW',
        'BFILE',
        'ROWID',
        'UROWID',
      ],
    };

    const results: SQLDialect[] = [];
    
    // Basic SQL validation checks
    const hasCreateTable = /CREATE\s+TABLE/i.test(sql);
    const hasAlterTable = /ALTER\s+TABLE/i.test(sql);
    const hasSelect = /SELECT\s+.*\s+FROM/i.test(sql);
    const hasInsert = /INSERT\s+INTO/i.test(sql);
    const hasValidParentheses = (str: string) => {
      let count = 0;
      for (const char of str) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false;
      }
      return count === 0;
    };

    const isBasicallyValidSQL = 
      (hasCreateTable || hasAlterTable || hasSelect || hasInsert) &&
      hasValidParentheses(sql) &&
      !sql.includes(';;') && // No double semicolons
      /[A-Za-z_][A-Za-z0-9_]*/.test(sql); // Contains valid identifiers

    if (!isBasicallyValidSQL) {
      return {
        isValid: false,
        error: 'Invalid SQL syntax: Missing basic SQL structure or invalid syntax',
        dialects: []
      };
    }

    // Check for dialect-specific features
    for (const [dialect, dialectFeatures] of Object.entries(features)) {
      const foundFeatures = dialectFeatures.filter(feature => 
        sql.toUpperCase().includes(feature.toUpperCase())
      );
      
      if (foundFeatures.length > 0) {
        results.push({
          name: dialect,
          isValid: true,
          confidence: (foundFeatures.length / dialectFeatures.length) * 100,
          features: foundFeatures
        });
      }
    }

    // Always include ANSI SQL if basic validation passes
    results.unshift({
      name: 'ANSI SQL',
      isValid: true,
      confidence: 100,
      features: ['Standard SQL syntax']
    });

    return {
      isValid: true,
      dialects: results.sort((a, b) => b.confidence - a.confidence)
    };
  };

  const validateGenerators = () => {
    const columnsWithoutGenerators = schemaColumns.filter(
      column => !column.generator || column.generator === ''
    );
    
    if (columnsWithoutGenerators.length > 0) {
      setUnselectedColumns(columnsWithoutGenerators);
      setIsValidationModalOpen(true);
      return false;
    }
    return true;
  };

  const handleGenerateClick = () => {
    if (validateGenerators()) {
      // Save current schema state to localStorage for the generate page
      localStorage.setItem('currentSchema', JSON.stringify({
        columns: schemaColumns,
        sql: schemaText
      }));
      router.push('/generate');
    }
  };

  const handleDeleteColumn = (index: number, column: SchemaColumn) => {
    setColumnToDelete({ index, column });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (columnToDelete !== null) {
      // Remove column from schemaColumns array
      const newColumns = [...schemaColumns];
      newColumns.splice(columnToDelete.index, 1);
      setSchemaColumns(newColumns);

      // Update SQL text by removing the column
      const { column } = columnToDelete;
      const tables = schemaText.split(/create\s+table\s+/gi);
      const updatedTables = tables.map((tableDefinition, index) => {
        if (index === 0) return tableDefinition; // Skip the first split result

        // Find the table that contains our column
        const tableNameMatch = tableDefinition.match(/[\[\`"]?(\w+)[\]\`"]?\s*\(/i);
        if (!tableNameMatch || tableNameMatch[1] !== column.tableName) {
          return 'CREATE TABLE ' + tableDefinition;
        }

        // Parse the columns
        const openParenIndex = tableDefinition.indexOf('(');
        const closeParenIndex = tableDefinition.lastIndexOf(')');
        const tableName = tableDefinition.slice(0, openParenIndex);
        const columnsText = tableDefinition.slice(openParenIndex + 1, closeParenIndex);
        const afterColumns = tableDefinition.slice(closeParenIndex);

        // Split columns and remove the target column
        const columns = columnsText.split(',').map(col => col.trim());
        const updatedColumns = columns.filter(col => {
          const colName = col.split(/\s+/)[0].replace(/[\[\]"`]/g, '');
          return colName.toLowerCase() !== column.columnName.toLowerCase();
        });

        // Reconstruct the CREATE TABLE statement
        return 'CREATE TABLE ' + tableName + '(\n  ' + updatedColumns.join(',\n  ') + afterColumns;
      });

      setSchemaText(updatedTables.join(''));
      setIsDeleteModalOpen(false);
      setColumnToDelete(null);
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600'
        }`}
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

      <div className="mt-4 flex items-center gap-4 justify-end">
        <button
          onClick={() => {
            setSchemaText('');
            setValidationResult(null);
            setSchemaColumns([]);
          }}
          className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Clear
        </button>

        <button
          onClick={() => setValidationResult(detectSQLFeatures(schemaText))}
          className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-md transition-colors"
        >
          Validate
        </button>

        <button
          onClick={processSchema}
          className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-md transition-colors"
        >
          Process Schema
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-md transition-colors"
        >
          Save Schema
        </button>

        <button
          onClick={handleGenerateClick}
          className="px-4 py-2 text-sm font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-md transition-colors"
        >
          Generate Data
        </button>
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Generator
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        <select 
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 text-sm"
                          value={column.generator || ''}
                          onChange={(e) => {
                            console.log(`Changing generator for ${column.tableName}.${column.columnName} to:`, e.target.value);
                            const newColumns = [...schemaColumns];
                            newColumns[index] = { ...column, generator: e.target.value };
                            setSchemaColumns(newColumns);
                          }}
                        >
                          <option value="">Select Generator</option>
                          {(() => {
                            const generators = availableGenerators[`${column.tableName}.${column.columnName}`] || [];
                            console.log(`Rendering generators for ${column.tableName}.${column.columnName}:`, generators);
                            return generators.map((gen: GeneratorConfig) => (
                              <option key={gen.name} value={gen.name.replace(/\s+/g, '').toLowerCase()}>
                                {gen.name} - {gen.description}
                              </option>
                            ));
                          })()}
                        </select>
                        <button
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          onClick={() => handleDeleteColumn(index, column)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleSaveSchema}
        title="Save Schema"
        inputLabel="Schema Name"
        confirmText="Save"
      />

      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        title="Missing Generator Selections"
        confirmText="OK"
        onConfirm={() => setIsValidationModalOpen(false)}
        hideInput
      >
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="mb-3">Please select generators for the following columns:</p>
          <ul className="list-disc pl-5 space-y-1">
            {unselectedColumns.map((column, index) => (
              <li key={index}>
                <span className="font-medium">{column.tableName}</span>
                .
                <span className="font-medium">{column.columnName}</span>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setColumnToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        confirmText="Delete"
        hideInput
      >
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>Are you sure you want to delete this column? Both the column in the grid will be deleted and in the SQL DDL.</p>
          {columnToDelete && (
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <p><span className="font-medium">Table:</span> {columnToDelete.column.tableName}</p>
              <p><span className="font-medium">Column:</span> {columnToDelete.column.columnName}</p>
              <p><span className="font-medium">Type:</span> {columnToDelete.column.dataType}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function SchemaInput() {
  return (
    <Suspense fallback={<div>Loading schema editor...</div>}>
      <SchemaInputContent />
    </Suspense>
  );
} 