import React, { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  const { employees } = usePage().props;

  // State for the selected status filter, default to 'aktif'
  const [filterStatus, setFilterStatus] = useState('aktif');

  // Get all unique statuses from the employees data
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(employees.map(employee => employee.status));
    return ['All', ...Array.from(statuses).sort()]; // Add 'All' option and sort alphabetically
  }, [employees]);

  // Filter employees based on the selected status
  const filteredEmployees = useMemo(() => {
    if (filterStatus === 'All') {
      return employees;
    }
    return employees.filter(employee => employee.status === filterStatus);
  }, [employees, filterStatus]);

  // Calculate the total historical schedules count for the FILTERED employees
  const totalSchedulesCount = filteredEmployees.reduce((sum, employee) => {
    return sum + (employee.schedules_count || 0); // Add schedules_count, default to 0 if undefined
  }, 0);

  // Calculate the total weekly schedules count for the FILTERED employees
  const totalWeeklySchedulesCount = filteredEmployees.reduce((sum, employee) => {
    return sum + (employee.schedules_count_weekly || 0); // Add schedules_count_weekly, default to 0 if undefined
  }, 0);

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Ringkasan Kehadiran Pegawai
        </h2>
      }
    >
      <div className="py-8">
        <div className="mx-auto sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <h1 className="mb-6 font-bold text-gray-700 dark:text-gray-300 text-2xl">
                Ringkasan Penugasan Pegawai
              </h1>

              {/* Filter Dropdown */}
              <div className="flex items-center mb-4">
                <label htmlFor="statusFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Filter Status:
                </label>
                <select
                  id="statusFilter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block bg-white dark:bg-gray-700 shadow-sm mt-1 px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                >
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)} {/* Capitalize first letter */}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white dark:bg-gray-800 mt-6 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto">
                <table className="divide-y divide-gray-200 dark:divide-gray-700 min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Nama Pegawai
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        NIK
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Penugasan (Keseluruhan)
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Penugasan (Minggu Ini)
                      </th> {/* This is the added column header */}
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Hour
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center">
                          Tidak ada data pegawai dengan status ini.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                            {employee.name}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.nik}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.schedules_count}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.schedules_count_weekly} {/* This is the added column data */}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.status}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total row */}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <td colSpan="2" className="px-6 py-3 text-right">Total Penugasan (Keseluruhan):</td>
                      <td className="px-6 py-3 text-center">{totalSchedulesCount}</td>
                      <td className="px-6 py-3 text-center">{totalWeeklySchedulesCount}</td> {/* This is the added total for the week */}
                      <td colSpan="2" className="px-6 py-3 text-center"></td> {/* Empty cells for Total Hour and Status */}
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
