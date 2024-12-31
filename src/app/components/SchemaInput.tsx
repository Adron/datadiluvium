'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          setSchemaText(text);
          setValidationResult(null);
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
      'DB2': [
        'SYSIBM',
        'CURRENT SCHEMA',
        'DECLARE GLOBAL TEMPORARY TABLE',
        'RCDFMT',
        'SPECIFIC',
        'SECURED',
        'VOLATILE',
        'CARDINALITY',
        'BUSINESS_TIME',
      ],
      'MariaDB': [
        'ENGINE=',
        'AUTO_INCREMENT',
        'UNSIGNED',
        'SHOW ',
        'LONGTEXT',
        'MEDIUMTEXT',
        'DYNAMIC',
        'PAGE_CHECKSUM',
      ],
      'Snowflake': [
        'VARIANT',
        'OBJECT',
        'ARRAY',
        'WAREHOUSE',
        'CLONE',
        'LATERAL FLATTEN',
        'QUALIFY',
        'SAMPLE',
        'SEMI_STRUCTURED',
      ],
      'BigQuery': [
        'STRUCT<',
        'ARRAY<',
        'PARTITION BY',
        'CLUSTER BY',
        'GEOGRAPHY',
        'DATETIME(',
        'TIMESTAMP(',
        'BIGNUMERIC',
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

  const validateSchema = () => {
    const result = detectSQLFeatures(schemaText);
    setValidationResult(result);
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

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => {
            setSchemaText('');
            setValidationResult(null);
          }}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          Clear
        </button>
        {schemaText && (
          <>
            <button
              onClick={validateSchema}
              className="px-4 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
            >
              Validate Schema
            </button>
            <button
              onClick={() => {/* TODO: Handle schema processing */}}
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
            >
              Process Schema
            </button>
          </>
        )}
      </div>
    </div>
  );
} 