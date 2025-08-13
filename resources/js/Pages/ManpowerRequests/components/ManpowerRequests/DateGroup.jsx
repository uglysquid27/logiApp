// components/ManpowerRequests/DateGroup.jsx
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import RequestItem from './RequestItem';

export default function DateGroup({ date, requests, formatDate, getStatusClasses, onDelete, onRevision, isUser }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{date}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
          {requests.length} request{requests.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((request) => (
            <RequestItem
              key={request.id}
              request={request}
              formatDate={formatDate}
              getStatusClasses={getStatusClasses}
              onDelete={onDelete}
              onRevision={onRevision}
              isUser={isUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}