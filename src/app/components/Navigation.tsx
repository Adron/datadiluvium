'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type SavedSchema = {
  sql: string;
  timestamp: string;
  columns: any[];
};

type SavedSchemas = {
  [key: string]: SavedSchema;
};

export default function Navigation() {
  const pathname = usePathname();
  const [savedSchemas, setSavedSchemas] = useState<SavedSchemas>({});

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
                    <li key={name}>
                      <Link
                        href={`/schema?load=${encodeURIComponent(name)}`}
                        className="block px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {name}
                      </Link>
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