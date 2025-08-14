import { Link, usePage } from '@inertiajs/react';

export default function RequestItem({ request, formatDate, getStatusClasses, onDelete, onRevision }) {
  const { auth } = usePage().props;
  const isUser = auth.user.role === 'user';

  const getShiftLabel = (req) => {
    if (req?.shift && (req.shift.name || typeof req.shift === 'string')) {
      return req.shift.name || String(req.shift);
    }
    if (req?.shift_id) return `Shift ${req.shift_id}`;
    if (typeof req?.shift === 'number') return `Shift ${req.shift}`;
    return 'N/A';
  };

  return (
    <div className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <div className="mb-2 sm:mb-0">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
          <div className="mt-1 sm:mt-0 sm:ml-2 sm:inline-block text-sm text-gray-700 dark:text-gray-300 truncate">
            {(request.sub_section?.name || 'N/A')} - {getShiftLabel(request)}
          </div>
        </div>
        <div className="flex justify-end sm:justify-start space-x-2">
          {/* View Button with Eye Icon */}
          <Link
            href={route('manpower-requests.edit', request.id)}
            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>

          {/* Fulfill Button with Check Icon (only for admin) */}
          {request.status === 'pending' && !isUser && (
            <Link
              href={route('manpower-requests.fulfill', request.id)}
              className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Fulfill"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </Link>
          )}

          {/* Delete Button with Trash Icon */}
          <button
            onClick={() => onDelete(request.id)}
            className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total</div>
          <div className="font-medium">{request.requested_amount}</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Male</div>
          <div className="font-medium">{request.male_count}</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Female</div>
          <div className="font-medium">{request.female_count}</div>
        </div>
      </div>
    </div>
  );
}