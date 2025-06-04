import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';

export default function Create({ subSections, shifts }) {
  const initialTimeSlots = {};
  if (shifts && Array.isArray(shifts)) {
    shifts.forEach(shift => {
      initialTimeSlots[shift.id] = {
        requested_amount: '',
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
    const newInitialTimeSlots = {};
    if (shifts && Array.isArray(shifts)) {
      shifts.forEach(shift => {
        newInitialTimeSlots[shift.id] = {
          requested_amount: '',
          start_time: shift.start_time || '',
          end_time: shift.end_time || '',
        };
      });
    }
    setData('time_slots', newInitialTimeSlots);
  }, [shifts]);

  const handleSlotChange = (shiftId, field, value) => {
    setData('time_slots', {
      ...data.time_slots,
      [shiftId]: {
        ...data.time_slots[shiftId],
        [field]: value,
      },
    });
  };

  // Helper function to format time to HH:mm
  const formatTime = (timeString) => {
      if (!timeString) return ''; // Return empty string for null/undefined/empty input

      // Use a regex to extract hours and minutes, ensuring leading zeros
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/; // Matches HH:mm or HH:mm:ss
      const match = timeString.match(timeRegex);

      if (match) {
          return `${match[1]}:${match[2]}`; // Return only HH:mm part
      }
      return ''; // Return empty string if format is invalid
  };

  const submit = (e) => {
    e.preventDefault();

    // --- DEBUGGING: Log initial data.time_slots ---
    console.log('Current data.time_slots before processing:', data.time_slots);

    const submittedTimeSlots = Object.keys(data.time_slots)
      .map(shiftId => {
        // --- DEBUGGING: Log shiftId during map operation ---
        console.log('Processing shiftId:', shiftId);
        const slot = data.time_slots[shiftId];
        const requestedAmount = slot.requested_amount === '' ? 0 : parseInt(slot.requested_amount, 10);

        return {
          shift_id: parseInt(shiftId, 10),
          requested_amount: requestedAmount,
          start_time: formatTime(slot.start_time), // Apply formatting
          end_time: formatTime(slot.end_time),     // Apply formatting
        };
      })
      .filter(slot => slot.requested_amount > 0); // Filter out slots where requested_amount is 0 or less.

    // --- DEBUGGING: Log final submittedTimeSlots array ---
    console.log('Submitted time_slots after filtering:', submittedTimeSlots);

    if (submittedTimeSlots.length === 0) {
      alert('Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.');
      return;
    }

    // --- NEW DEBUGGING: Log the full data object being sent to the backend ---
    console.log('Data being sent to backend:', {
      sub_section_id: data.sub_section_id,
      date: data.date,
      time_slots: submittedTimeSlots,
    });

    post('/manpower-requests', {
      data: {
        sub_section_id: data.sub_section_id,
        date: data.date,
        time_slots: submittedTimeSlots,
      },
      onSuccess: () => reset(),
      onError: (formErrors) => {
        console.error('Validation Errors:', formErrors);
        if (formErrors.time_slots) {
            alert('Kesalahan data slot waktu: ' + formErrors.time_slots);
        } else {
            for (const key in formErrors) {
                if (key.startsWith('time_slots.')) {
                    alert(`Kesalahan pada slot waktu: ${formErrors[key]}`);
                    break;
                }
            }
        }
      },
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-8">
        <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  Buat Request Man Power Baru
                </h1>
                <Link
                  href="/manpower-requests"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 inline-flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /> </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Sub Section Field */}
                <div>
                  <label htmlFor="sub_section_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  {errors.sub_section_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sub_section_id}</p>}
                </div>

                {/* Date Field */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
                </div>

                {/* Shift-based Manpower Slots */}
                <div className="space-y-4 pt-4 border-t mt-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                    Jumlah Man Power per Shift
                  </h3>
                  {shifts && Array.isArray(shifts) && shifts.map((shift) => (
                    <div key={shift.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="col-span-2">
                        <label htmlFor={`amount_${shift.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {shift.name} (Jumlah)
                        </label>
                        <input
                          type="number"
                          id={`amount_${shift.id}`}
                          min="0"
                          value={data.time_slots[shift.id]?.requested_amount || ''}
                          onChange={(e) => handleSlotChange(shift.id, 'requested_amount', e.target.value ? parseInt(e.target.value, 10) : '')}
                          placeholder="Jumlah"
                          className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.requested_amount`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                        />
                        {errors[`time_slots.${shift.id}.requested_amount`] && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`time_slots.${shift.id}.requested_amount`]}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor={`start_time_${shift.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Waktu Mulai ({shift.name}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id={`start_time_${shift.id}`}
                          value={data.time_slots[shift.id]?.start_time || ''}
                          onChange={(e) => handleSlotChange(shift.id, 'start_time', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.start_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                          required={data.time_slots[shift.id]?.requested_amount > 0}
                        />
                        {errors[`time_slots.${shift.id}.start_time`] && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`time_slots.${shift.id}.start_time`]}</p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label htmlFor={`end_time_${shift.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Waktu Selesai ({shift.name}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          id={`end_time_${shift.id}`}
                          value={data.time_slots[shift.id]?.end_time || ''}
                          onChange={(e) => handleSlotChange(shift.id, 'end_time', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.end_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                          required={data.time_slots[shift.id]?.requested_amount > 0}
                        />
                        {errors[`time_slots.${shift.id}.end_time`] && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[`time_slots.${shift.id}.end_time`]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {errors.time_slots && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time_slots}</p>}
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-75 disabled:cursor-not-allowed"
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
