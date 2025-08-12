export default function TimeFields({
  shift,
  slotData,
  errors,
  handleSlotChange
}) {
  // Function to convert H:i:s to H:i for display in input
  const formatTimeForInput = (timeString) => {
    if (!timeString) return '';
    
    // If time is in H:i:s format, convert to H:i for input display
    if (timeString.includes(':') && timeString.split(':').length === 3) {
      return timeString.substring(0, 5); // Get only HH:MM part for input
    }
    
    return timeString;
  };

  // Function to convert H:i to H:i:s for storage
  const formatTimeForStorage = (timeString) => {
    if (!timeString) return '';
    
    // If time is in H:i format, add :00 seconds
    if (timeString.includes(':') && timeString.split(':').length === 2) {
      return timeString + ':00';
    }
    
    // If already H:i:s, return as is
    return timeString;
  };

  const handleTimeChange = (field, value) => {
    // Convert the input value (H:i) to storage format (H:i:s)
    const formattedValue = formatTimeForStorage(value);
    handleSlotChange(field, formattedValue);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label htmlFor={`start_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
          Waktu Mulai
        </label>
        <input
          type="time"
          id={`start_time_${shift.id}`}
          value={formatTimeForInput(slotData.start_time || '')}
          onChange={(e) => handleTimeChange('start_time', e.target.value)}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors?.start_time ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
        />
        {errors?.start_time && (
          <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.start_time}</p>
        )}
      </div>
      <div>
        <label htmlFor={`end_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
          Waktu Selesai
        </label>
        <input
          type="time"
          id={`end_time_${shift.id}`}
          value={formatTimeForInput(slotData.end_time || '')}
          onChange={(e) => handleTimeChange('end_time', e.target.value)}
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors?.end_time ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
        />
        {errors?.end_time && (
          <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.end_time}</p>
        )}
      </div>
    </div>
  );
}