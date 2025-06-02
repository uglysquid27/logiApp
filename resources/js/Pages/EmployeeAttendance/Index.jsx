import React, { useState, useMemo } from 'react';
import { usePage, Link, router } from '@inertiajs/react'; // Import router
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index() {
  // `employees` prop will now be a pagination object
  // `filters` prop will contain the current filter values
  // `uniqueStatuses`, `uniqueSections`, `uniqueSubSections` will contain options for dropdowns
  const { employees: paginationData, filters, uniqueStatuses, uniqueSections, uniqueSubSections } = usePage().props;

  // Extract the actual employee data array from the pagination object
  const employees = paginationData.data;
  const paginationLinks = paginationData.links;

  // State for filters, initialized from props
  const [filterStatus, setFilterStatus] = useState(filters.status || 'All');
  const [filterSection, setFilterSection] = useState(filters.section || 'All');
  const [filterSubSection, setFilterSubSection] = useState(filters.sub_section || 'All');

  // Function to apply filters by making a new Inertia request
  const applyFilters = (newFilters) => {
    router.get(route('employee-attendance.index'), {
      status: newFilters.status !== 'All' ? newFilters.status : undefined,
      section: newFilters.section !== 'All' ? newFilters.section : undefined,
      sub_section: newFilters.sub_section !== 'All' ? newFilters.sub_section : undefined,
      page: 1, // Reset to first page when filters change
    }, {
      preserveState: true,
      preserveScroll: true,
      replace: true, // Replace history state to avoid clutter
    });
  };

  // Handle filter changes
  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);
    applyFilters({ status: newStatus, section: filterSection, sub_section: filterSubSection });
  };

  const handleSectionChange = (e) => {
    const newSection = e.target.value;
    setFilterSection(newSection);
    setFilterSubSection('All'); // Reset sub-section filter when section changes
    applyFilters({ status: filterStatus, section: newSection, sub_section: 'All' });
  };

  const handleSubSectionChange = (e) => {
    const newSubSection = e.target.value;
    setFilterSubSection(newSubSection);
    applyFilters({ status: filterStatus, section: filterSection, sub_section: newSubSection });
  };

  // Calculate the total historical schedules count for the CURRENTLY DISPLAYED (paginated and filtered) employees
  const totalSchedulesCount = employees.reduce((sum, employee) => {
    return sum + (employee.schedules_count || 0);
  }, 0);

  // Calculate the total weekly schedules count for the CURRENTLY DISPLAYED (paginated and filtered) employees
  const totalWeeklySchedulesCount = employees.reduce((sum, employee) => {
    return sum + (employee.schedules_count_weekly || 0);
  }, 0);

  // Function to build pagination URL with current filters
  const buildPaginationUrl = (url) => {
    if (!url) return '#'; // Return '#' for disabled links

    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Add current filters to URL parameters if they are not 'All'
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

    urlObj.search = params.toString();
    return urlObj.toString();
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
              <h1 className="mb-6 font-bold text-gray-700 dark:text-gray-300 text-2xl">
                Ringkasan Penugasan Pegawai
              </h1>

              {/* Filter Dropdowns */}
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
              </div>

              <div className="bg-white dark:bg-gray-800 mt-6 border border-gray-200 dark:border-gray-700 rounded-md overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                        Nama Pegawai
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
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {employees.length === 0 ? ( // Use 'employees' (paginated data) here
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-gray-500 dark:text-gray-400 text-center">
                          Tidak ada data pegawai dengan status ini atau kriteria filter lainnya.
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => ( // Use 'employees' (paginated data) here
                        <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                            {employee.name}
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
                          <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                            {employee.status}
                          </td>
                        </tr>
                      ))
                    )}
                    {/* Total row - these totals now reflect only the current page's data */}
                    <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-700 dark:text-gray-300">
                      <td colSpan="5" className="px-6 py-3 text-right">Total Penugasan (Keseluruhan):</td>
                      <td className="px-6 py-3 text-center">{totalSchedulesCount}</td>
                      <td className="px-6 py-3 text-center">{totalWeeklySchedulesCount}</td>
                      <td colSpan="2" className="px-6 py-3 text-center"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination Links */}
              {paginationLinks.length > 3 && ( // Check if there are actual pagination links to display
                <div className="mt-6 flex justify-end flex-wrap gap-2">
                  {paginationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={buildPaginationUrl(link.url)} // Use the new helper function here
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        link.active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${!link.url && 'pointer-events-none opacity-50'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      preserveScroll // Keep scroll position after navigation
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
