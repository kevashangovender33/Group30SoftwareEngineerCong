import { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [health, setHealth] = useState<string>('loading...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealth(data.status);
      } catch {
        setHealth('error');
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center text-indigo-600 mb-6">Node Conf Starter</h1>

        <div className="space-y-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Backend Status</p>
            <p className="text-2xl font-bold text-indigo-600 capitalize" data-testid="health">
              {health}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Counter</p>
            <p className="text-2xl font-bold text-blue-600" data-testid="count">
              {count}
            </p>
            <button
              onClick={() => setCount((c) => c + 1)}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Increment
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">Welcome to your full-stack starter!</p>
            <p>Edit files to get started.</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">Stack:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ React 18 + Vite</li>
              <li>✓ Express + Node.js</li>
              <li>✓ SQLite + Prisma</li>
              <li>✓ Tailwind CSS</li>
              <li>✓ Vitest + Playwright</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
