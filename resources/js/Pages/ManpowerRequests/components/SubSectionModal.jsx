// js/pages/ManpowerRequests/Create/components/SubSectionModal.jsx
export default function SubSectionModal({
  isModalOpen,
  setIsModalOpen,
  searchTerm,
  setSearchTerm,
  filteredSections,
  data,
  selectSubSection
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

      <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Pilih Sub Section
          </h3>

          {/* Search input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Cari sub section..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          {/* Sub-sections list */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(filteredSections).length > 0 ? (
              Object.entries(filteredSections).map(([sectionName, subSections]) => (
                <div key={sectionName} className="mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    {sectionName}
                  </h4>
                  <ul className="space-y-1">
                    {subSections.map((subSection) => (
                      <li key={subSection.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 ${data.sub_section_id === subSection.id ? 'bg-indigo-50 dark:bg-gray-700 border border-indigo-200 dark:border-gray-600' : ''}`}
                          onClick={() => selectSubSection(subSection)}
                        >
                          <div className="flex items-center">
                            <span className="block truncate">{subSection.name}</span>
                            {data.sub_section_id === subSection.id && (
                              <svg className="ml-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                Tidak ada sub section yang cocok dengan pencarian Anda
              </p>
            )}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={() => setIsModalOpen(false)}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}