import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';

export default function Create({ subSections, shifts }) {
  // Group subSections by section for better organization
  const sectionsWithSubs = subSections.reduce((acc, subSection) => {
    const sectionName = subSection.section?.name || 'Uncategorized';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(subSection);
    return acc;
  }, {});

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
    sub_section_name: '', // To display the selected sub-section name
    date: '',
    time_slots: initialTimeSlots,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
    // Remove leading zeros from number inputs
    if (field === 'requested_amount' || field === 'male_count' || field === 'female_count') {
      if (value === '' || value === '0') {
        value = '';
      } else if (value.startsWith('0') && value.length > 1) {
        value = value.replace(/^0+/, '');
      }
    }

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

  // Filter sub-sections based on search term
  const filteredSections = Object.keys(sectionsWithSubs).reduce((acc, sectionName) => {
    const filteredSubs = sectionsWithSubs[sectionName].filter(subSection =>
      subSection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredSubs.length > 0) {
      acc[sectionName] = filteredSubs;
    }
    return acc;
  }, {});

  const selectSubSection = (subSection) => {
    setData({
      ...data,
      sub_section_id: subSection.id,
      sub_section_name: subSection.name
    });
    setIsModalOpen(false);
    setSearchTerm('');
  };

  // Handle number input focus to clear initial zero
  const handleNumberFocus = (e) => {
    if (e.target.value === '0') {
      e.target.value = '';
    }
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Buat Request Man Power Baru
                </h1>
                <Link
                  href="/manpower-requests"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 dark:text-indigo-400 text-sm"
                >
                  <svg className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              <form onSubmit={submit} className="space-y-6">
                {/* Sub Section Field - Now using a modal */}
                <div>
                  <label htmlFor="sub_section_id" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Sub Section <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Selected sub-section display */}
                  <div 
                    onClick={() => setIsModalOpen(true)}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.sub_section_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 cursor-pointer`}
                  >
                    {data.sub_section_name ? (
                      <span className="block truncate">{data.sub_section_name}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-400">-- Pilih Sub Section --</span>
                    )}
                  </div>
                  {errors.sub_section_id && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.sub_section_id}</p>}
                </div>

                {/* Rest of your form remains the same */}
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
                      <div key={shift.id} className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-md space-y-3">
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
                            onFocus={handleNumberFocus}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-md">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-3">
                                Komposisi Gender
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                                    onFocus={handleNumberFocus}
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
                                    onFocus={handleNumberFocus}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </div>
                              </div>
                              {/* Validation message if gender counts exceed requested amount */}
                              {(parseInt(slotData.male_count || 0) + parseInt(slotData.female_count || 0) > requestedAmount) && (
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
                    className="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-4 sm:px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed"
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

      {/* Sub-section Selection Modal - Centered */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
                Pilih Sub Section
              </h3>
              
              {/* Search input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Cari sub section..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              
              {/* Sub-sections list */}
              <div className="max-h-96 overflow-y-auto">
                {Object.keys(filteredSections).length > 0 ? (
                  Object.entries(filteredSections).map(([sectionName, subSections]) => (
                    <div key={sectionName} className="mb-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                        {sectionName}
                      </h4>
                      <ul className="space-y-1">
                        {subSections.map((subSection) => (
                          <li key={subSection.id}>
                            <button
                              type="button"
                              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-indigo-100 dark:hover:bg-gray-600 ${data.sub_section_id === subSection.id ? 'bg-indigo-50 dark:bg-gray-700 border border-indigo-200 dark:border-gray-600' : ''}`}
                              onClick={() => selectSubSection(subSection)}
                            >
                              <div className="flex items-center">
                                <span className="block truncate">{subSection.name}</span>
                                {data.sub_section_id === subSection.id && (
                                  <svg className="ml-2 h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                    Tidak ada sub section yang cocok dengan pencarian Anda
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}