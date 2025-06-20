import React, { useState } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  const { employees: paginationData, filters, uniqueStatuses, uniqueSections, uniqueSubSections } = usePage().props;
  const employees = paginationData.data;
  const paginationLinks = paginationData.links;

  // State for filters
  const [filterStatus, setFilterStatus] = useState(filters.status || 'All');
  const [filterSection, setFilterSection] = useState(filters.section || 'All');
  const [filterSubSection, setFilterSubSection] = useState(filters.sub_section || 'All');
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Helper function for status badges
  const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100';
      case 'assigned':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Apply filters
  const applyFilters = (newFilters) => {
    router.get(window.location.pathname, {
      status: newFilters.status !== 'All' ? newFilters.status : undefined,
      section: newFilters.section !== 'All' ? newFilters.section : undefined,
      sub_section: newFilters.sub_section !== 'All' ? newFilters.sub_section : undefined,
      search: newFilters.search || undefined,
      page: 1,
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    });
  };

  // Handle filter changes
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    applyFilters({ status: newStatus, section: filterSection, sub_section: filterSubSection, search: searchTerm });
  };

  const handleSectionChange = (e) => {
    const newSection = e.target.value;
    setFilterSection(newSection);
    setFilterSubSection('All');
    applyFilters({ status: filterStatus, section: newSection, sub_section: 'All', search: searchTerm });
  };

  const handleSubSectionChange = (e) => {
    const newSubSection = e.target.value;
    setFilterSubSection(newSubSection);
    applyFilters({ status: filterStatus, section: filterSection, sub_section: newSubSection, search: searchTerm });
  };

  // Handle search term change
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    applyFilters({ status: filterStatus, section: filterSection, sub_section: filterSubSection, search: newSearchTerm });
  };

  // Calculate totals
  const totalSchedulesCount = employees.reduce((sum, employee) => sum + (employee.schedules_count || 0), 0);
  const totalWeeklySchedulesCount = employees.reduce((sum, employee) => sum + (employee.schedules_count_weekly || 0), 0);

  // Handle reset all statuses
  const handleResetAllStatuses = () => {
    if (confirm('Apakah Anda yakin ingin mereset status semua karyawan menjadi "available" dan "cuti: no"? Tindakan ini tidak dapat dibatalkan.')) {
      router.post(route('employee-attendance.reset-all-statuses'), {}, {
        onSuccess: () => {
          alert('Semua status karyawan berhasil direset.');
          router.reload({ preserveState: false, preserveScroll: false });
        },
        onError: (errors) => {
          console.error('Gagal mereset status karyawan:', errors);
          alert('Terjadi kesalahan saat mereset status karyawan. Silakan coba lagi.');
        },
      });
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Ringkasan Kehadiran Pegawai
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Ringkasan Penugasan Pegawai
                </h1>
                <button
                  onClick={handleResetAllStatuses}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 sm:px-4 sm:py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                >
                  Reset Semua Status
                </button>
              </div>

              {/* Mobile Filters */}
              <div className="sm:hidden space-y-3 mb-4">
                <div className="w-full">
                  <label htmlFor="mobileStatusFilter" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Status
                  </label>
                  <select
                    id="mobileStatusFilter"
                    value={filterStatus}
                    onChange={handleStatusChange}
                    className="w-full bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <label htmlFor="mobileSectionFilter" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Section
                  </label>
                  <select
                    id="mobileSectionFilter"
                    value={filterSection}
                    onChange={handleSectionChange}
                    className="w-full bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueSections.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <label htmlFor="mobileSubSectionFilter" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Sub Section
                  </label>
                  <select
                    id="mobileSubSectionFilter"
                    value={filterSubSection}
                    onChange={handleSubSectionChange}
                    className="w-full bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueSubSections.map(subSection => (
                      <option key={subSection} value={subSection}>
                        {subSection}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <label htmlFor="mobileSearchEmployee" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Cari Nama/NIK
                  </label>
                  <input
                    type="text"
                    id="mobileSearchEmployee"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Cari nama atau NIK..."
                    className="w-full bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>

              {/* Desktop Filters */}
              <div className="hidden sm:flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center">
                  <label htmlFor="statusFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={handleStatusChange}
                    className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label htmlFor="sectionFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Section:
                  </label>
                  <select
                    id="sectionFilter"
                    value={filterSection}
                    onChange={handleSectionChange}
                    className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueSections.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label htmlFor="subSectionFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Sub Section:
                  </label>
                  <select
                    id="subSectionFilter"
                    value={filterSubSection}
                    onChange={handleSubSectionChange}
                    className="bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    {uniqueSubSections.map(subSection => (
                      <option key={subSection} value={subSection}>
                        {subSection}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center flex-1 min-w-[200px]">
                  <label htmlFor="searchEmployee" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Cari:
                  </label>
                  <input
                    type="text"
                    id="searchEmployee"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Nama/NIK..."
                    className="w-full bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
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
                        Tidak ada data pegawai dengan kriteria filter ini
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
                          <p>{employee.schedules_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Minggu Ini</p>
                          <p>{employee.schedules_count_weekly}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Workload</p>
                          <p>{employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}</p>
                        </div>
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
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NIK</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipe</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sub Section</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Section</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Minggu Ini</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Workload</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cuti</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center">
                          Tidak ada data pegawai dengan kriteria filter atau pencarian ini.
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{employee.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{employee.gender}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{employee.nik}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {employee.sub_sections && employee.sub_sections.length > 0 ? employee.sub_sections.map(ss => ss.name).join(', ') : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {employee.sub_sections && employee.sub_sections.length > 0 ? [...new Set(employee.sub_sections.map(ss => ss.section?.name || 'N/A'))].join(', ') : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">{employee.schedules_count}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">{employee.schedules_count_weekly}</td>
                          <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center">
                            {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClasses(employee.status)}`}>
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${employee.cuti === 'yes' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-100' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100'}`}>
                              {employee.cuti}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <td colSpan="6" className="px-4 py-3 text-right">Total Penugasan:</td>
                      <td className="px-4 py-3 text-center">{totalSchedulesCount}</td>
                      <td className="px-4 py-3 text-center">{totalWeeklySchedulesCount}</td>
                      <td colSpan="3" className="px-4 py-3 text-center"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginationLinks.length > 3 && (
                <div className="flex flex-wrap justify-center sm:justify-end gap-2 mt-6">
                  {paginationLinks.map((link, index) => (
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