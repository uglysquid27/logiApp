import React from 'react';
import { Link } from '@inertiajs/react';
import EmployeeStatusBadge from './EmployeeStatusBadge';
import EmployeeActions from './EmployeeActions';

const EmployeeCards = ({ employees, isUser }) => {
  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Tidak ada data pegawai dengan kriteria filter ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:hidden space-y-4">
      {employees.map((employee) => (
        <div key={employee.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">{employee.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{employee.nik}</p>
            </div>
            <div className="flex flex-col items-end">
              <EmployeeStatusBadge status={employee.status} />
              <span className={`mt-1 px-2 py-1 text-xs font-semibold rounded-full ${employee.cuti === 'yes' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                Cuti: {employee.cuti}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mt-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Gender</p>
              <p>{employee.gender}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tipe</p>
              <p>{employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Sub Section</p>
              <p>{employee.sub_sections && employee.sub_sections.length > 0 ? employee.sub_sections.map(ss => ss.name).join(', ') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Section</p>
              <p>{employee.sub_sections && employee.sub_sections.length > 0 ? [...new Set(employee.sub_sections.map(ss => ss.section?.name || 'N/A'))].join(', ') : 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Total</p>
              <p>{employee.total_work_count || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Minggu Ini</p>
              <p>{employee.weekly_work_count || 0}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Workload</p>
              <p>{employee.workload_point !== undefined ? employee.workload_point : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Rating</p>
              <p>{employee.calculated_rating !== undefined ? employee.calculated_rating : 'N/A'}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
            <EmployeeActions employee={employee} isUser={isUser} isMobile />
            <Link
              href={route('ratings.create', employee.id)}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
            >
              Rate ({employee.ratings_count || 0})
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeCards;