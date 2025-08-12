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

  // Helper function to validate time range
  const validateTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return true; // Skip validation if either is empty
    
    // Allow same times (like 00:00:00 to 00:00:00 for full day shifts)
    if (startTime === endTime) return true;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return end > start;
  };

  const isTimeRangeInvalid = !validateTimeRange(slotData.start_time, slotData.end_time) && 
                            slotData.start_time && slotData.end_time;

  return (
    <div className="space-y-3">
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
            className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${
              errors?.start_time || isTimeRangeInvalid 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
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
            className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${
              errors?.end_time || isTimeRangeInvalid 
                ? 'border-red-500 dark:border-red-400' 
                : 'border-gray-300 dark:border-gray-600'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
          />
          {errors?.end_time && (
            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.end_time}</p>
          )}
        </div>
      </div>
      
      {/* Time range validation message */}
      {isTimeRangeInvalid && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Waktu selesai harus setelah waktu mulai. Untuk shift malam yang melewati tengah malam, pastikan waktu sudah benar.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Time range info for overnight shifts */}
      {slotData.start_time && slotData.end_time && slotData.start_time > slotData.end_time && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Shift Malam:</strong> Shift ini akan berlanjut ke hari berikutnya ({formatTimeForInput(slotData.start_time)} - {formatTimeForInput(slotData.end_time)} +1 hari)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}