import React from 'react';

const ResetStatusModal = ({ show, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Reset All Employee Statuses
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Apakah Anda yakin ingin mereset status semua karyawan menjadi "available" dan "cuti: no"?
        Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi semua karyawan dalam sistem.
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
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Confirm Reset
        </button>
      </div>
    </div>
  );
};

export default ResetStatusModal;