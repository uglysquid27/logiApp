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
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 rounded-lg w-full max-w-md">
                <button
                    onClick={onClose}
                    className="top-3 right-3 absolute text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-400"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 font-bold text-gray-900 dark:text-gray-100 text-2xl">Detail Shift: {shift.name}</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p><strong>Nama Shift:</strong> {shift.name}</p>
                    <p><strong>Waktu Mulai:</strong> {shift.start_time}</p>
                    <p><strong>Waktu Selesai:</strong> {shift.end_time}</p>
                    <p><strong>Total Jam:</strong> {shift.hours} jam</p>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white"
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
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 rounded-lg w-full max-w-md">
                <button
                    onClick={onClose}
                    className="top-3 right-3 absolute text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-400"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 font-bold text-gray-900 dark:text-gray-100 text-2xl">Detail Man Power Request</h3>
                <div className="space-y-2 text-gray-700 dark:text-gray-300">
                    <p><strong>Tanggal Dibutuhkan:</strong> {formatDate(request.date)}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name || 'N/A'}</p>
                    <p><strong>Section:</strong> {request.sub_section?.section?.name || 'N/A'}</p>
                    <p><strong>Shift:</strong> {request.shift?.name || 'N/A'}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                    <p><strong>Status:</strong> {request.status}</p>

                    <h4 className="mt-4 font-semibold text-gray-800 dark:text-gray-200 text-lg">Pegawai Ditugaskan:</h4>
                    {assignedEmployees && assignedEmployees.length > 0 ? (
                        <ul className="space-y-1 list-disc list-inside">
                            {assignedEmployees.map((empItem, index) => (
                                <li key={index} className="text-gray-700 dark:text-gray-300">
                                    {empItem.name} (NIK: {empItem.nik})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 italic">Belum ada pegawai yang ditugaskan untuk request ini.</p>
                    )}
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

const ScheduleSection = ({ title, schedulesBySubSection, openManPowerRequestModal }) => (
    <div className="flex-1 bg-white dark:bg-gray-800 shadow-md mb-8 p-6 rounded-lg min-w-80">
        <h2 className="mb-4 font-semibold text-gray-800 dark:text-gray-100 text-xl">{title}</h2>
        {Object.keys(schedulesBySubSection).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 italic">Tidak ada penjadwalan di bagian ini.</p>
        ) : (
            Object.entries(schedulesBySubSection).map(([subSectionName, employeesWithDetails]) => (
                <div key={subSectionName} className="mb-6 pb-4 last:pb-0 border-gray-200 dark:border-gray-700 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-blue-700 dark:text-blue-400 text-lg">{subSectionName}</h3>
                        {employeesWithDetails[0]?.man_power_request && (
                            <button
                                onClick={() => openManPowerRequestModal(
                                    employeesWithDetails[0].man_power_request,
                                    employeesWithDetails.map(item => item.employee)
                                )}
                                className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 ml-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white transition-colors duration-150"
                                title={`Lihat detail Request untuk ${subSectionName}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </button>
                        )}
                    </div>
                    <div className="shadow-sm rounded-lg overflow-x-auto">
                        <table className="divide-y divide-gray-200 dark:divide-gray-700 min-w-full table-fixed">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        Nama Pegawai
                                    </th>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        NIK
                                    </th>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        Tipe
                                    </th>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        Sub-Section
                                    </th>
                                    <th scope="col" className="px-6 py-3 w-1/6 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                        Section
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {employeesWithDetails.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                                            {item.employee.name || 'Nama Pegawai Tidak Diketahui'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                            {item.employee.nik || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                            {item.employee.type || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                            {item.employee.status || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                            {item.sub_section?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
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
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative bg-white dark:bg-gray-800 shadow-xl p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="top-3 right-3 absolute text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 dark:text-gray-400"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 font-bold text-gray-900 dark:text-gray-100 text-2xl">{title}</h3>
                <div className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-x-auto">
                    <table className="divide-y divide-gray-200 dark:divide-gray-700 min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                    Nama Pegawai
                                </th>
                                <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                    NIK
                                </th>
                                <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                    Shift
                                </th>
                                <th scope="col" className="px-6 py-3 font-medium text-gray-500 dark:text-gray-300 text-xs text-left uppercase tracking-wider">
                                    Sub-Section
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {schedules.map((scheduleItem) => (
                                <tr key={scheduleItem.id}>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                        {formatDate(scheduleItem.date)}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                                        {scheduleItem.employee?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                        {scheduleItem.employee?.nik || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                        {scheduleItem.man_power_request?.shift?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-nowrap">
                                        {scheduleItem.sub_section?.name || 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white"
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
                <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
                    Agenda Penjadwalan
                </h2>
            }
        >
            <div className="mx-auto mt-10 p-4 max-w-5xl">
                <h1 className="mb-8 font-extrabold text-gray-900 dark:text-gray-100 text-3xl text-center">Agenda Penjadwalan</h1>

                {/* Date Filter Section */}
                <div className="flex sm:flex-row flex-col items-center sm:space-x-4 space-y-4 sm:space-y-0 bg-white dark:bg-gray-800 shadow-md mb-8 p-4 rounded-lg">
                    <label htmlFor="startDate" className="block font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Dari Tanggal:
                    </label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block bg-white dark:bg-gray-700 shadow-sm mt-1 px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                    />

                    <label htmlFor="endDate" className="block font-medium text-gray-700 dark:text-gray-300 text-sm">
                        Sampai Tanggal:
                    </label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block bg-white dark:bg-gray-700 shadow-sm mt-1 px-3 py-2 border border-gray-300 focus:border-indigo-500 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 w-full sm:w-auto text-gray-900 dark:text-gray-100 sm:text-sm"
                    />

                    <button
                        onClick={applyFilters}
                        className="bg-indigo-600 hover:bg-indigo-700 ml-0 sm:ml-4 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white transition-colors duration-150"
                    >
                        Filter
                    </button>
                    <button
                        onClick={clearFilters}
                        className="bg-gray-500 hover:bg-gray-600 ml-0 sm:ml-2 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white transition-colors duration-150"
                    >
                        Clear Filter
                    </button>
                </div>

                {Object.keys(groupedSchedulesByDateShiftSubSection).length === 0 ? (
                    <div className="bg-blue-100 dark:bg-blue-900 p-4 border-blue-500 dark:border-blue-700 border-l-4 rounded-md text-blue-700 dark:text-blue-200" role="alert">
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
                                    <h2 className="bg-gray-100 dark:bg-gray-700 shadow-sm mb-6 p-4 rounded-lg font-bold text-gray-800 dark:text-gray-100 text-2xl">
                                        {dateData.displayDate}
                                    </h2>
                                    {/* Wrap shifts in a flex container for horizontal display */}
                                    <div className="flex md:flex-row flex-col md:space-x-4 pb-4 overflow-x-auto">
                                        {sortedShiftsForDate.map(shiftName => (
                                            <div key={`${dateKey}-${shiftName}`} className="flex-1 min-w-80">
                                                <div className="flex justify-between items-center mb-4">
                                                    {/* ScheduleSection now only renders the sub-sections and employees */}
                                                    <ScheduleSection
                                                        title={`Shift ${shiftName}`}
                                                        schedulesBySubSection={shiftsForDate[shiftName].subSections}
                                                        openManPowerRequestModal={openManPowerRequestModal}
                                                    />
                                                    <button
                                                        onClick={() => openShiftModal(shiftsForDate[shiftName].details)}
                                                        className="flex-shrink-0 bg-indigo-500 hover:bg-indigo-600 ml-2 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 text-white transition-colors duration-150"
                                                        title={`Lihat detail Shift ${shiftName}`}
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <hr className="my-10 border-gray-200 dark:border-gray-700 border-t-2" />
                            </React.Fragment>
                        );
                    })
                )}

                {/* Summary Section */}
                <div className="bg-white dark:bg-gray-800 shadow-md mt-8 p-6 rounded-lg">
                    <h3 className="mb-4 font-bold text-gray-800 dark:text-gray-100 text-xl">Ringkasan Penjadwalan</h3>
                    <div className="gap-4 grid grid-cols-1 md:grid-cols-2 text-gray-700 dark:text-gray-300">
                        <p className="flex justify-between items-center">
                            <strong>Total Penjadwalan Ditampilkan:</strong> {totalSchedulesDisplayed}
                            <button
                                onClick={() => setShowDisplayedDetails(!showDisplayedDetails)}
                                className="bg-blue-500 hover:bg-blue-600 ml-2 px-3 py-1 rounded-md text-white text-xs transition-colors duration-150"
                            >
                                {showDisplayedDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
                            </button>
                        </p>
                        <p className="flex justify-between items-center">
                            <strong>Total Penjadwalan Minggu Ini:</strong> {totalSchedulesThisWeek}
                            <button
                                onClick={() => setShowWeeklyDetails(!showWeeklyDetails)}
                                className="bg-blue-500 hover:bg-blue-600 ml-2 px-3 py-1 rounded-md text-white text-xs transition-colors duration-150"
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