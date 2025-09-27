export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Loading form...</h2>
        <p className="text-gray-600">Please wait while we prepare your form.</p>
      </div>
    </div>
  );
}