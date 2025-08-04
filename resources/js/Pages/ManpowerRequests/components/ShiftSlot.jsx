// js/pages/ManpowerRequests/Create/components/ShiftSlot.jsx
import GenderFields from './GenderFields';
import TimeFields from './TimeFields';

export default function ShiftSlot({
  shift,
  slotData,
  errors,
  duplicateRequests,
  showDuplicateWarning,
  handleSlotChange,
  handleNumberFocus
}) {
  const requestedAmount = parseInt(slotData.requested_amount) || 0;
  const showGenderFields = requestedAmount > 0;
  const isDuplicate = duplicateRequests.some(req => req.shift_id == shift.id);

  return (
    <div key={shift.id} className={`p-3 sm:p-4 border ${isDuplicate ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 dark:border-gray-700'} rounded-md space-y-3`}>
      {/* Shift Name */}
      <h4 className="font-medium text-gray-700 dark:text-gray-300">
        {shift.name}
      </h4>

      {/* Requested Amount */}
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
          className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.requested_amount`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
        />
        {errors[`time_slots.${shift.id}.requested_amount`] && (
          <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.requested_amount`]}</p>
        )}
      </div>

      {/* Reason for additional request (shown only for duplicates) */}
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

      {/* Time and Gender Fields - Only shown when requested_amount > 0 */}
      {showGenderFields && (
        <>
          <TimeFields
            shift={shift}
            slotData={slotData}
            errors={errors}
            handleSlotChange={handleSlotChange}
          />

          <GenderFields
            shift={shift}
            slotData={slotData}
            requestedAmount={requestedAmount}
            handleSlotChange={handleSlotChange}
            handleNumberFocus={handleNumberFocus}
          />
        </>
      )}
    </div>
  );
}