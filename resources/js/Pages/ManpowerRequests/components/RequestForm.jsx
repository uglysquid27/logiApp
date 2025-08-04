// js/pages/ManpowerRequests/Create/components/RequestForm.jsx
import { useState } from 'react';
import GenderFields from './GenderFields';
import TimeFields from './TimeFields';

export default function RequestForm({ request, shifts, errors, onChange, onSlotChange }) {
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

          return (
            <div key={shift.id} className={`p-3 sm:p-4 border ${isDuplicate ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-md space-y-3`}>
              <h4 className="font-medium text-gray-700 dark:text-gray-300">
                {shift.name}
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

                  <GenderFields
                    shift={shift}
                    slotData={slotData}
                    requestedAmount={requestedAmount}
                    handleSlotChange={(field, value) => handleSlotChange(shift.id, field, value)}
                    handleNumberFocus={handleNumberFocus}
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