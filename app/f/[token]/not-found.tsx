import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-6">
            The form you're looking for doesn't exist or may have been removed.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>This could happen if:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>The form link is incorrect or incomplete</li>
              <li>The form has expired</li>
              <li>The form has been deleted</li>
            </ul>
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-600">
              Please check your link or contact the person who sent you this form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}