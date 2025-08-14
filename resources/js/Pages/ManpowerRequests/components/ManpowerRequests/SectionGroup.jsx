import { useState, useMemo } from 'react';
import DateGroup from './DateGroup';

export default function SectionGroup({ section, requests, formatDate, getStatusClasses, onDelete, onRevision, isUser, initialOpen = false }) {
  const [isOpen, setIsOpen] = useState(!!initialOpen);

  const requestsByDate = useMemo(() => {
    const map = {};
    (requests || []).forEach((req) => {
      const d = new Date(req.date);
      const key = isNaN(d) ? String(req.date) : d.toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(req);
    });
    return map;
  }, [requests]);

  const sortedDateKeys = useMemo(() => {
    return Object.keys(requestsByDate).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      return da - db;
    });
  }, [requestsByDate]);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{section?.name}</h3>
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
          {sortedDateKeys.map((dateKey) => (
            <DateGroup
              key={dateKey}
              date={dateKey}
              requests={requestsByDate[dateKey]}
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