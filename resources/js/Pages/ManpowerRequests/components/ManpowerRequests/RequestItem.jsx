// components/ManpowerRequests/RequestItem.jsx
import { Link } from '@inertiajs/react';

export default function RequestItem({ request, formatDate, getStatusClasses, onDelete, onRevision, isUser }) {
  return (
    <div className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex justify-between items-center">
        <div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {request.sub_section?.name || 'N/A'} - {request.shift?.name || 'N/A'}
          </span>
        </div>
        <div className="flex space-x-2">
          <Link
            href={route('manpower-requests.edit', request.id)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            View
          </Link>
          {request.status === 'pending' && !isUser && (
            <Link
              href={route('manpower-requests.fulfill', request.id)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              Fulfill
            </Link>
          )}
          <button
            onClick={() => onDelete(request.id)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400">Total</div>
          <div>{request.requested_amount}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400">Male</div>
          <div>{request.male_count}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400">Female</div>
          <div>{request.female_count}</div>
        </div>
      </div>
    </div>
  );
}