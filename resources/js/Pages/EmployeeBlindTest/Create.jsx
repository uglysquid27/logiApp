import React, { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Create() {
    const { employee, defaultDate } = usePage().props;
    const [formData, setFormData] = useState({
      test_date: defaultDate,
      result: ''
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    router.post(route('employee-blind-test.store', employee.id), formData);
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Add Blind Test Result
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Add Blind Test Result for {employee.name} (NIK: {employee.nik})
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Please fill in the blind test details below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="test_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Date
            </label>
            <input
              type="date"
              id="test_date"
              name="test_date"
              value={formData.test_date}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="result" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Test Score (0-100)
            </label>
            <input
              type="number"
              id="result"
              name="result"
              min="0"
              max="100"
              value={formData.result}
              onChange={handleChange}
              className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm w-full"
              required
            />
          </div>
        </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Link
                    href={route('employee-blind-test.index')}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-md font-medium text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                  >
                    Save Result
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}