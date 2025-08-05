// components/SectionSelection.jsx
export default function SectionSelection({ sections, onSelect }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">
        Select Section
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => onSelect(section)}
            className="p-4 border rounded-md hover:bg-gray-50 text-left"
          >
            <h4 className="font-medium">
              {section.name}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {section.sub_sections.length} sub sections
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}