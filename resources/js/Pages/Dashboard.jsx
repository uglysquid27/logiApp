import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import React, { useState, useEffect } from 'react';

dayjs.locale('id');

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Reusable Modal Component
const DetailModal = ({ isOpen, onClose, title, data, columns, formatDate, onFilterOrPaginate }) => {
    if (!isOpen) return null;

    const isPaginated = data && data.links && Array.isArray(data.data);
    const items = isPaginated ? data.data : data;
    const paginationLinks = isPaginated ? data.links : [];

    const [filterValues, setFilterValues] = useState({});

    // Populate filter values from URL on initial open or data change
    // This ensures filters persist across pagination and are set if coming from a direct filtered link
    useEffect(() => {
        if (isOpen && data && data.path) {
            const url = new URL(data.path);
            const params = new URLSearchParams(url.search);
            const newFilterValues = {};
            columns.forEach(col => {
                const filterKey = col.filterField || col.field; // Use filterField if specified, else field

                if (col.filterable) {
                    if (col.filterType === 'date_range') {
                        if (params.has(`filter_${filterKey}_from`)) {
                            newFilterValues[`${filterKey}_from`] = params.get(`filter_${filterKey}_from`);
                        }
                        if (params.has(`filter_${filterKey}_to`)) {
                            newFilterValues[`${filterKey}_to`] = params.get(`filter_${filterKey}_to`);
                        }
                    } else {
                        if (params.has(`filter_${filterKey}`)) {
                            newFilterValues[filterKey] = params.get(`filter_${filterKey}`);
                        }
                    }
                }
            });
            setFilterValues(newFilterValues);
        }
    }, [isOpen, data, columns]);

    const handleFilterChange = (field, value) => {
        setFilterValues(prev => ({ ...prev, [field]: value }));
    };

    const applyFilters = () => {
        const params = new URLSearchParams();
        Object.entries(filterValues).forEach(([key, value]) => {
            // Ensure values are not empty strings or null before appending
            if (value !== '' && value !== null) {
                params.append(`filter_${key}`, value);
            }
        });
        // Call the parent function to re-fetch data with filters (and effectively reset page to 1)
        onFilterOrPaginate(data.path, params.toString());
    };

    const resetFilters = () => {
        setFilterValues({});
        onFilterOrPaginate(data.path, ''); // Re-fetch with no filters
    };

    const handlePaginationClick = (url) => {
        if (!url) return;
        // The pagination link already contains the existing filters from Laravel's withQueryString()
        onFilterOrPaginate(url);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all sm:my-8 sm:align-middle sm:p-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Filter Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">Filter Data</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {columns.map((col, index) => {
                            if (col.filterable) {
                                // Determine the key for filterValues state
                                const filterKey = col.filterField || col.field;

                                return (
                                    <div key={index} className="flex flex-col">
                                        <label htmlFor={`filter-${col.field}`} className="block text-sm font-medium text-gray-700 mb-1">
                                            {col.header}
                                        </label>
                                        {col.filterType === 'text' && (
                                            <input
                                                type="text"
                                                id={`filter-${col.field}`}
                                                value={filterValues[filterKey] || ''}
                                                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder={`Cari ${col.header.toLowerCase()}`}
                                            />
                                        )}
                                        {col.filterType === 'select' && (
                                            <select
                                                id={`filter-${col.field}`}
                                                value={filterValues[filterKey] || ''}
                                                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            >
                                                <option value="">-- Pilih {col.header} --</option>
                                                {col.filterOptions && col.filterOptions.map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        )}
                                        {col.filterType === 'date_range' && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="date"
                                                    id={`filter-${col.field}-from`}
                                                    value={filterValues[`${filterKey}_from`] || ''}
                                                    onChange={(e) => handleFilterChange(`${filterKey}_from`, e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    title={`Dari Tanggal ${col.header}`}
                                                />
                                                <input
                                                    type="date"
                                                    id={`filter-${col.field}-to`}
                                                    value={filterValues[`${filterKey}_to`] || ''}
                                                    onChange={(e) => handleFilterChange(`${filterKey}_to`, e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                    title={`Sampai Tanggal ${col.header}`}
                                                />
                                            </div>
                                        )}
                                        {col.filterType === 'number' && (
                                            <input
                                                type="number"
                                                id={`filter-${col.field}`}
                                                value={filterValues[filterKey] || ''}
                                                onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                placeholder={`Jumlah ${col.header.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={resetFilters}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Reset Filter
                        </button>
                        <button
                            onClick={applyFilters}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    {items && items.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {columns.map((col, index) => (
                                            <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {col.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.map((item, itemIndex) => (
                                        <tr key={item.id || itemIndex}>
                                            {columns.map((col, colIndex) => (
                                                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {col.render ? col.render(item, formatDate) : (item[col.field] || 'N/A')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 italic text-center py-8">Tidak ada data untuk ditampilkan.</p>
                    )}

                    {isPaginated && paginationLinks.length > 3 && (
                        <nav className="mt-4 flex justify-center" aria-label="Pagination">
                            {paginationLinks.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePaginationClick(link.url)}
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-gray-300 ${
                                        link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                                    } ${index === 0 ? 'rounded-l-md' : ''} ${index === paginationLinks.length - 1 ? 'rounded-r-md' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    disabled={!link.url}
                                >
                                </button>
                            ))}
                        </nav>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function Dashboard() {
    const {
        summary,
        manpowerRequestChartData,
        employeeAssignmentChartData,
        recentPendingRequests,
        upcomingSchedules,
    } = usePage().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState(null);
    const [modalColumns, setModalColumns] = useState([]);
    const [modalFetchUrl, setModalFetchUrl] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('DD MMMM HH:mm');
    };

    const handleModalDataFetch = async (url, queryString = '') => {
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        console.log('Fetching modal data from URL:', fullUrl); // Important debug log
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                // If the response is not OK, try to read the error body
                const errorBody = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}. Response: ${errorBody}`);
            }
            const data = await response.json();
            setModalData(data);
        } catch (error) {
            console.error("Failed to fetch modal data:", error);
            // You might want to show a user-friendly error message here
            setModalData(null); // Clear data if fetch fails
        }
    };

    const openDetailModal = (url, title, columns) => {
        console.log('openDetailModal called for:', title, 'URL:', url); // Important debug log
        setModalTitle(title);
        setModalColumns(columns);
        setModalFetchUrl(url); // Store the base URL for filtering/pagination
        handleModalDataFetch(url); // Initial fetch without filters
        setModalOpen(true);
    };

    // --- Filter Options Data ---
    // Make sure these values (e.g., 1, 2, 3) match the actual IDs in your database!
    // Ideally, these would be fetched from your Laravel controller (e.g., SubSection::all())
    // and passed as Inertia props to ensure they are always up-to-date.
    const employeeTypes = [{value: 'bulanan', label: 'Bulanan'}, {value: 'harian', label: 'Harian'}];
    const employeeStatuses = [{value: 'available', label: 'Tersedia'}, {value: 'unavailable', label: 'Tidak Tersedia'}];
    const cutiOptions = [{value: 'yes', label: 'Ya'}, {value: 'no', label: 'Tidak'}];

    const sampleSubSectionOptions = [
        { value: 1, label: 'Produksi' },
        { value: 2, label: 'Quality Control' },
        { value: 3, label: 'Logistik' },
        { value: 4, label: 'HRD' }, // Example: Add more if applicable
        // ... add more based on your actual database SubSection records
    ];
    const sampleShiftOptions = [
        { value: 1, label: 'Shift Pagi' },
        { value: 2, label: 'Shift Sore' },
        { value: 3, label: 'Shift Malam' },
        // ... add more based on your actual database Shift records
    ];


    // --- Column Definitions with Filter Metadata ---
    const activeEmployeesColumns = [
        { header: 'NIK', field: 'nik', filterable: true, filterType: 'text' },
        { header: 'Nama Pegawai', field: 'name', filterable: true, filterType: 'text' },
        { header: 'Tipe', field: 'type', filterable: true, filterType: 'select', filterOptions: employeeTypes },
        { header: 'Status', field: 'status', filterable: true, filterType: 'select', filterOptions: employeeStatuses },
        { header: 'Cuti', field: 'cuti', filterable: true, filterType: 'select', filterOptions: cutiOptions },
        { header: 'Tanggal Masuk', field: 'created_at', render: (item, fmt) => fmt(item.created_at), filterable: true, filterType: 'date_range' },
    ];

    const pendingRequestsColumns = [
        { header: 'Tanggal', field: 'date', render: (item, fmt) => fmt(item.date), filterable: true, filterType: 'date_range' },
        { header: 'Sub Bagian', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleSubSectionOptions, filterField: 'sub_section_id' },
        { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleShiftOptions, filterField: 'shift_id' },
        { header: 'Jumlah Diminta', field: 'requested_amount', filterable: true, filterType: 'number' },
        { header: 'Status', field: 'status' }, // Backend already filters by 'pending', so not directly filterable in UI
    ];

    const fulfilledRequestsColumns = [
        { header: 'Tanggal', field: 'date', render: (item, fmt) => fmt(item.date), filterable: true, filterType: 'date_range' },
        { header: 'Sub Bagian', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleSubSectionOptions, filterField: 'sub_section_id' },
        { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleShiftOptions, filterField: 'shift_id' },
        { header: 'Jumlah Diminta', field: 'requested_amount', filterable: true, filterType: 'number' },
        { header: 'Status', field: 'status' }, // Backend already filters by 'fulfilled', so not directly filterable in UI
    ];

    const upcomingSchedulesColumns = [
        { header: 'Tanggal', field: 'date', render: (item, fmt) => fmt(item.date), filterable: true, filterType: 'date_range' },
        { header: 'Nama Pegawai', field: 'employee', render: (item) => item.employee?.name || 'N/A', filterable: true, filterType: 'text', filterField: 'employee_name' }, // 'employee_name' is a conceptual filter field for a relationship
        { header: 'Sub Bagian', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleSubSectionOptions, filterField: 'sub_section_id' },
        { header: 'Shift', field: 'man_power_request_shift', render: (item) => item.man_power_request?.shift?.name || 'N/A', filterable: true, filterType: 'select', filterOptions: sampleShiftOptions, filterField: 'shift_id' }, // Filters via man_power_request's shift_id
    ];

    // Chart options (assuming these are defined elsewhere or need to be defined here)
    const manpowerRequestChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Jumlah Request Manpower (7 Hari Terakhir)',
            },
        },
    };

    const employeeAssignmentChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Jumlah Penugasan Pegawai (7 Hari Terakhir)',
            },
        },
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-semibold text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="p-4 bg-gray-100 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Summary Cards Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {/* Active Employees Card */}
                        <div
                            className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-300 ease-in-out hover:shadow-xl hover:scale-105"
                            onClick={() => openDetailModal(route('dashboard.employees.active'), 'Daftar Pegawai Aktif', activeEmployeesColumns)}
                        >
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pegawai Aktif</h3>
                            <p className="text-5xl font-extrabold text-indigo-600">
                                {summary.activeEmployeesCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalEmployeesCount} Total</p>
                        </div>

                        {/* Pending Manpower Requests Card */}
                        <div
                            className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-300 ease-in-out hover:shadow-xl hover:scale-105"
                            // **CRITICAL: Ensure 'dashboard.requests.pending' matches your routes/web.php**
                            onClick={() => openDetailModal(route('dashboard.requests.pending'), 'Daftar Request Pending', pendingRequestsColumns)}
                        >
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Request Pending</h3>
                            <p className="text-5xl font-extrabold text-yellow-600">
                                {summary.pendingRequestsCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalRequestsCount} Total</p>
                        </div>

                        {/* Fulfilled Manpower Requests Card */}
                        <div
                            className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-300 ease-in-out hover:shadow-xl hover:scale-105"
                            // **CRITICAL: Ensure 'dashboard.requests.fulfilled' matches your routes/web.php**
                            onClick={() => openDetailModal(route('dashboard.requests.fulfilled'), 'Daftar Request Terpenuhi', fulfilledRequestsColumns)}
                        >
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Request Terpenuhi</h3>
                            <p className="text-5xl font-extrabold text-green-600">
                                {summary.fulfilledRequestsCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalRequestsCount} Total</p>
                        </div>

                        {/* Schedules This Week Card */}
                        <div
                            className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-300 ease-in-out hover:shadow-xl hover:scale-105"
                            // **CRITICAL: Ensure 'dashboard.schedules.upcoming' matches your routes/web.php**
                            onClick={() => openDetailModal(route('dashboard.schedules.upcoming'), 'Daftar Penjadwalan Mendatang', upcomingSchedulesColumns)}
                        >
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Penjadwalan Minggu Ini</h3>
                            <p className="text-5xl font-extrabold text-blue-600">
                                {summary.thisWeekSchedulesCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalSchedulesCount} Total</p>
                        </div>
                    </div>

                    {/* Charts Section (unchanged) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                        <div className="bg-white shadow-lg rounded-lg p-6 h-96">
                            <Bar data={manpowerRequestChartData} options={manpowerRequestChartOptions} />
                        </div>
                        <div className="bg-white shadow-lg rounded-lg p-6 h-96">
                            <Bar data={employeeAssignmentChartData} options={employeeAssignmentChartOptions} />
                        </div>
                    </div>

                    {/* Recent Pending Requests and Upcoming Schedules Tables (unchanged) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white shadow-lg rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">5 Request Manpower Pending Terbaru</h3>
                            {recentPendingRequests && recentPendingRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Bagian</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Diminta</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {recentPendingRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(request.date)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.shift?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.requested_amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600 italic">Tidak ada request pending terbaru.</p>
                            )}
                        </div>

                        <div className="bg-white shadow-lg rounded-lg p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">5 Penjadwalan Mendatang Terbaru</h3>
                            {upcomingSchedules && upcomingSchedules.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pegawai</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sub Bagian</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {upcomingSchedules.map((schedule) => (
                                                <tr key={schedule.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(schedule.date)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.employee?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.man_power_request?.shift?.name || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600 italic">Tidak ada penjadwalan mendatang.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Render the Modal */}
            <DetailModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                data={modalData}
                columns={modalColumns}
                formatDate={formatDate}
                onFilterOrPaginate={handleModalDataFetch}
            />
        </AuthenticatedLayout>
    );
}