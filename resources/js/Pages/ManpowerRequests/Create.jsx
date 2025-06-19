import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';

export default function Create({ subSections, shifts }) {
  // Initialize timeSlots with gender fields
  const initialTimeSlots = {};
  if (shifts && Array.isArray(shifts)) {
    shifts.forEach(shift => {
      initialTimeSlots[shift.id] = {
        requested_amount: '',
        male_count: 0,
        female_count: 0,
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
      };
    });
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    sub_section_id: '',
    date: '',
    time_slots: initialTimeSlots,
  });

  useEffect(() => {
    const currentShiftIds = Object.keys(data.time_slots).map(Number);
    const allShiftIds = shifts.map(s => s.id);

    if (!data.time_slots || allShiftIds.some(id => !currentShiftIds.includes(id))) {
      const newInitialTimeSlots = {};
      shifts.forEach(shift => {
        newInitialTimeSlots[shift.id] = {
          requested_amount: '',
          male_count: 0,
          female_count: 0,
          start_time: shift.start_time || '',
          end_time: shift.end_time || '',
        };
      });
      setData('time_slots', newInitialTimeSlots);
    }
  }, [shifts]);

  const handleSlotChange = (shiftId, field, value) => {
    setData(prevData => {
      const newTimeSlots = {
        ...prevData.time_slots,
        [shiftId]: {
          ...prevData.time_slots[shiftId],
          [field]: (field === 'start_time' || field === 'end_time') ? formatTimeToSeconds(value) : value,
        },
      };

      // Reset time and gender counts when requested amount is cleared or set to 0
      if (field === 'requested_amount') {
        const amount = value === '' ? 0 : parseInt(value, 10);
        if (amount <= 0) {
          const originalShift = shifts.find(s => s.id === shiftId);
          newTimeSlots[shiftId] = {
            ...newTimeSlots[shiftId],
            start_time: originalShift?.start_time || '',
            end_time: originalShift?.end_time || '',
            male_count: 0,
            female_count: 0
          };
        }
      }

      return {
        ...prevData,
        time_slots: newTimeSlots,
      };
    });
  };

  const formatTimeToSeconds = (timeString) => {
    if (!timeString) return null;
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) return timeString;
    if (timeString.match(/^\d{2}:\d{2}$/)) return `${timeString}:00`;
    return null;
  };

  const submit = (e) => {
    e.preventDefault();

    const payloadTimeSlots = [];

    Object.keys(data.time_slots).forEach(shiftId => {
      const slot = data.time_slots[shiftId];
      const requestedAmount = slot.requested_amount === '' ? 0 : parseInt(slot.requested_amount, 10);

      if (requestedAmount > 0) {
        payloadTimeSlots.push({
          shift_id: parseInt(shiftId, 10),
          requested_amount: requestedAmount,
          male_count: parseInt(slot.male_count) || 0,
          female_count: parseInt(slot.female_count) || 0,
          start_time: formatTimeToSeconds(slot.start_time),
          end_time: formatTimeToSeconds(slot.end_time),
        });
      }
    });

    if (payloadTimeSlots.length === 0) {
      alert('Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.');
      return;
    }

    post('/manpower-requests', {
      sub_section_id: data.sub_section_id,
      date: data.date,
      time_slots: payloadTimeSlots,
    }, {
      onSuccess: () => reset(),
      onError: (formErrors) => console.error('Validation Errors:', formErrors),
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-8">
        <div className="mx-auto sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-2xl">
                  Buat Request Man Power Baru
                </h1>
                <Link
                  href="/manpower-requests"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 dark:text-indigo-400 text-sm"
                >
                  <svg className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /> </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Sub Section Field */}
                <div>
                  <label htmlFor="sub_section_id" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Sub Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="sub_section_id"
                    name="sub_section_id"
                    value={data.sub_section_id}
                    onChange={(e) => setData('sub_section_id', e.target.value)}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.sub_section_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  >
                    <option value="">-- Pilih Sub Section --</option>
                    {subSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.sub_section_id && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.sub_section_id}</p>}
                </div>

                {/* Date Field */}
                <div>
                  <label htmlFor="date" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Tanggal Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    min={today}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  />
                  {errors.date && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.date}</p>}
                </div>

                {/* Shift-based Manpower Slots */}
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                    Jumlah Man Power per Shift
                  </h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm italic">
                    Isi hanya shift yang Anda butuhkan *manpower*nya. Shift lain akan diabaikan.
                  </p>
                  {shifts && Array.isArray(shifts) && shifts.map((shift) => {
                    const slotData = data.time_slots[shift.id] || {};
                    const requestedAmount = parseInt(slotData.requested_amount) || 0;
                    const showGenderFields = requestedAmount > 0;
                    const isTimeRequired = showGenderFields;

                    return (
                      <div key={shift.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md space-y-3">
                        {/* Shift Name */}
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          {shift.name} 
                        </h4>

                        {/* Requested Amount */}
                        <div>
                          <label htmlFor={`amount_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                            Jumlah Karyawan Diminta <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id={`amount_${shift.id}`}
                            min="0"
                            value={slotData.requested_amount}
                            onChange={(e) => handleSlotChange(shift.id, 'requested_amount', e.target.value)}
                            placeholder="Jumlah"
                            className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.requested_amount`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                          />
                          {errors[`time_slots.${shift.id}.requested_amount`] && (
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.requested_amount`]}</p>
                          )}
                        </div>

                        {/* Time Fields - Only shown when requested_amount > 0 */}
                        {showGenderFields && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor={`start_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  Waktu Mulai <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="time"
                                  id={`start_time_${shift.id}`}
                                  value={slotData.start_time || ''}
                                  onChange={(e) => handleSlotChange(shift.id, 'start_time', e.target.value)}
                                  className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.start_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                                  required={isTimeRequired}
                                />
                                {errors[`time_slots.${shift.id}.start_time`] && (
                                  <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.start_time`]}</p>
                                )}
                              </div>
                              <div>
                                <label htmlFor={`end_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                                  Waktu Selesai <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="time"
                                  id={`end_time_${shift.id}`}
                                  value={slotData.end_time || ''}
                                  onChange={(e) => handleSlotChange(shift.id, 'end_time', e.target.value)}
                                  className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.end_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                                  required={isTimeRequired}
                                />
                                {errors[`time_slots.${shift.id}.end_time`] && (
                                  <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.end_time`]}</p>
                                )}
                              </div>
                            </div>

                            {/* Gender Fields - Only shown when requested_amount > 0 */}
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-3">
                                Komposisi Gender
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor={`male_count_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    Laki-laki
                                  </label>
                                  <input
                                    type="number"
                                    id={`male_count_${shift.id}`}
                                    min="0"
                                    max={requestedAmount}
                                    value={slotData.male_count}
                                    onChange={(e) => handleSlotChange(shift.id, 'male_count', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`female_count_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                                    Perempuan
                                  </label>
                                  <input
                                    type="number"
                                    id={`female_count_${shift.id}`}
                                    min="0"
                                    max={requestedAmount}
                                    value={slotData.female_count}
                                    onChange={(e) => handleSlotChange(shift.id, 'female_count', e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </div>
                              </div>
                              {/* Validation message if gender counts exceed requested amount */}
                              {(parseInt(slotData.male_count || 0) + parseInt(slotData.female_count || 0)) > requestedAmount && (
                                <p className="mt-2 text-red-600 dark:text-red-400 text-sm">
                                  Total gender melebihi jumlah yang diminta!
                                </p>
                              )}
                              {/* Summary */}
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  Terisi: <span className="font-medium">
                                    {parseInt(slotData.male_count || 0) + parseInt(slotData.female_count || 0)}
                                  </span> dari <span className="font-medium">
                                    {requestedAmount}
                                  </span> karyawan
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* General time_slots error */}
                  {errors.time_slots && typeof errors.time_slots === 'string' && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.time_slots}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end items-center pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed"
                    disabled={processing}
                  >
                    {processing ? 'Menyimpan...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}