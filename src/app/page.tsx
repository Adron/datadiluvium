import Image from "next/image";
import Link from "next/link";
import Navigation from "./components/Navigation";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Navigation />

      {/* Main Content - Content sections */}
      <main className="flex flex-col gap-12 row-start-2 ml-48">
        {/* Schema From Section */}
        <Link href="/schema" className="block">
          <section className="w-full max-w-2xl p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-4">Schema from...</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              This section allows you to input and define your data schema from various sources. 
              You can specify the structure and relationships of your data, which will serve as the foundation for generating your desired outputs.
            </p>
          </section>
        </Link>

        {/* Generate To Section */}
        <Link href="/generate" className="block">
          <section className="w-full max-w-2xl p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
            <h2 className="text-2xl font-bold mb-4">Generate to...</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Here you can transform your schema into various output formats and configurations. 
              This powerful generation tool helps you convert your data structure into the desired target format while maintaining data integrity and relationships.
            </p>
          </section>
        </Link>
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center ml-48">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
