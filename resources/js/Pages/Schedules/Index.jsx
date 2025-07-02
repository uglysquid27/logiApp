import React, { useState, useEffect, useMemo } from 'react';
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

const ShiftDetailModal = ({ shift, onClose }) => {
    if (!shift) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-2">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Detail Shift: {shift.name}</h3>
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

const ManPowerRequestDetailModal = ({ request, assignedEmployees, onClose }) => {
    if (!request) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return dayjs(dateString).format('dddd, DD MMMM YYYY');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800 mx-2">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">Detail Man Power Request</h3>
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

const ScheduleDetailList = ({ title, schedules, onClose }) => {
    if (!schedules || schedules.length === 0) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return dayjs(dateString).format('dddd, DD MMMM YYYY');
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50 p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800 mx-2 sm:p-6">
                <button
                    onClick={onClose}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">{title}</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6 sm:py-3">
                                    Tanggal
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6 sm:py-3">
                                    Nama
                                </th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6 sm:py-3">
                                    NIK
                                </th>
                                <th scope="col" className="hidden px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:table-cell sm:px-6 sm:py-3">
                                    Shift
                                </th>
                                <th scope="col" className="hidden px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 md:table-cell sm:px-6 sm:py-3">
                                    Sub-Section
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800">
                            {schedules.map((scheduleItem) => (
                                <tr key={scheduleItem.id}>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 sm:px-6 sm:py-4">
                                        {formatDate(scheduleItem.date)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 sm:px-6 sm:py-4">
                                        {scheduleItem.employee?.name || 'N/A'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 sm:px-6 sm:py-4">
                                        {scheduleItem.employee?.nik || 'N/A'}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 sm:table-cell sm:px-6 sm:py-4">
                                        {scheduleItem.man_power_request?.shift?.name || 'N/A'}
                                    </td>
                                    <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 md:table-cell sm:px-6 sm:py-4">
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

const ScheduleSection = ({ title, schedulesBySubSection, openManPowerRequestModal }) => {
    return (
        <div className="flex-1 min-w-[300px] rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 sm:text-xl">{title}</h2>
                {Object.values(schedulesBySubSection)[0]?.[0]?.man_power_request && (
                    <button
                        onClick={() => openManPowerRequestModal(
                            Object.values(schedulesBySubSection)[0][0].man_power_request,
                            Object.values(schedulesBySubSection).flatMap(subSection => subSection.map(item => item.employee))
                        )}
                        className="ml-2 flex-shrink-0 rounded-full bg-blue-500 p-1 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-600 dark:focus:ring-offset-gray-800"
                        title={`Lihat detail Request untuk ${title}`}
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                )}
            </div>
            
            {Object.keys(schedulesBySubSection).length === 0 ? (
                <p className="mt-4 italic text-gray-600 dark:text-gray-400">Tidak ada penjadwalan di bagian ini.</p>
            ) : (
                Object.entries(schedulesBySubSection).map(([subSectionName, employeesWithDetails]) => (
                    <div key={subSectionName} className="mt-4 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0 dark:border-gray-700">
                        <h3 className="text-md mb-3 font-medium text-blue-700 dark:text-blue-400 sm:text-lg">{subSectionName}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6 sm:py-3">
                                            Nama
                                        </th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:px-6 sm:py-3">
                                            NIK
                                        </th>
                                        <th scope="col" className="hidden px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 sm:table-cell sm:px-6 sm:py-3">
                                            Tipe
                                        </th>
                                        <th scope="col" className="hidden px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300 md:table-cell sm:px-6 sm:py-3">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                    {employeesWithDetails.map((item, index) => (
                                        <tr key={index}>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 sm:px-6 sm:py-4">
                                                {item.employee.name || 'Nama Pegawai Tidak Diketahui'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 sm:px-6 sm:py-4">
                                                {item.employee.nik || '-'}
                                            </td>
                                            <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 sm:table-cell sm:px-6 sm:py-4">
                                                {item.employee.type || '-'}
                                            </td>
                                            <td className="hidden whitespace-nowrap px-3 py-2 text-sm text-gray-700 dark:text-gray-300 md:table-cell sm:px-6 sm:py-4">
                                                {item.employee.status || '-'}
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
};

const Index = () => {
    const { schedules, filters } = usePage().props;
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [currentShiftDetails, setCurrentShiftDetails] = useState(null);
    const [showManPowerRequestModal, setShowManPowerRequestModal] = useState(false);
    const [currentManPowerRequestDetails, setCurrentManPowerRequestDetails] = useState(null);
    const [assignedEmployeesForModal, setAssignedEmployeesForModal] = useState([]);
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [showDisplayedDetails, setShowDisplayedDetails] = useState(false);
    const [showWeeklyDetails, setShowWeeklyDetails] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    
    const itemsPerPage = 3;

    useEffect(() => {
        setStartDate(filters.start_date || '');
        setEndDate(filters.end_date || '');
        setCurrentPage(1);
    }, [filters]);

    const groupedSchedulesByDateShiftSubSection = useMemo(() => {
        return schedules.reduce((acc, schedule) => {
            if (!schedule.employee || !schedule.sub_section || !schedule.man_power_request?.shift || !schedule.man_power_request?.sub_section?.section) {
                console.warn('Schedule missing essential data (employee, sub_section, shift, or section):', schedule);
                return acc;
            }

            const dateKey = dayjs(schedule.date).format('YYYY-MM-DD');
            const displayDate = dayjs(schedule.date).format('dddd, DD MMMM YYYY');
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
    }, [schedules]);

    const sortedDates = useMemo(() => 
        Object.keys(groupedSchedulesByDateShiftSubSection).sort((a, b) => 
            dayjs(a).valueOf() - dayjs(b).valueOf()
        ), 
        [groupedSchedulesByDateShiftSubSection]
    );

    const totalPages = Math.ceil(sortedDates.length / itemsPerPage);
    const paginatedDates = sortedDates.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const applyFilters = async () => {
        if (startDate && endDate) {
            const daysDiff = dayjs(endDate).diff(dayjs(startDate), 'day');
            if (daysDiff > 30) {
                alert('Mohon pilih rentang tanggal maksimal 30 hari');
                return;
            }
        }
        
        setIsLoading(true);
        try {
            await router.get(route('schedules.index'), {
                start_date: startDate,
                end_date: endDate,
            }, {
                preserveState: true,
                preserveScroll: true,
            });
            setCurrentPage(1);
        } finally {
            setIsLoading(false);
        }
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        router.get(route('schedules.index'), {
            start_date: '',
            end_date: '',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
        setCurrentPage(1);
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

    const totalSchedulesDisplayed = schedules.length;
    
    const today = dayjs().startOf('day');
    const sevenDaysAgo = dayjs().subtract(6, 'day').startOf('day');
    const schedulesThisWeek = schedules.filter(schedule =>
        dayjs(schedule.date).isBetween(sevenDaysAgo, today, 'day', '[]')
    );
    const totalSchedulesThisWeek = schedulesThisWeek.length;

    const shiftOrder = { 'Pagi': 1, 'Siang': 2, 'Malam': 3 };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Agenda Penjadwalan
                </h2>
            }
        >
            <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="mb-6 text-center text-2xl font-extrabold text-gray-900 dark:text-gray-100 sm:text-3xl">Agenda Penjadwalan</h1>

                <div className="mb-6 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
                    <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                        <div className="flex-1 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
                            <div className="flex-1">
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Dari Tanggal:
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
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
                                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
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
                </div>

                {isLoading && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                        <div className="rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
                            Memuat jadwal...
                        </div>
                    </div>
                )}

                {Object.keys(groupedSchedulesByDateShiftSubSection).length === 0 ? (
                    <div className="rounded-md border-l-4 border-blue-500 bg-blue-100 p-4 text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200" role="alert">
                        <p className="font-bold">Informasi:</p>
                        <p>Tidak ada penjadwalan dalam rentang tanggal yang dipilih.</p>
                    </div>
                ) : (
                    <>
                        {paginatedDates.map(dateKey => {
                            const dateData = groupedSchedulesByDateShiftSubSection[dateKey];
                            const shiftsForDate = dateData.shifts;

                            const sortedShiftsForDate = Object.keys(shiftsForDate).sort((a, b) => {
                                return (shiftOrder[a] || 99) - (shiftOrder[b] || 99);
                            });

                            return (
                                <div key={dateKey} className="mb-8">
                                    <h2 className="mb-4 rounded-lg bg-gray-100 p-3 text-xl font-bold text-gray-800 shadow-sm dark:bg-gray-700 dark:text-gray-100 sm:p-4 sm:text-2xl">
                                        {dateData.displayDate}
                                    </h2>
                                    <div className="flex flex-row flex-wrap gap-4">
                                        {sortedShiftsForDate.map(shiftName => (
                                            <React.Fragment key={`${dateKey}-${shiftName}`}>
                                                <ScheduleSection
                                                    title={`Shift ${shiftName}`}
                                                    schedulesBySubSection={shiftsForDate[shiftName].subSections}
                                                    openManPowerRequestModal={openManPowerRequestModal}
                                                />
                                                <button
                                                    onClick={() => openShiftModal(shiftsForDate[shiftName].details)}
                                                    className="self-start rounded-full bg-indigo-500 p-2 text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-indigo-600 dark:focus:ring-offset-gray-800"
                                                    title={`Lihat detail Shift ${shiftName}`}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                </button>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white disabled:bg-indigo-300 dark:disabled:bg-indigo-800 sm:w-auto"
                                >
                                    Previous
                                </button>
                                
                                <span className="text-gray-700 dark:text-gray-300">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white disabled:bg-indigo-300 dark:disabled:bg-indigo-800 sm:w-auto"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-8 rounded-lg bg-white p-4 shadow-md dark:bg-gray-800 sm:p-6">
                    <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100 sm:text-xl">Ringkasan Penjadwalan</h3>
                    <div className="grid grid-cols-1 gap-4 text-gray-700 dark:text-gray-300 sm:grid-cols-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <strong className="mb-2 sm:mb-0">Total Penjadwalan Ditampilkan:</strong> 
                            <span className="sm:ml-2">{totalSchedulesDisplayed}</span>
                            <button
                                onClick={() => setShowDisplayedDetails(!showDisplayedDetails)}
                                className="mt-2 rounded-md bg-blue-500 px-3 py-1 text-xs text-white transition-colors duration-150 hover:bg-blue-600 sm:mt-0 sm:ml-4"
                            >
                                {showDisplayedDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <strong className="mb-2 sm:mb-0">Total Penjadwalan Minggu Ini:</strong> 
                            <span className="sm:ml-2">{totalSchedulesThisWeek}</span>
                            <button
                                onClick={() => setShowWeeklyDetails(!showWeeklyDetails)}
                                className="mt-2 rounded-md bg-blue-500 px-3 py-1 text-xs text-white transition-colors duration-150 hover:bg-blue-600 sm:mt-0 sm:ml-4"
                            >
                                {showWeeklyDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
                            </button>
                        </div>
                    </div>
                </div>

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

                <ShiftDetailModal
                    shift={currentShiftDetails}
                    onClose={closeShiftModal}
                />

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