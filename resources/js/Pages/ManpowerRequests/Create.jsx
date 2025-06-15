import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';

export default function Create({ subSections, shifts }) {
  // Initialize timeSlots as an object with shift.id as keys
  const initialTimeSlots = {};
  if (shifts && Array.isArray(shifts)) {
    shifts.forEach(shift => {
      initialTimeSlots[shift.id] = {
        requested_amount: '',
        start_time: shift.start_time || '', // Pre-fill with shift's default start time
        end_time: shift.end_time || '',       // Pre-fill with shift's default end time
      };
    });
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    sub_section_id: '',
    date: '',
    time_slots: initialTimeSlots, // Keeps it as an object keyed by shift.id
  });

  useEffect(() => {
    // Hanya reset jika data.time_slots masih kosong atau tidak memiliki semua shift
    // Ini penting agar input untuk setiap shift selalu ada
    const currentShiftIds = Object.keys(data.time_slots).map(Number);
    const allShiftIds = shifts.map(s => s.id);

    if (!data.time_slots || allShiftIds.some(id => !currentShiftIds.includes(id))) {
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

      // Jika requested_amount dikosongkan atau diisi <= 0, reset waktu ke default
      if (field === 'requested_amount') {
        const amount = value === '' ? 0 : parseInt(value, 10);
        if (amount <= 0) {
          const originalShift = shifts.find(s => s.id === shiftId);
          newTimeSlots[shiftId].start_time = originalShift?.start_time || '';
          newTimeSlots[shiftId].end_time = originalShift?.end_time || '';
        }
      }

      return {
        ...prevData,
        time_slots: newTimeSlots,
      };
    });
  };


  // Helper function: ensures time is always HH:mm:ss for backend
  const formatTimeToSeconds = (timeString) => {
    if (!timeString) return null; // Send null for empty strings

    // If already HH:mm:ss, return as is
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }

    // If HH:mm, append :00
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return `${timeString}:00`;
    }

    console.warn("Invalid time string format for formatting:", timeString);
    return null;
  };


  const submit = (e) => {
    e.preventDefault();

    const payloadTimeSlots = []; // UBAH: Ini sekarang adalah ARRAY

    Object.keys(data.time_slots).forEach(shiftId => {
      const slot = data.time_slots[shiftId];
      const requestedAmount = slot.requested_amount === '' ? 0 : parseInt(slot.requested_amount, 10);

      if (requestedAmount > 0) {
        payloadTimeSlots.push({ // UBAH: Tambahkan objek ke dalam array
          shift_id: parseInt(shiftId, 10), // Tambahkan shift_id sebagai properti
          requested_amount: requestedAmount,
          start_time: formatTimeToSeconds(slot.start_time),
          end_time: formatTimeToSeconds(slot.end_time),
        });
      }
    });

    if (payloadTimeSlots.length === 0) { // Cek panjang array
      alert('Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.');
      return;
    }

    post('/manpower-requests', {
      sub_section_id: data.sub_section_id,
      date: data.date,
      time_slots: payloadTimeSlots, // Kirim array yang sudah diformat
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
                    const requestedAmount = slotData.requested_amount;
                    const startTime = slotData.start_time;
                    const endTime = slotData.end_time;

                    // Determine if the time fields are required based on requested_amount > 0
                    const isTimeRequired = requestedAmount > 0;

                    return (
                      <div key={shift.id} className="items-end gap-4 grid grid-cols-1 md:grid-cols-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                        <div className="col-span-2">
                          <label htmlFor={`amount_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                            {shift.name} (Jumlah)
                          </label>
                          <input
                            type="number"
                            id={`amount_${shift.id}`}
                            min="0"
                            value={requestedAmount}
                            onChange={(e) => handleSlotChange(shift.id, 'requested_amount', e.target.value)}
                            placeholder="Jumlah"
                            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.requested_amount`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                          />
                          {errors[`time_slots.${shift.id}.requested_amount`] && (
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.requested_amount`]}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label htmlFor={`start_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                            Waktu Mulai ({shift.name}) {isTimeRequired && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="time"
                            id={`start_time_${shift.id}`}
                            value={startTime || ''} // Display empty string for null
                            onChange={(e) => handleSlotChange(shift.id, 'start_time', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.start_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                            required={isTimeRequired}
                          />
                          {errors[`time_slots.${shift.id}.start_time`] && (
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.start_time`]}</p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label htmlFor={`end_time_${shift.id}`} className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                            Waktu Selesai ({shift.name}) {isTimeRequired && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="time"
                            id={`end_time_${shift.id}`}
                            value={endTime || ''} // Display empty string for null
                            onChange={(e) => handleSlotChange(shift.id, 'end_time', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors[`time_slots.${shift.id}.end_time`] ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                            required={isTimeRequired}
                          />
                          {errors[`time_slots.${shift.id}.end_time`] && (
                            <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors[`time_slots.${shift.id}.end_time`]}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* General time_slots error, e.g., if array is empty */}
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
