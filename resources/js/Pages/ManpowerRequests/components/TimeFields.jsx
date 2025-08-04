// js/pages/ManpowerRequests/Create/components/TimeFields.jsx
export default function TimeFields({
  shift,
  slotData,
  errors,
  handleSlotChange
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label htmlFor={`start_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
          Waktu Mulai
        </label>
        <input
          type="time"
          id={`start_time_${shift.id}`}
          value={slotData.start_time || ''}
          onChange={(e) => handleSlotChange(shift.id, 'start_time', e.target.value)}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.start_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
        />
        {errors[`time_slots.${shift.id}.start_time`] && (
          <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.start_time`]}</p>
        )}
      </div>
      <div>
        <label htmlFor={`end_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
          Waktu Selesai
        </label>
        <input
          type="time"
          id={`end_time_${shift.id}`}
          value={slotData.end_time || ''}
          onChange={(e) => handleSlotChange(shift.id, 'end_time', e.target.value)}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.end_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
        />
        {errors[`time_slots.${shift.id}.end_time`] && (
          <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.end_time`]}</p>
        )}
      </div>
    </div>
  );
}