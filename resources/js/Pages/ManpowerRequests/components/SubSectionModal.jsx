export default function SubSectionModal({ isOpen, onClose, section, onSelect }) {
  if (!isOpen || !section) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 transition-opacity" onClick={onClose}></div>
      
      <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Pilih Sub Section dari {section.name}
          </h3>
          
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {section.sub_sections.map(subSection => (
                <button
                  key={subSection.id}
                  type="button"
                  onClick={() => onSelect(subSection)}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-indigo-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  {subSection.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={onClose}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-base font-medium text-white hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}