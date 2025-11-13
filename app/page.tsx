export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">
          Private Tutoring Dashboard Platform
        </h1>
        <p className="text-xl mb-8">
          Track student progress with intelligent daily question logging
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Status</h2>
          <p className="mb-2">✅ Project structure initialized</p>
          <p className="mb-2">✅ Database schema configured</p>
          <p className="mb-2">✅ Railway deployment ready</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Next: Deploy to Railway and run database migrations
          </p>
        </div>
      </div>
    </main>
  );
}

