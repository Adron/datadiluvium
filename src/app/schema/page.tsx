import { Suspense } from 'react';
import Navigation from "../components/Navigation";
import SchemaInput from "../components/SchemaInput";

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
          
          <Suspense fallback={<div>Loading...</div>}>
            <SchemaInput />
          </Suspense>
        </div>
      </div>
    </>
  );
} 