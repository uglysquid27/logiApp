import React from 'react';

const UpdateWorkloadModal = ({ show, onClose, onConfirm, processing }) => {
  if (!show) return null;

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Update All Workload Data
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        This will scan all schedules and update workload data for all employees.
        The process may take some time depending on the number of employees and schedules.
        Are you sure you want to proceed?
      </p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={processing}
          className={`px-4 py-2 text-white rounded-md transition-colors ${processing ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {processing ? 'Processing...' : 'Confirm Update'}
        </button>
      </div>
    </div>
  );
};

export default UpdateWorkloadModal;