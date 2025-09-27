'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-red-50 rounded-lg p-6">
          <div className="w-12 h-12 mx-auto mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error while loading your form. Please try again.
          </p>
          <button
            onClick={reset}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}