import React, { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Inactive() {
  const { employees: paginationData, filters } = usePage().props;
  const employees = paginationData.data;
  const paginationLinks = paginationData.links;
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Status badge styling (consistent with Index)
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

  // Handle search
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    router.get(route('employee-attendance.inactive'), {
      search: newSearchTerm || undefined,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Daftar Pegawai Nonaktif
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              {/* Header and Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Daftar Pegawai Nonaktif
                </h1>
                <div className="flex gap-3">
                  <Link
                    href={route('employee-attendance.index')}
                    className="bg-indigo-600 hover:bg-indigo-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                  >
                    Kembali ke Daftar Aktif
                  </Link>
                </div>
              </div>

              {/* Search Filter */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Cari nama atau NIK..."
                  className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-4">
                {employees.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Tidak ada data pegawai nonaktif
                      </p>
                    </div>
                  </div>
                ) : (
                  employees.map((employee) => (
                    <div key={employee.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-700 dark:text-gray-300">{employee.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{employee.nik}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(employee.status)}`}>
                            {employee.status}
                          </span>
                          <span className={`mt-1 px-2 py-1 text-xs font-semibold rounded-full ${employee.cuti === 'yes' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                            Cuti: {employee.cuti}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Alasan Nonaktif</p>
                          <p>{employee.deactivation_reason || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Tanggal Nonaktif</p>
                          <p>{employee.deactivated_at ? new Date(employee.deactivated_at).toLocaleDateString('id-ID') : '-'}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-2">
                        <Link
                          href={route('employee-attendance.edit', employee.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          method="delete"
                          href={route('employee-attendance.destroy', employee.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                          as="button"
                        >
                          Hapus
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NIK</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Alasan Nonaktif</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal Nonaktif</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          Tidak ada data pegawai nonaktif
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-gray-100">{employee.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{employee.gender}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.nik}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.deactivation_reason || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {employee.deactivated_at ? new Date(employee.deactivated_at).toLocaleDateString('id-ID') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClasses(employee.status)}`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={route('employee-attendance.edit', employee.id)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                            >
                              Edit
                            </Link>
                            <Link
                              method="delete"
                              href={route('employee-attendance.destroy', employee.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              as="button"
                            >
                              Hapus
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationLinks.length > 3 && (
                <div className="mt-4 flex justify-center">
                  <nav className="flex items-center space-x-1">
                    {paginationLinks.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url || '#'}
                        className={`px-3 py-1 rounded-md text-sm ${
                          link.active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        } ${!link.url && 'pointer-events-none opacity-50'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        preserveScroll
                      />
                    ))}
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}