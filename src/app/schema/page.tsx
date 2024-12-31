import Navigation from "../components/Navigation";

export default function SchemaPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen p-8 sm:p-20 ml-48">
        <h1 className="text-3xl font-bold mb-6">Schema from</h1>
        <div className="max-w-4xl">
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Define and input your data schema from various sources. This tool helps you structure your data
            and establish relationships that will be used in the generation process.
          </p>
          
          {/* Placeholder for schema input interface */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Schema input interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 