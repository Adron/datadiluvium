'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const getPageCommands = () => {
    switch (pathname) {
      case '/schema':
        return {
          title: 'Schema Commands',
          commands: [
            { href: '#save', label: 'Save Schema' },
            { href: '#validate', label: 'Validate Schema' },
            { href: '#export', label: 'Export Schema' }
          ]
        };
      case '/generate':
        return {
          title: 'Generate Commands',
          commands: [
            { href: '#configure', label: 'Configure Output' },
            { href: '#preview', label: 'Preview Generation' },
          ]
        };
      default:
        return null;
    }
  };

  const pageCommands = getPageCommands();

  return (
    <nav className="fixed left-0 top-0 h-full w-48 bg-gray-50 dark:bg-gray-900 p-6 border-r border-gray-200 dark:border-gray-800">
      <ul className="space-y-4">
        <li>
          <Link href="/" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
            Home
          </Link>
        </li>
        <li className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <Link href="/schema" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
            Schema from
          </Link>
        </li>
        <li>
          <Link href="/generate" className="text-sm hover:text-gray-600 dark:hover:text-gray-300">
            Generate to
          </Link>
        </li>

        {pageCommands && pageCommands.commands.length > 0 && (
          <li className="pt-6 mt-2 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {pageCommands.title}
            </h3>
            <ul className="space-y-2 pl-2">
              {pageCommands.commands.map((command) => (
                <li key={command.href}>
                  <Link 
                    href={command.href}
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {command.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        )}
      </ul>
    </nav>
  );
} 