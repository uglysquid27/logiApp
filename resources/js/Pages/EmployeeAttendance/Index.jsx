import React from 'react';
import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  // The 'employees' prop will contain each employee with their schedules_count and working_day_weight
  const { employees } = usePage().props;

  // Calculate the total schedules count
  const totalSchedulesCount = employees.reduce((sum, employee) => {
    return sum + (employee.schedules_count || 0); // Add schedules_count, default to 0 if undefined
  }, 0);

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Ringkasan Kehadiran Pegawai
        </h2>
      }
    >
      <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-6">
                Ringkasan Penugasan Pegawai
              </h1>

              <div className="overflow-x-auto mt-6 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Nama Pegawai
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        NIK
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Penugasan (Hari/Shift)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Hour
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          Tidak ada data pegawai atau penugasan.
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.nik}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {employee.schedules_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total row */}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <td colSpan="3" className="px-6 py-3 text-right">Total Penugasan:</td> {/* Changed label here */}
                      <td className="px-6 py-3 text-center">{totalSchedulesCount}</td> {/* Changed sum variable here */}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
