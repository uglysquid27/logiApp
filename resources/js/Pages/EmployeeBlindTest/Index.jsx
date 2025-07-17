import React, { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  const { employees, filters } = usePage().props;
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    router.get(route('employee-blind-test.index'), {
      search: newSearchTerm || undefined,
      page: 1,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  // Function to get the latest test result
  const getLatestResult = (blindTests) => {
    if (!blindTests || blindTests.length === 0) return null;
    
    // Sort by test_date descending to get the latest
    const sortedTests = [...blindTests].sort((a, b) => 
      new Date(b.test_date) - new Date(a.test_date)
    );
    
    return sortedTests[0];
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Blind Test Management
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Employee Blind Test Results
                </h1>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by name or NIK..."
                    className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NIK</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Test Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Result</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.data.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center">
                          No employees found with the current search criteria.
                        </td>
                      </tr>
                    ) : (
                      employees.data.map((employee) => {
                        const latestTest = getLatestResult(employee.blind_tests);
                        
                        return (
                          <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{employee.name}</td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{employee.nik}</td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {latestTest ? new Date(latestTest.test_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {latestTest ? (
                                <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                                  latestTest.result >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100' :
                                  latestTest.result >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100' :
                                  latestTest.result >= 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100' :
                                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100'
                                }`}>
                                  {latestTest.result}/100
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Link
                                  href={route('employee-blind-test.show', employee.id)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  View History
                                </Link>
                                <Link
                                  href={route('employee-blind-test.create', employee.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                >
                                  Add Result
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {employees.links.length > 3 && (
                <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-6">
                  {employees.links.map((link, index) => (
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