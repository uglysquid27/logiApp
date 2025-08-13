import React from 'react';

const getStatusClasses = (status) => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100';
    case 'assigned':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100';
    case 'deactivated':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
  }
};

const EmployeeStatusBadge = ({ status }) => {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(status)}`}>
      {status}
    </span>
  );
};

export default EmployeeStatusBadge;