import React from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Show() {
  const { employee, blindTests } = usePage().props;

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this blind test result?')) {
      router.delete(route('employee-blind-test.destroy', id), {
        preserveScroll: true,
        onSuccess: () => {
          // Optional: Show success message
        }
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Blind Test History
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                    Blind Test History for {employee.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    NIK: {employee.nik}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={route('employee-blind-test.create', employee.id)}
                    className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                  >
                    Add New Result
                  </Link>
                  <Link
                    href={route('employee-blind-test.index')}
                    className="bg-gray-600 hover:bg-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                  >
                    Back to List
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Test Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Result</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {blindTests.data.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center">
                          No blind test results found for this employee.
                        </td>
                      </tr>
                    ) : (
                      blindTests.data.map((test) => (
                        <tr key={test.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {new Date(test.test_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                              test.result === 'Pass' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' :
                              test.result === 'Fail' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100' :
                              test.result === 'Excellent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100'
                            }`}>
                              {test.result}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap">
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {blindTests.links.length > 3 && (
                <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-6">
                  {blindTests.links.map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-3 py-1 rounded-md text-sm ${link.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${!link.url && 'pointer-events-none opacity-50'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      preserveScroll
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}