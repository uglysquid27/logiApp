// js/pages/ManpowerRequests/Create/components/RequestForm.jsx
import { useState } from 'react';
import GenderFields from './GenderFields';
import TimeFields from './TimeFields';

export default function RequestForm({ 
  request, 
  shifts, 
  errors, 
  onChange, 
  onSlotChange, 
  globalDate = null, 
  hideDate = false 
}) {
  const today = new Date().toISOString().split('T')[0];
  const [duplicateRequests, setDuplicateRequests] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  const handleSlotChange = (shiftId, field, value) => {
    if (field === 'requested_amount' || field === 'male_count' || field === 'female_count') {
      if (value === '' || value === '0') {
        value = '';
      } else if (value.startsWith('0') && value.length > 1) {
        value = value.replace(/^0+/, '');
      }
    }

    onSlotChange(shiftId, field, value);
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to validate time combinations
  const validateShiftTimes = (startTime, endTime) => {
    if (!startTime || !endTime) return { isValid: true, message: '' };
    
    // Allow same times (like 00:00:00 to 00:00:00 for continuous shifts)
    if (startTime === endTime) {
      return { 
        isValid: true, 
        message: 'Shift berlangsung 24 jam penuh',
        type: 'info'
      };
    }
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    // Handle overnight shifts
    if (end < start) {
      end.setDate(end.getDate() + 1);
      return { 
        isValid: true, 
        message: `Shift malam: ${startTime.substring(0, 5)} - ${endTime.substring(0, 5)} (+1 hari)`,
        type: 'warning'
      };
    }
    
    return { isValid: true, message: '' };
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
          Sub Section
        </label>
        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          {request.sub_section_name} ({request.section_name})
        </div>
      </div>

      {/* Date field - only show if not hidden */}
      {!hideDate && (
        <div>
          <label htmlFor="date" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
            Tanggal Dibutuhkan <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={request.date}
            onChange={(e) => onChange('date', e.target.value)}
            min={today}
            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
            required
          />
          {errors.date && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.date}</p>}
        </div>
      )}

      {/* Show selected date from global date */}
      {hideDate && globalDate && (
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
            Tanggal Dibutuhkan
          </label>
          <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-green-800 dark:text-green-200 font-medium">
                {formatDateForDisplay(globalDate)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 mt-4 pt-4 border-t">
        <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
          Jumlah Man Power per Shift
        </h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm italic">
          Isi hanya shift yang Anda butuhkan *manpower*nya. Shift lain akan diabaikan.
        </p>

        {shifts.map((shift) => {
          const slotData = request.time_slots[shift.id] || {};
          const requestedAmount = parseInt(slotData.requested_amount) || 0;
          const showGenderFields = requestedAmount > 0;
          const isDuplicate = duplicateRequests.some(req => req.shift_id == shift.id);
          
          // Validate time combination for this shift
          const timeValidation = validateShiftTimes(slotData.start_time, slotData.end_time);

          return (
            <div key={shift.id} className={`p-3 sm:p-4 border ${isDuplicate ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-md space-y-3`}>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">
                {shift.name}
                {shift.start_time && shift.end_time && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    (Default: {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})
                  </span>
                )}
              </h4>

              <div>
                <label htmlFor={`amount_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                  Jumlah Karyawan Diminta
                </label>
                <input
                  type="number"
                  id={`amount_${shift.id}`}
                  min="0"
                  value={slotData.requested_amount}
                  onChange={(e) => handleSlotChange(shift.id, 'requested_amount', e.target.value)}
                  onFocus={handleNumberFocus}
                  onWheel={(e) => e.target.blur()}
                  placeholder="Jumlah"
                  className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.time_slots?.[shift.id]?.requested_amount ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                />
                {errors.time_slots?.[shift.id]?.requested_amount && (
                  <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.time_slots[shift.id].requested_amount}</p>
                )}
              </div>

              {isDuplicate && showDuplicateWarning && (
                <div>
                  <label htmlFor={`reason_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Alasan Tambahan Request <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`reason_${shift.id}`}
                    value={slotData.reason || ''}
                    onChange={(e) => handleSlotChange(shift.id, 'reason', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    placeholder="Jelaskan mengapa Anda membutuhkan tambahan manpower"
                    required
                  />
                </div>
              )}

              {showGenderFields && (
                <>
                  <TimeFields
                    shift={shift}
                    slotData={slotData}
                    errors={errors.time_slots?.[shift.id] || {}}
                    handleSlotChange={(field, value) => handleSlotChange(shift.id, field, value)}
                  />

                  {/* Display time validation message */}
                  {timeValidation.message && (
                    <div className={`border rounded-md p-3 ${
                      timeValidation.type === 'warning' 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {timeValidation.type === 'warning' ? (
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm ${
                            timeValidation.type === 'warning'
                              ? 'text-blue-800 dark:text-blue-200'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {timeValidation.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <GenderFields
                    shift={shift}
                    slotData={slotData}
                    requestedAmount={requestedAmount}
                    handleSlotChange={(field, value) => handleSlotChange(shift.id, field, value)}
                    handleNumberFocus={handleNumberFocus}
                    sectionName={request.section_name}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}