// js/pages/ManpowerRequests/Create/components/SectionSelection.jsx
export default function SectionSelection({ sections, onSelect }) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
        Pilih Section
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section)}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
          >
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              {section.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {section.sub_sections.length} sub section
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}