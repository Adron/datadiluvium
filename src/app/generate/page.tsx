import Navigation from "../components/Navigation";

export default function GeneratePage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen p-8 sm:p-20 ml-48">
        <h1 className="text-3xl font-bold mb-6">Generate to</h1>
        <div className="max-w-4xl">
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Transform your schema into various output formats while maintaining data integrity.
            Choose your target format and customize the generation settings to meet your needs.
          </p>
          
          {/* Placeholder for generation interface */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 border border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generation interface will be implemented here
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 