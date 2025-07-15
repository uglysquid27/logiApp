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
        reason: '',
        is_additional: false,
      };
    });
  }

  const { data, setData, post, processing, errors, reset } = useForm({
    sub_section_id: '',
    sub_section_name: '',
    date: '',
    time_slots: initialTimeSlots,
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicateRequests, setDuplicateRequests] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

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
          reason: '',
          is_additional: false,
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
            female_count: 0,
            is_additional: false,
            reason: '',
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

  const checkForDuplicates = async () => {
    try {
      const response = await fetch(route('manpower-requests.check-duplicates'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          sub_section_id: data.sub_section_id,
          date: data.date,
          shift_ids: Object.keys(data.time_slots)
            .filter(shiftId => data.time_slots[shiftId].requested_amount > 0)
            .map(Number),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      return result; // This will include { duplicates: [], has_duplicates: boolean }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { duplicates: [], has_duplicates: false };
    }
  };

  const hasAtLeastOneShiftFilled = () => {
    return Object.values(data.time_slots).some(
      slot => slot.requested_amount && parseInt(slot.requested_amount) > 0
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    console.log('Submission started', { data });

    // Validate required fields
    if (!data.sub_section_id || !data.date || !hasAtLeastOneShiftFilled()) {
      const missingFields = [];
      if (!data.sub_section_id) missingFields.push('sub_section_id');
      if (!data.date) missingFields.push('date');
      if (!hasAtLeastOneShiftFilled()) missingFields.push('no valid shifts');

      console.error('Validation failed - missing fields:', missingFields);
      alert('Please fill all required fields and at least one shift');
      return;
    }

    // Check for duplicates
    try {
      console.log('Checking for duplicates...');
      const { duplicates, has_duplicates } = await checkForDuplicates();
      console.log('Duplicate check result:', { duplicates, has_duplicates });

      if (has_duplicates) {
        console.log('Found duplicates, showing warning');
        setDuplicateRequests(duplicates);
        setShowDuplicateWarning(true);

        // Update the form data to mark duplicates as additional
        setData(prevData => {
          const newTimeSlots = { ...prevData.time_slots };
          duplicates.forEach(dup => {
            if (newTimeSlots[dup.shift_id]) {
              newTimeSlots[dup.shift_id] = {
                ...newTimeSlots[dup.shift_id],
                is_additional: true,
                reason: newTimeSlots[dup.shift_id].reason || 'Duplicate request - additional manpower needed'
              };
            }
          });
          console.log('Updated time slots with duplicates:', newTimeSlots);
          return { ...prevData, time_slots: newTimeSlots };
        });
        return;
      }

      // If no duplicates, proceed with submission
      console.log('No duplicates found, proceeding with submission');
      await processSubmission();
    } catch (error) {
      console.error('Error during submission:', error);
      alert('An error occurred during submission. Please try again.');
    }
  };

  const processSubmission = async () => {
    console.log('Preparing submission payload...');
    const payloadTimeSlots = [];

    Object.keys(data.time_slots).forEach(shiftId => {
      const slot = data.time_slots[shiftId];
      // Ensure proper number conversion
      const requestedAmount = slot.requested_amount ? parseInt(slot.requested_amount, 10) : 0;
      console.log(`Processing shift ${shiftId}:`, {
        rawValue: slot.requested_amount,
        convertedValue: requestedAmount
      });

      if (requestedAmount > 0) {
        const payloadSlot = {
          shift_id: parseInt(shiftId, 10),
          requested_amount: requestedAmount, // Use the properly converted value
          male_count: parseInt(slot.male_count) || 0,
          female_count: parseInt(slot.female_count) || 0,
          start_time: formatTimeToSeconds(slot.start_time),
          end_time: formatTimeToSeconds(slot.end_time),
          is_additional: slot.is_additional || false,
        };

        // Only include reason if it's an additional request
        if (payloadSlot.is_additional) {
          payloadSlot.reason = slot.reason || 'Duplicate request - additional manpower needed';
        }

        payloadTimeSlots.push(payloadSlot);
      }
    });

    console.log('Final payload being sent:', {
      sub_section_id: data.sub_section_id,
      date: data.date,
      time_slots: payloadTimeSlots
    });

    try {
      console.log('Sending POST request...');
      await post('/manpower-requests', {
        sub_section_id: data.sub_section_id,
        date: data.date,
        time_slots: payloadTimeSlots,
      }, {
        onSuccess: () => {
          console.log('Submission successful');
          reset();
        },
        onError: (errors) => {
          console.error('Submission errors:', errors);
        },
      });
    } catch (error) {
      console.error('Submission failed:', error);
    }
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
                {/* Sub Section Field */}
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

                        {/* Time Fields - Only shown when requested_amount > 0 */}
                        {showGenderFields && (
                          <>
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
                                    onWheel={(e) => e.target.blur()}
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
                                    onWheel={(e) => e.target.blur()}
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
                </div>

                {/* Duplicate Requests Warning */}
                {showDuplicateWarning && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Permintaan serupa sudah ada
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                          <p>
                            Kami menemukan permintaan yang sama untuk shift berikut:
                          </p>
                          <ul className="list-disc pl-5 mt-1">
                            {duplicateRequests.map(req => (
                              <li key={req.id}>
                                {req.shift_name} - {req.requested_amount} orang
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2">
                            Silakan berikan alasan untuk permintaan tambahan ini.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowDuplicateWarning(false)}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={processSubmission}
                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:text-sm"
                      >
                        Submit Permintaan Tambahan
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button - Only show if no duplicates or warning dismissed */}
                {!showDuplicateWarning && (
                  <div className="flex justify-end items-center pt-2">
                    <button
                      type="submit"
                      className={`inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-4 sm:px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed ${processing ? 'opacity-75' : ''
                        }`}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-section Selection Modal */}
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