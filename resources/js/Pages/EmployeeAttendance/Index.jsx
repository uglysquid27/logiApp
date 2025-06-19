import React, { useState, useMemo } from 'react';
import { usePage, Link, router } from '@inertiajs/react'; // Pastikan 'router' diimport
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  const { employees: paginationData, filters, uniqueStatuses, uniqueSections, uniqueSubSections } = usePage().props;

  const employees = paginationData.data;
  const paginationLinks = paginationData.links;

  // State for filters, initialized from props
  const [filterStatus, setFilterStatus] = useState(filters.status || 'All');
  const [filterSection, setFilterSection] = useState(filters.section || 'All');
  const [filterSubSection, setFilterSubSection] = useState(filters.sub_section || 'All');
  // State for search term, initialized from props
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Helper function for status badges (customize colors as needed)
  const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-700'; // Green for available
      case 'assigned':
        return 'bg-blue-100 text-blue-700'; // Blue for assigned
      default:
        return 'bg-gray-100 text-gray-700'; // Fallback for any unexpected status
    }
  };

  // Function to apply filters by making a new Inertia request
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

  // Handle filter changes (unchanged logic)
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

  // Handle search term change (unchanged logic)
  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    applyFilters({ status: filterStatus, section: filterSection, sub_section: filterSubSection, search: newSearchTerm });
  };

  // Calculate totals for current page (unchanged logic)
  const totalSchedulesCount = employees.reduce((sum, employee) => {
    return sum + (employee.schedules_count || 0);
  }, 0);

  const totalWeeklySchedulesCount = employees.reduce((sum, employee) => {
    return sum + (employee.schedules_count_weekly || 0);
  }, 0);

  // Function to build pagination URL (unchanged logic)
  const buildPaginationUrl = (url) => {
    if (!url) return '#';

    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    if (filterStatus !== 'All') {
      params.set('status', filterStatus);
    } else {
      params.delete('status');
    }
    if (filterSection !== 'All') {
      params.set('section', filterSection);
    } else {
      params.delete('section');
    }
    if (filterSubSection !== 'All') {
      params.set('sub_section', filterSubSection);
    } else {
      params.delete('sub_section');
    }
    if (searchTerm.trim() !== '') {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }

    urlObj.search = params.toString();
    return urlObj.toString();
  };

  // --- NEW: Handle Reset All Employee Statuses ---
  const handleResetAllStatuses = () => {
    if (confirm('Apakah Anda yakin ingin mereset status semua karyawan menjadi "available" dan "cuti: no"? Tindakan ini tidak dapat dibatalkan.')) {
      router.post(route('employee-attendance.reset-all-statuses'), {}, {
        onSuccess: () => {
          alert('Semua status karyawan berhasil direset.');
          router.reload({ preserveState: false, preserveScroll: false }); // Reload entire page to reflect changes
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
      <div className="py-8">
        <div className="mx-auto sm:px-6 lg:px-8 max-w-7xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h1 className="mb-0 font-bold text-gray-700 dark:text-gray-300 text-2xl">
                  Ringkasan Penugasan Pegawai
                </h1>
                {/* NEW: Reset All Statuses Button */}
                <button
                  onClick={handleResetAllStatuses}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md font-medium text-white text-sm transition-colors duration-200"
                >
                  Reset Semua Status Karyawan
                </button>
              </div>

              {/* Filter Dropdowns and Search Bar */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Status Filter */}
                <div className="flex items-center">
                  <label htmlFor="statusFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Filter Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={handleStatusChange}
                    className="block bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                  >
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section Filter */}
                <div className="flex items-center">
                  <label htmlFor="sectionFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Filter Section:
                  </label>
                  <select
                    id="sectionFilter"
                    value={filterSection}
                    onChange={handleSectionChange}
                    className="block bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                  >
                    {uniqueSections.map(section => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Section Filter */}
                <div className="flex items-center">
                  <label htmlFor="subSectionFilter" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Filter Sub Section:
                  </label>
                  <select
                    id="subSectionFilter"
                    value={filterSubSection}
                    onChange={handleSubSectionChange}
                    className="block bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                  >
                    {uniqueSubSections.map(subSection => (
                      <option key={subSection} value={subSection}>
                        {subSection}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Bar for Name and NIK */}
                <div className="flex items-center">
                  <label htmlFor="searchEmployee" className="block mr-2 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Cari Nama Pegawai atau NIK:
                  </label>
                  <input
                    type="text"
                    id="searchEmployee"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Cari nama atau NIK..."
                    className="block bg-white dark:bg-gray-700 shadow-sm px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 mt-6 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto">
                <table className="divide-y divide-gray-200 dark:divide-gray-700 min-w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Nama Pegawai
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Gender
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        NIK
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Tipe
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Sub Section
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Section
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Penugasan (Keseluruhan)
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Penugasan (Minggu Ini)
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Total Workload
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Cuti
                      </th> {/* NEW COLUMN FOR CUTI */}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center"> {/* Updated colspan */}
                          Tidak ada data pegawai dengan kriteria filter atau pencarian ini.
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                            {employee.name}
                          </td>
                          <td className="x-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.gender}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.nik}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {/* Display all sub-sections, comma-separated */}
                            {employee.sub_sections && employee.sub_sections.length > 0
                              ? employee.sub_sections.map(ss => ss.name).join(', ')
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {/* Display all parent sections, comma-separated, ensuring uniqueness */}
                            {employee.sub_sections && employee.sub_sections.length > 0
                              ? [...new Set(employee.sub_sections.map(ss => ss.section?.name || 'N/A'))].join(', ')
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.schedules_count}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.schedules_count_weekly}
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm text-center whitespace-nowrap">
                            {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClasses(employee.status)}`}
                            >
                              {employee.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap"> {/* NEW CELL FOR CUTI */}
                            <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                    employee.cuti === 'yes' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {employee.cuti}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total row - these totals now reflect only the current page's data */}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <td colSpan="5" className="px-6 py-3 text-right">Total Penugasan (Keseluruhan):</td>
                      <td className="px-6 py-3 text-center">{totalSchedulesCount}</td>
                      <td className="px-6 py-3 text-center">{totalWeeklySchedulesCount}</td>
                      <td colSpan="3" className="px-6 py-3 text-center"></td> {/* Updated colspan */}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination Links */}
              {paginationLinks.length > 3 && (
                <div className="flex flex-wrap justify-end gap-2 mt-6">
                  {paginationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={buildPaginationUrl(link.url)}
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        link.active
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
