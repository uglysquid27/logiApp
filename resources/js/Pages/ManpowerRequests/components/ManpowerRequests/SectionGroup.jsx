// components/ManpowerRequests/SectionGroup.jsx
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import DateGroup from './DateGroup';

export default function SectionGroup({ section, requests, formatDate, getStatusClasses, onDelete, onRevision, isUser }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group requests by date
  const requestsByDate = requests.reduce((acc, request) => {
    const date = formatDate(request.date);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(request);
    return acc;
  }, {});

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          {section.name}
        </h3>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {Object.entries(requestsByDate).map(([date, dateRequests]) => (
            <DateGroup
              key={date}
              date={date}
              requests={dateRequests}
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