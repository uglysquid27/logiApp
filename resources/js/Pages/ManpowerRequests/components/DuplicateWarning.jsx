// js/pages/ManpowerRequests/Create/components/DuplicateWarning.jsx
export default function DuplicateWarning({
  duplicateRequests,
  setShowDuplicateWarning,
  processSubmission
}) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Permintaan serupa sudah ada
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              Kami menemukan permintaan yang sama untuk shift berikut:
            </p>
            <ul className="list-disc pl-5 mt-1">
              {duplicateRequests.map(req => (
                <li key={req.id}>
                  {req.shift_name} - {req.requested_amount} orang
                </li>
              ))}
            </ul>
            <p className="mt-2">
              Silakan berikan alasan untuk permintaan tambahan ini.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setShowDuplicateWarning(false)}
          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={processSubmission}
          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm"
        >
          Submit Permintaan Tambahan
        </button>
      </div>
    </div>
  );
}