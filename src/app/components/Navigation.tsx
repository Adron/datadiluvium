'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type SchemaColumn = {
  tableName: string;
  columnName: string;
  dataType: string;
  defaultValue: string | null;
  generator?: string;
};

type SavedSchema = {
  sql: string;
  timestamp: string;
  columns: SchemaColumn[];
};

type SavedSchemas = {
  [key: string]: SavedSchema;
};

export default function Navigation() {
  const pathname = usePathname();
  const [savedSchemas, setSavedSchemas] = useState<SavedSchemas>({});
  const [schemaToDelete, setSchemaToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Load saved schemas on mount
    const loadSavedSchemas = () => {
      const schemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
      setSavedSchemas(schemas);
    };

    // Load initially
    loadSavedSchemas();

    // Listen for updates
    const handleSchemasUpdated = () => {
      loadSavedSchemas();
    };

    window.addEventListener('schemasUpdated', handleSchemasUpdated);

    return () => {
      window.removeEventListener('schemasUpdated', handleSchemasUpdated);
    };
  }, []);

  const handleDeleteSchema = (name: string) => {
    setSchemaToDelete(name);
  };

  const confirmDelete = () => {
    if (schemaToDelete) {
      const updatedSchemas = { ...savedSchemas };
      delete updatedSchemas[schemaToDelete];
      localStorage.setItem('savedSchemas', JSON.stringify(updatedSchemas));
      setSavedSchemas(updatedSchemas);
      setSchemaToDelete(null);

      // Dispatch event to notify other components
      const event = new CustomEvent('schemasUpdated');
      window.dispatchEvent(event);
    }
  };

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Diluvium
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Navigation
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname === '/'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Home
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Schema Commands
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/schema"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname === '/schema'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Create Schema
                </Link>
              </li>
            </ul>
          </div>

          {Object.keys(savedSchemas).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Saved Schemas
              </h3>
              <ul className="space-y-1">
                {Object.entries(savedSchemas)
                  .sort(([, a], [, b]) => 
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )
                  .map(([name]) => (
                    <li key={name} className="group relative">
                      {schemaToDelete === name ? (
                        // Confirmation UI
                        <div className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                          <span className="flex-1 min-w-0 truncate">Delete "{name}"?</span>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                confirmDelete();
                              }}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                              title="Confirm Delete"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSchemaToDelete(null);
                              }}
                              className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              title="Cancel Delete"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Normal UI
                        <div className="flex items-center px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Link
                            href={`/schema?load=${encodeURIComponent(name)}`}
                            className="flex-1 min-w-0 mr-2"
                            title={name}
                          >
                            <span className="block truncate w-[110px]">
                              {name}
                            </span>
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSchemaToDelete(name);
                            }}
                            className="flex-shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Schema"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="hidden group-hover:block absolute left-full ml-2 top-0 z-20 w-48 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {name}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Generation Commands
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/generate"
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname === '/generate'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Generate Data
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
} 