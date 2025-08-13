import React from 'react';

const EmployeeFilters = ({
  filterStatus,
  filterSection,
  filterSubSection,
  searchTerm,
  uniqueStatuses,
  uniqueSections,
  uniqueSubSections,
  handleStatusChange,
  handleSectionChange,
  handleSubSectionChange,
  handleSearchChange,
  isMobile = false
}) => {
  if (isMobile) {
    return (
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
    );
  }

  return (
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
  );
};

export default EmployeeFilters;