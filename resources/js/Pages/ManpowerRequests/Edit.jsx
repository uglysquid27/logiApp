import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect } from 'react';

export default function Edit({ manpowerRequestData, subSections, shifts }) {
    // --- DEBUGGING: Initial Props Check ---
    console.log("--- Edit.jsx: Props Received ---");
    console.log("manpowerRequestData:", manpowerRequestData);
    console.log("subSections:", subSections);
    console.log("shifts (all available shifts):", shifts);
    console.log("----------------------------------");

    // Helper function: ensures time is always HH:mm:ss for backend
    const formatTimeToSeconds = (timeString) => {
        if (!timeString) return null;

        if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return timeString;
        }

        if (timeString.match(/^\d{2}:\d{2}$/)) {
            return `${timeString}:00`;
        }
        console.warn("formatTimeToSeconds: Invalid time string format (returning null):", timeString);
        return null; // Return null for invalid formats
    };

    // Helper function: ensures time is always HH:mm for HTML time input
    const formatTimeToMinutes = (timeString) => {
        if (!timeString) return ''; // Return empty string for empty/null times

        if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
            return timeString.substring(0, 5); // Extract HH:mm
        }
        if (timeString.match(/^\d{2}:\d{2}$/)) {
            return timeString; // Already HH:mm
        }
        console.warn("formatTimeToMinutes: Invalid time string format (returning empty string):", timeString);
        return ''; // Return empty string for invalid formats
    };

    // Initialize timeSlots based on existing data (manpowerRequestData.time_slots) and all available shifts
    const initialTimeSlots = {};
    if (shifts && Array.isArray(shifts)) {
        shifts.forEach(shift => {
            // Safely access existing slot data from the manpowerRequestData.time_slots object
            // This object is keyed by shift.id from the backend.
            const existingSlotData = manpowerRequestData.time_slots?.[shift.id];

            initialTimeSlots[shift.id] = {
                // If existingSlotData, use its requested_amount, otherwise empty string
                // Ensure null/undefined amounts become empty string for input field
                requested_amount: existingSlotData ? (existingSlotData.requested_amount !== null ? existingSlotData.requested_amount : '') : '',
                // Use existing times, or default shift times, formatted for HH:mm:ss (for internal state)
                start_time: existingSlotData ? formatTimeToSeconds(existingSlotData.start_time) : formatTimeToSeconds(shift.start_time),
                end_time: existingSlotData ? formatTimeToSeconds(existingSlotData.end_time) : formatTimeToSeconds(shift.end_time),
            };
            // --- DEBUGGING: Individual Shift Initialization ---
            console.log(`--- Initializing Shift ID: ${shift.id} (${shift.name}) ---`);
            console.log("  existingSlotData found:", existingSlotData);
            console.log("  Default shift times:", shift.start_time, shift.end_time);
            console.log("  Computed initialTimeSlots value:", initialTimeSlots[shift.id]);
            console.log("------------------------------------------");
        });
    }
    console.log("--- Final initialTimeSlots object for useForm state ---");
    console.log(initialTimeSlots);
    console.log("-------------------------------------------------------");


    const { data, setData, put, processing, errors } = useForm({
        sub_section_id: manpowerRequestData.sub_section_id || '',
        date: manpowerRequestData.date || '',
        time_slots: initialTimeSlots, // Use the structured initialTimeSlots
    });

    // useEffect for re-initialization (less critical for edit, but good for consistency)
    // This typically runs if the component's props change after the initial render.
    useEffect(() => {
        // If data.time_slots is not fully populated for all shifts or doesn't match current shifts count
        if (!data.time_slots || Object.keys(data.time_slots).length === 0 || Object.keys(data.time_slots).length !== shifts.length) {
            console.log("--- useEffect Triggered: Re-initializing time_slots ---");
            const newInitialTimeSlots = {};
            if (shifts && Array.isArray(shifts)) {
                shifts.forEach(shift => {
                    const existingSlotData = manpowerRequestData.time_slots?.[shift.id];
                    newInitialTimeSlots[shift.id] = {
                        requested_amount: existingSlotData ? (existingSlotData.requested_amount !== null ? existingSlotData.requested_amount : '') : '',
                        start_time: existingSlotData ? formatTimeToSeconds(existingSlotData.start_time) : formatTimeToSeconds(shift.start_time),
                        end_time: existingSlotData ? formatTimeToSeconds(existingSlotData.end_time) : formatTimeToSeconds(shift.end_time),
                    };
                });
            }
            setData('time_slots', newInitialTimeSlots);
            console.log("--- useEffect: time_slots re-initialized ---");
        }
    }, [shifts, manpowerRequestData]); // Depend on shifts and manpowerRequestData to re-run if they change


    const handleSlotChange = (shiftId, field, value) => {
        setData(prevData => {
            const newTimeSlots = {
                ...prevData.time_slots,
                [shiftId]: {
                    ...prevData.time_slots[shiftId],
                    // Always store HH:mm:ss in state for time fields for start_time/end_time
                    [field]: (field === 'start_time' || field === 'end_time') ? formatTimeToSeconds(value) : value,
                },
            };

            // If requested_amount is cleared or set to <= 0, reset time to default shift times
            if (field === 'requested_amount') {
                const amount = value === '' ? 0 : parseInt(value, 10);
                if (amount <= 0) {
                    const originalShift = shifts.find(s => s.id === shiftId);
                    // Ensure default times are also formatted
                    newTimeSlots[shiftId].start_time = formatTimeToSeconds(originalShift?.start_time || '');
                    newTimeSlots[shiftId].end_time = formatTimeToSeconds(originalShift?.end_time || '');
                }
            }
            // --- DEBUGGING: After Slot Change ---
            console.log(`handleSlotChange: Shift ${shiftId}, Field ${field}, Value ${value}`);
            console.log("  New time_slots for this shift:", newTimeSlots[shiftId]);
            // --- DEBUGGING ---
            return {
                ...prevData,
                time_slots: newTimeSlots,
            };
        });
    };

    const submit = (e) => {
        e.preventDefault();

        const payloadTimeSlots = {};
        let hasValidSlot = false; // Flag to check if at least one shift has amount > 0

        Object.keys(data.time_slots).forEach(shiftId => {
            const slot = data.time_slots[shiftId];
            // Treat empty string as 0 for submission logic
            const requestedAmount = slot.requested_amount === '' ? 0 : parseInt(slot.requested_amount, 10);

            // Always include all time slots in the payload, even if amount is 0.
            payloadTimeSlots[shiftId] = {
                requested_amount: requestedAmount,
                start_time: formatTimeToSeconds(slot.start_time), // Ensure HH:mm:ss for backend
                end_time: formatTimeToSeconds(slot.end_time),     // Ensure HH:mm:ss for backend
            };
            if (requestedAmount > 0) {
                hasValidSlot = true;
            }
        });

        // Client-side validation: ensure at least one shift has an amount > 0
        if (!hasValidSlot) {
            alert('Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.');
            return;
        }

        const url = `/manpower-requests/${manpowerRequestData.id}`;
        console.log('--- Submitting Form ---');
        console.log('Attempting to send PUT request to URL:', url);
        console.log('Payload to be sent:', {
            sub_section_id: data.sub_section_id,
            date: data.date,
            time_slots: payloadTimeSlots,
        });
        console.log('-----------------------');

        put(url, {
            sub_section_id: data.sub_section_id,
            date: data.date,
            time_slots: payloadTimeSlots,
        }, {
            onSuccess: () => {
                console.log('Request berhasil diperbarui!');
                window.location.href = '/manpower-requests';
            },
            onError: (formErrors) => {
                console.error('Ada kesalahan saat memperbarui request:', formErrors);
                if (formErrors.time_slots) {
                    alert('Kesalahan Man Power: ' + formErrors.time_slots);
                } else if (Object.keys(formErrors).length > 0) {
                    let errorMessages = 'Kesalahan validasi:\n';
                    for (const key in formErrors) {
                        if (key.startsWith('time_slots.')) {
                            // Extract shift ID or relevant part if needed
                            const shiftErrorPart = key.split('.')[2] || key.split('.')[1]; // Tries to get requested_amount, start_time, etc.
                            errorMessages += `Shift Error (${shiftErrorPart}): ${formErrors[key]}\n`;
                        } else {
                            errorMessages += `${key}: ${formErrors[key]}\n`;
                        }
                    }
                    alert(errorMessages);
                } else {
                    alert('Terjadi kesalahan yang tidak diketahui. Silakan cek konsol.');
                }
            },
            onFinish: () => {
                console.log('Proses pembaruan form selesai.');
            }
        });
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
                    Edit Request Man Power
                </h2>
            }
        >
            <div className="py-8">
                <div className="mx-auto sm:px-6 lg:px-8 max-w-2xl">
                    <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
                        <div className="p-6 md:p-8 text-gray-900 dark:text-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-2xl">
                                    Edit Request Man Power
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
                                    {shifts && Array.isArray(shifts) && shifts.map((shift) => {
                                        // Safely access slotData from the form state
                                        const slotData = data.time_slots?.[shift.id];

                                        // Ensure requestedAmount is handled for display (empty string for null/undefined)
                                        const requestedAmount = slotData ? (slotData.requested_amount !== null ? slotData.requested_amount : '') : '';

                                        // Format for display in the time input field (HH:mm)
                                        const startTimeForDisplay = slotData ? formatTimeToMinutes(slotData.start_time) : '';
                                        const endTimeForDisplay = slotData ? formatTimeToMinutes(slotData.end_time) : '';

                                        // Determine if the time fields are required based on requested_amount > 0
                                        const isTimeRequired = parseInt(requestedAmount, 10) > 0;

                                        // --- DEBUGGING: Render Loop Values ---
                                        console.log(`--- Rendering Shift: ${shift.name} (ID: ${shift.id}) ---`);
                                        console.log("  Slot Data from form.data.time_slots:", slotData);
                                        console.log("  Requested Amount (for input value):", requestedAmount);
                                        console.log("  Start Time (for input value):", startTimeForDisplay);
                                        console.log("  End Time (for input value):", endTimeForDisplay);
                                        console.log("  Is Time Required:", isTimeRequired);
                                        console.log("-------------------------------------");

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
                                                        value={requestedAmount} // Use the potentially empty string for display
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
                                                        value={startTimeForDisplay}
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
                                                        value={endTimeForDisplay}
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
                                    {errors.time_slots && typeof errors.time_slots === 'string' && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.time_slots}</p>}
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end items-center pt-2">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed"
                                        disabled={processing}
                                    >
                                        {processing ? 'Memperbarui...' : 'Perbarui Request'}
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