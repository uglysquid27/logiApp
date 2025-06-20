import React, { useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isToday from 'dayjs/plugin/isToday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import isBetween from 'dayjs/plugin/isBetween';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.extend(isBetween);
dayjs.locale('id');

// Modal Component for Shift Details (unchanged)
const ShiftDetailModal = ({ shift, onClose }) => {
    if (!shift) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Shift: {shift.name}</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p><strong>Nama Shift:</strong> {shift.name}</p>
                    <p><strong>Waktu Mulai:</strong> {shift.start_time}</p>
                    <p><strong>Waktu Selesai:</strong> {shift.end_time}</p>
                    <p><strong>Total Jam:</strong> {shift.hours} jam</p>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-700 dark:focus:ring-offset-gray-800"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

// New Modal Component for Manpower Request Details (unchanged)
const ManPowerRequestDetailModal = ({ request, assignedEmployees, onClose }) => {
    if (!request) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return dayjs(dateString).format('dddd, DD MMMMYYYY');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Detail Man Power Request</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p><strong>Tanggal Dibutuhkan:</strong> {formatDate(request.date)}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name || 'N/A'}</p>
                    <p><strong>Section:</strong> {request.sub_section?.section?.name || 'N/A'}</p>
                    <p><strong>Shift:</strong> {request.shift?.name || 'N/A'}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                    <p><strong>Status:</strong> {request.status}</p>

                    <h4 className="mt-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Pegawai Ditugaskan:</h4>
                    {assignedEmployees && assignedEmployees.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1">
                            {assignedEmployees.map((empItem, index) => (
                                <li key={index} className="text-gray-700 dark:text-gray-300">
                                    {empItem.name} (NIK: {empItem.nik})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-gray-600 dark:text-gray-400">Belum ada pegawai yang ditugaskan untuk request ini.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-700 dark:focus:ring-offset-gray-800"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

const ScheduleSection = ({ title, schedulesBySubSection, openManPowerRequestModal }) => (
    <div className="mb-8 min-w-full flex-1 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800 md:min-w-80">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        {Object.keys(schedulesBySubSection).length === 0 ? (
            <p className="italic text-gray-600 dark:text-gray-400">Tidak ada penjadwalan di bagian ini.</p>
        ) : (
            Object.entries(schedulesBySubSection).map(([subSectionName, employeesWithDetails]) => (
                <div key={subSectionName} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400">{subSectionName}</h3>
                        {employeesWithDetails[0]?.man_power_request && (
                            <button
                                onClick={() => openManPowerRequestModal(
                                    employeesWithDetails[0].man_power_request,
                                    employeesWithDetails.map(item => item.employee)
                                )}
                                className="ml-2 flex-shrink-0 rounded-full bg-blue-500 p-1 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600 dark:focus:ring-offset-gray-800"
                                title={`Lihat detail Request untuk ${subSectionName}`}
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto shadow-sm rounded-lg">
                        <table className="min-w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Nama Pegawai
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        NIK
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Tipe
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Sub-Section
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                        Section
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                {employeesWithDetails.map((item, index) => (
                                    <tr key={index}>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {item.employee.name || 'Nama Pegawai Tidak Diketahui'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.employee.nik || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.employee.type || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.employee.status || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.sub_section?.name || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.sub_section?.section?.name || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))
        )}
    </div>
);

// New component for displaying a list of schedules in detail (unchanged)
const ScheduleDetailList = ({ title, schedules, onClose }) => {
    if (!schedules || schedules.length === 0) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return dayjs(dateString).format('dddd, DD MMMMYYYY');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                    Tanggal
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                    Nama Pegawai
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                    NIK
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                    Shift
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                    Sub-Section
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:divide-gray-700">
                            {schedules.map((scheduleItem) => (
                                <tr key={scheduleItem.id}>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {formatDate(scheduleItem.date)}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {scheduleItem.employee?.name || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {scheduleItem.employee?.nik || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {scheduleItem.man_power_request?.shift?.name || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {scheduleItem.sub_section?.name || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-700 dark:focus:ring-offset-gray-800"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};


const Index = () => {
    const { schedules, filters } = usePage().props;
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [currentShiftDetails, setCurrentShiftDetails] = useState(null);
    const [showManPowerRequestModal, setShowManPowerRequestModal] = useState(false);
    const [currentManPowerRequestDetails, setCurrentManPowerRequestDetails] = useState(null);
    const [assignedEmployeesForModal, setAssignedEmployeesForModal] = useState([]);

    // State for date filters, initialized from props (to reflect current URL params)
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // States for showing detail lists
    const [showDisplayedDetails, setShowDisplayedDetails] = useState(false);
    const [showWeeklyDetails, setShowWeeklyDetails] = useState(false);

    // This useEffect ensures that if the URL changes (e.g., via browser back/forward or direct link),
    // the filter input fields are updated to reflect the current URL parameters.
    useEffect(() => {
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
    }, [filters]);


    const applyFilters = () => {
        router.get(route('schedules.index'), {
            start_date: startDate,
            end_date: endDate,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        router.get(route('schedules.index'), {
            start_date: '', // Explicitly send empty strings
            end_date: '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openShiftModal = (shiftDetails) => {
        setCurrentShiftDetails(shiftDetails);
        setShowShiftModal(true);
    };

    const closeShiftModal = () => {
        setShowShiftModal(false);
        setCurrentShiftDetails(null);
    };

    const openManPowerRequestModal = (requestDetails, employees) => {
        setCurrentManPowerRequestDetails(requestDetails);
        setAssignedEmployeesForModal(employees);
        setShowManPowerRequestModal(true);
    };

    const closeManPowerRequestModal = () => {
        setShowManPowerRequestModal(false);
        setCurrentManPowerRequestDetails(null);
        setAssignedEmployeesForModal([]);
    };

    // Group schedules based on date, then shift, then sub-section
    const groupedSchedulesByDateShiftSubSection = schedules.reduce((acc, schedule) => {
        // Check if all necessary relationships are loaded. If not, log a warning and skip this schedule.
        if (!schedule.employee || !schedule.sub_section || !schedule.man_power_request?.shift || !schedule.man_power_request?.sub_section?.section) {
            console.warn('Schedule missing essential data (employee, sub_section, shift, or section):', schedule);
            return acc;
        }

        const dateKey = dayjs(schedule.date).format('YYYY-MM-DD');
        const displayDate = dayjs(schedule.date).format('dddd, DD MMMMYYYY');
        const shiftObj = schedule.man_power_request.shift;
        const shiftName = shiftObj.name;

        const subSectionName = schedule.sub_section.name || 'Lain-lain';

        if (!acc[dateKey]) {
            acc[dateKey] = {
                displayDate: displayDate,
                shifts: {}
            };
        }

        if (!acc[dateKey].shifts[shiftName]) {
            acc[dateKey].shifts[shiftName] = {
                details: shiftObj,
                subSections: {}
            };
        }

        if (!acc[dateKey].shifts[shiftName].subSections[subSectionName]) {
            acc[dateKey].shifts[shiftName].subSections[subSectionName] = [];
        }

        acc[dateKey].shifts[shiftName].subSections[subSectionName].push({
            employee: schedule.employee,
            sub_section: schedule.sub_section,
            man_power_request: schedule.man_power_request
        });

        return acc;
    }, {});

    // Sort dates (e.g., today, tomorrow, then future dates)
    const sortedDates = Object.keys(groupedSchedulesByDateShiftSubSection).sort((a, b) => {
        return dayjs(a).valueOf() - dayjs(b).valueOf();
    });

    // Define a custom order for shifts
    const shiftOrder = { 'Pagi': 1, 'Siang': 2, 'Malam': 3 };

    // Calculate total schedules displayed
    const totalSchedulesDisplayed = schedules.length;

    // Calculate total schedules for this week (last 7 days including today)
    const today = dayjs().startOf('day');
    const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day');

    const schedulesThisWeek = schedules.filter(schedule =>
        dayjs(schedule.date).isBetween(sevenDaysAgo, today, 'day', '[]') // '[]' means inclusive of start and end dates
    );
    const totalSchedulesThisWeek = schedulesThisWeek.length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Agenda Penjadwalan
                </h2>
            }
        >
            <div className="mx-auto mt-10 max-w-5xl p-4">
                <h1 className="mb-8 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">Agenda Penjadwalan</h1>

                {/* Date Filter Section */}
                <div className="mb-8 flex flex-col items-center space-y-4 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 sm:flex-row sm:space-x-4 sm:space-y-0">
                    <div className="flex w-full flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                        <div className="flex-1">
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Dari Tanggal:
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                            />
                        </div>

                        <div className="flex-1">
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Sampai Tanggal:
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex w-full flex-col space-y-2 sm:w-auto sm:flex-row sm:space-x-2 sm:space-y-0">
                        <button
                            onClick={applyFilters}
                            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-700 dark:focus:ring-offset-gray-800 sm:w-auto"
                        >
                            Filter
                        </button>
                        <button
                            onClick={clearFilters}
                            className="w-full rounded-md bg-gray-500 px-4 py-2 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 hover:bg-gray-600 dark:focus:ring-offset-gray-800 sm:w-auto"
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>

                {Object.keys(groupedSchedulesByDateShiftSubSection).length === 0 ? (
                    <div className="rounded-md border-l-4 border-blue-500 bg-blue-100 p-4 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200" role="alert">
                        <p className="font-bold">Informasi:</p>
                        <p>Tidak ada penjadwalan dalam rentang tanggal yang dipilih.</p>
                    </div>
                ) : (
                    // Iterate through sorted dates
                    sortedDates.map(dateKey => {
                        const dateData = groupedSchedulesByDateShiftSubSection[dateKey];
                        const shiftsForDate = dateData.shifts;

                        // Sort shifts for the current date
                        const sortedShiftsForDate = Object.keys(shiftsForDate).sort((a, b) => {
                            return (shiftOrder[a] || 99) - (shiftOrder[b] || 99);
                        });

                        return (
                            <React.Fragment key={dateKey}>
                                <div className="mb-10">
                                    <h2 className="mb-6 rounded-lg bg-gray-100 p-4 text-2xl font-bold text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100">
                                        {dateData.displayDate}
                                    </h2>
                                    {/* Wrap shifts in a flex container for horizontal display */}
                                    <div className="flex flex-col space-y-8 pb-4 md:flex-row md:space-x-4 md:space-y-0 lg:overflow-x-visible overflow-x-auto">
                                        {sortedShiftsForDate.map(shiftName => (
                                            <div key={`${dateKey}-${shiftName}`} className="flex w-full flex-col">
                                                <div className="mb-4 flex items-center justify-between">
                                                    {/* ScheduleSection now only renders the sub-sections and employees */}
                                                    <ScheduleSection
                                                        title={`Shift ${shiftName}`}
                                                        schedulesBySubSection={shiftsForDate[shiftName].subSections}
                                                        openManPowerRequestModal={openManPowerRequestModal}
                                                    />
                                                    <button
                                                        onClick={() => openShiftModal(shiftsForDate[shiftName].details)}
                                                        className="ml-2 flex-shrink-0 rounded-full bg-indigo-500 p-2 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-600 dark:focus:ring-offset-gray-800"
                                                        title={`Lihat detail Shift ${shiftName}`}
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <hr className="my-10 border-t-2 border-gray-200 dark:border-gray-700" />
                            </React.Fragment>
                        );
                    })
                )}

                {/* Summary Section */}
                <div className="mt-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-100">Ringkasan Penjadwalan</h3>
                    <div className="grid grid-cols-1 gap-4 text-gray-700 dark:text-gray-300 md:grid-cols-2">
                        <p className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                            <strong>Total Penjadwalan Ditampilkan:</strong> {totalSchedulesDisplayed}
                            <button
                                onClick={() => setShowDisplayedDetails(!showDisplayedDetails)}
                                className="mt-2 ml-0 w-full rounded-md bg-blue-500 px-3 py-1 text-xs text-white transition-colors duration-150 hover:bg-blue-600 sm:ml-2 sm:mt-0 sm:w-auto"
                            >
                                {showDisplayedDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
                            </button>
                        </p>
                        <p className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                            <strong>Total Penjadwalan Minggu Ini:</strong> {totalSchedulesThisWeek}
                            <button
                                onClick={() => setShowWeeklyDetails(!showWeeklyDetails)}
                                className="mt-2 ml-0 w-full rounded-md bg-blue-500 px-3 py-1 text-xs text-white transition-colors duration-150 hover:bg-blue-600 sm:ml-2 sm:mt-0 sm:w-auto"
                            >
                                {showWeeklyDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Detail Modals for Summary */}
                {showDisplayedDetails && (
                    <ScheduleDetailList
                        title="Detail Semua Penjadwalan Ditampilkan"
                        schedules={schedules}
                        onClose={() => setShowDisplayedDetails(false)}
                    />
                )}
                {showWeeklyDetails && (
                    <ScheduleDetailList
                        title="Detail Penjadwalan Minggu Ini"
                        schedules={schedulesThisWeek}
                        onClose={() => setShowWeeklyDetails(false)}
                    />
                )}

                {/* Shift Detail Modal */}
                <ShiftDetailModal
                    shift={currentShiftDetails}
                    onClose={closeShiftModal}
                />

                {/* New Manpower Request Detail Modal */}
                <ManPowerRequestDetailModal
                    request={currentManPowerRequestDetails}
                    assignedEmployees={assignedEmployeesForModal}
                    onClose={closeManPowerRequestModal}
                />
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;