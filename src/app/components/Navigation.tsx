import Link from "next/link";

export default function Navigation() {
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
      </ul>
    </nav>
  );
} 