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
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn, staggerContainer, slideIn, cardVariants } from '@/Animations';

dayjs.locale('id');

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return <div className="p-4 text-red-500">Something went wrong. Please refresh the page.</div>;
        }
        return this.props.children;
    }
}

const DetailModal = ({
    isOpen,
    onClose,
    title,
    data = null,
    columns = [],
    formatDate,
    onFilterOrPaginate
}) => {
    const items = data?.data || [];
    const paginationLinks = data?.links || [];
    const isPaginated = paginationLinks.length > 0;

    const [filterValues, setFilterValues] = useState({});

    useEffect(() => {
        if (isOpen && data?.path) {
            try {
                const url = new URL(data.path);
                const params = new URLSearchParams(url.search);
                const newFilterValues = {};

                columns.forEach(col => {
                    if (!col.filterable) return;

                    const filterKey = col.filterField || col.field;
                    if (col.filterType === 'date_range') {
                        if (params.has(`filter_${filterKey}_from`)) {
                            newFilterValues[`${filterKey}_from`] = params.get(`filter_${filterKey}_from`);
                        }
                        if (params.has(`filter_${filterKey}_to`)) {
                            newFilterValues[`${filterKey}_to`] = params.get(`filter_${filterKey}_to`);
                        }
                    } else if (params.has(`filter_${filterKey}`)) {
                        newFilterValues[filterKey] = params.get(`filter_${filterKey}`);
                    }
                });
                setFilterValues(newFilterValues);
            } catch (e) {
                console.error('Error parsing URL:', e);
            }
        }
    }, [isOpen, data, columns]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
                    >
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-medium">{title}</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto flex-grow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {columns.map((column, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                {column.header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {items.length > 0 ? (
                                        items.map((item, itemIdx) => (
                                            <tr key={itemIdx} className="hover:bg-gray-50">
                                                {columns.map((column, colIdx) => (
                                                    <td key={colIdx} className="px-4 py-4 whitespace-nowrap text-sm">
                                                        {column.render ? column.render(item) : item[column.field]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={columns.length} className="px-4 py-4 text-center text-sm text-gray-500">
                                                No data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {isPaginated && (
                            <div className="px-6 py-3 border-t flex justify-between items-center bg-gray-50">
                                <div className="flex space-x-2">
                                    {paginationLinks.map((link, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onFilterOrPaginate(link.url, null)}
                                            disabled={!link.url || link.active}
                                            className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border'} ${!link.url ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                        >
                                            {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default function Dashboard() {
    const { props } = usePage();
    const {
        summary = {},
        manpowerRequestChartData: initialManpowerRequestChartData = { labels: [], datasets: [] },
        employeeAssignmentChartData: initialEmployeeAssignmentChartData = { labels: [], datasets: [] },
        recentPendingRequests = [],
        upcomingSchedules = [],
        sections = []
    } = props;

    // State for component heights
    const [componentHeights, setComponentHeights] = useState({
        chart1: 400,
        chart2: 400,
        table1: 400,
        table2: 400
    });

    const [filters, setFilters] = useState({
        dateRange: {
            from: dayjs().startOf('month').format('YYYY-MM-DD'),
            to: dayjs().endOf('month').format('YYYY-MM-DD')
        },
        section: null,
        subSection: null,
        shift: null
    });

    const [manpowerRequestChartData, setManpowerRequestChartData] = useState(initialManpowerRequestChartData);
    const [employeeAssignmentChartData, setEmployeeAssignmentChartData] = useState(initialEmployeeAssignmentChartData);
    const [modalState, setModalState] = useState({
        open: false,
        title: '',
        data: null,
        columns: [],
        url: ''
    });
    const [chartModalState, setChartModalState] = useState({
        open: false,
        title: '',
        data: null,
        columns: [],
        url: ''
    });

    const resetFilters = () => {
        setFilters({
            dateRange: {
                from: dayjs().startOf('month').format('YYYY-MM-DD'),
                to: dayjs().endOf('month').format('YYYY-MM-DD')
            },
            section: null,
            subSection: null,
            shift: null
        });
        
        setManpowerRequestChartData(initialManpowerRequestChartData);
        setEmployeeAssignmentChartData(initialEmployeeAssignmentChartData);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = dayjs(dateString);
        return date.isValid() ? date.format('DD MMMM YYYY') : 'N/A';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = dayjs(dateString);
        return date.isValid() ? date.format('DD MMMM HH:mm') : 'N/A';
    };

    const fetchModalData = async (url, query = '') => {
        try {
            const response = await fetch(query ? `${url}?${query}` : url);
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return { data: [], links: [] };
        }
    };

    const applyFilters = async (chartType) => {
        try {
            let url;
            const params = new URLSearchParams();

            params.append('from_date', filters.dateRange.from);
            params.append('to_date', filters.dateRange.to);

            if (chartType === 'manpowerRequests') {
                url = route('dashboard.manpower.requests.filtered');
                const response = await fetch(`${url}?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setManpowerRequestChartData({
                    labels: data.labels,
                    datasets: data.datasets
                });
            } else {
                url = route('dashboard.employee.assignments.filtered');
                if (filters.section) {
                    params.append('section_id', filters.section);
                }
                const response = await fetch(`${url}?${params.toString()}`);
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                setEmployeeAssignmentChartData({
                    labels: data.labels,
                    datasets: data.datasets,
                    subSectionIds: data.subSectionIds
                });
            }
        } catch (error) {
            console.error('Error applying filters:', error);
            if (chartType === 'manpowerRequests') {
                setManpowerRequestChartData(initialManpowerRequestChartData);
            } else {
                setEmployeeAssignmentChartData(initialEmployeeAssignmentChartData);
            }
        }
    };

    const openModal = async (url, title, columns) => {
        setModalState(prev => ({ ...prev, open: true, title, columns, url }));
        const data = await fetchModalData(url);
        setModalState(prev => ({ ...prev, data }));
    };

    const openChartModal = async (url, title, columns) => {
        setChartModalState(prev => ({ ...prev, open: true, title, columns, url }));
        const data = await fetchModalData(url);
        setChartModalState(prev => ({ ...prev, data }));
    };

    const handleManpowerRequestBarClick = (datasetIndex, labelIndex) => {
        const monthLabel = manpowerRequestChartData.labels[labelIndex];
        const status = datasetIndex === 0 ? 'pending' : 'fulfilled';
        const month = dayjs(monthLabel, 'MMM YYYY').format('YYYY-MM');

        openChartModal(
            route('dashboard.requests.byMonth', { month, status }),
            `Request Manpower - ${monthLabel} (${status === 'pending' ? 'Pending' : 'Fulfilled'})`,
            [
                {
                    header: 'Date',
                    field: 'date',
                    render: (item) => formatDate(item.date)
                },
                {
                    header: 'Sub Section',
                    field: 'sub_section',
                    render: (item) => item.sub_section?.name || 'N/A'
                },
                {
                    header: 'Shift',
                    field: 'shift',
                    render: (item) => item.shift?.name || 'N/A'
                },
                {
                    header: 'Amount',
                    field: 'requested_amount'
                }
            ]
        );
    };

    const handleEmployeeAssignmentBarClick = (labelIndex) => {
        const subSectionId = employeeAssignmentChartData.subSectionIds?.[labelIndex];
        const subSectionName = employeeAssignmentChartData.labels[labelIndex];

        const params = new URLSearchParams();
        params.append('filter_date_from', filters.dateRange.from);
        params.append('filter_date_to', filters.dateRange.to);

        openChartModal(
            `${route('dashboard.schedules.bySubSection', { subSectionId })}?${params.toString()}`,
            `Employee Assignments - ${subSectionName}`,
            [
                { header: 'Date', field: 'date', render: formatDate },
                { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                { header: 'Section', field: 'subSection', render: (item) => item.subSection?.section?.name || 'N/A' },
                { header: 'Sub Section', field: 'subSection', render: (item) => item.subSection?.name || 'N/A' },
                { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
            ]
        );
    };

    const getChartOptions = (onClick) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    boxWidth: 12,
                    padding: 20,
                    usePointStyle: true
                }
            },
            tooltip: {
                callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.raw}`,
                    title: ctx => {
                        const label = ctx[0].label;
                        if (label.includes('Week')) {
                            return label;
                        }
                        return dayjs(label).isValid()
                            ? dayjs(label).format('DD MMM YYYY')
                            : label;
                    }
                },
                animation: {
                    duration: 300
                },
                padding: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        onClick,
        responsiveAnimationDuration: 0
    });

    const cardData = [
        {
            title: 'Active Employees',
            value: summary.activeEmployeesCount,
            total: summary.totalEmployeesCount,
            color: 'indigo',
            onClick: () => openModal(
                route('dashboard.employees.active'),
                'Active Employees',
                [
                    { header: 'NIK', field: 'nik' },
                    { header: 'Name', field: 'name' },
                    { header: 'Type', field: 'type' },
                    { header: 'Status', field: 'status' }
                ]
            )
        },
        {
            title: 'Pending Requests',
            value: summary.pendingRequestsCount,
            total: summary.totalRequestsCount,
            color: 'yellow',
            onClick: () => openModal(
                route('dashboard.requests.pending'),
                'Pending Requests',
                [
                    { header: 'Date', field: 'date', render: formatDate },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                    { header: 'Amount', field: 'requested_amount' }
                ]
            )
        },
        {
            title: 'Fulfilled Requests',
            value: summary.fulfilledRequestsCount,
            total: summary.totalRequestsCount,
            color: 'green',
            onClick: () => openModal(
                route('dashboard.requests.fulfilled'),
                'Fulfilled Requests',
                [
                    { header: 'Date', field: 'date', render: formatDate },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                    { header: 'Amount', field: 'requested_amount' }
                ]
            )
        },
        {
            title: 'This Week Schedules',
            value: summary.thisWeekSchedulesCount,
            total: summary.totalSchedulesCount,
            color: 'blue',
            onClick: () => openModal(
                route('dashboard.schedules.upcoming'),
                'Upcoming Schedules',
                [
                    { header: 'Date', field: 'date', render: formatDate },
                    { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                    { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                    { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
                ]
            )
        }
    ];

    // Handle resize for each component
    const handleResize = (component) => (e) => {
        const newHeight = Math.max(200, e.target.value);
        setComponentHeights(prev => ({
            ...prev,
            [component]: newHeight
        }));
    };

    return (
        <ErrorBoundary>
            <AuthenticatedLayout
                header={<h2 className="text-xl font-semibold">Dashboard</h2>}
            >
                <Head title="Dashboard" />

                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={staggerContainer}
                    className="py-6 px-4 sm:px-6 lg:px-8"
                >
                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-2 md:grid-cols-4"
                    >
                        {cardData.map((card, index) => (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                onClick={card.onClick}
                                whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-white p-4 rounded-lg shadow cursor-pointer transition-all border-t-4 border-${card.color}-500`}
                            >
                                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                                <div className="mt-2 flex items-baseline">
                                    <span className={`text-2xl sm:text-3xl font-bold text-${card.color}-600`}>
                                        {typeof card.value === 'number' ? card.value.toLocaleString() : 'N/A'}
                                    </span>
                                    <span className="ml-2 text-xs sm:text-sm text-gray-500">
                                        / {typeof card.total === 'number' ? card.total.toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="bg-white p-4 rounded-lg shadow mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <h3 className="text-lg font-medium whitespace-nowrap">Date Range Filter</h3>
                            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                                <div className="flex items-center gap-2 min-w-[150px]">
                                    <label className="text-sm text-gray-600 whitespace-nowrap">From:</label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.from}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            dateRange: { ...prev.dateRange, from: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 text-sm w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-2 min-w-[150px]">
                                    <label className="text-sm text-gray-600 whitespace-nowrap">To:</label>
                                    <input
                                        type="date"
                                        value={filters.dateRange.to}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            dateRange: { ...prev.dateRange, to: e.target.value }
                                        }))}
                                        className="border rounded px-2 py-1 text-sm w-full"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        applyFilters('manpowerRequests');
                                        applyFilters('employeeAssignments');
                                    }}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap h-[34px]"
                                >
                                    Apply Filters
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={resetFilters}
                                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm whitespace-nowrap h-[34px]"
                                >
                                    Reset
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        {/* Manpower Request Trends - Left Chart */}
                        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Manpower Request Trends</h3>
                            </div>
                            <div 
                                className="relative" 
                                style={{ height: `${componentHeights.chart1}px` }}
                            >
                                {manpowerRequestChartData.labels.length > 0 ? (
                                    <Bar
                                        data={manpowerRequestChartData}
                                        options={getChartOptions((e, elements) => {
                                            if (elements.length) {
                                                handleManpowerRequestBarClick(elements[0].datasetIndex, elements[0].index);
                                            }
                                        })}
                                        redraw={true}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        No data available for selected date range
                                    </div>
                                )}
                            </div>
                            <div className="mt-2">
                                <label className="text-xs text-gray-500">Adjust Height:</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="800"
                                    value={componentHeights.chart1}
                                    onChange={handleResize('chart1')}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Employee Assignments - Right Chart */}
                        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                                <h3 className="text-lg font-medium whitespace-nowrap">Employee Assignments</h3>
                                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                                    <select
                                        value={filters.section || ''}
                                        onChange={(e) => {
                                            const newSection = e.target.value || null;
                                            setFilters(prev => ({
                                                ...prev,
                                                section: newSection
                                            }));
                                        }}
                                        className="border rounded px-2 py-1 text-sm min-w-[150px] h-[34px]"
                                    >
                                        <option value="">All Sections</option>
                                        {sections?.map(section => (
                                            <option key={section.id} value={section.id}>
                                                {section.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div 
                                className="relative" 
                                style={{ height: `${componentHeights.chart2}px` }}
                            >
                                {employeeAssignmentChartData.labels.length > 0 ? (
                                    <Bar
                                        data={employeeAssignmentChartData}
                                        options={getChartOptions((e, elements) => {
                                            if (elements.length) {
                                                handleEmployeeAssignmentBarClick(elements[0].index);
                                            }
                                        })}
                                        redraw={true}
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">
                                        No data available for selected filters
                                    </div>
                                )}
                            </div>
                            <div className="mt-2">
                                <label className="text-xs text-gray-500">Adjust Height:</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="800"
                                    value={componentHeights.chart2}
                                    onChange={handleResize('chart2')}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tables Row */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Recent Pending Requests - Left Table */}
                        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
                            <h3 className="text-lg font-medium mb-4">Recent Pending Requests</h3>
                            <div 
                                className="overflow-auto relative"
                                style={{ height: `${componentHeights.table1}px` }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Section</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentPendingRequests.length > 0 ? (
                                            recentPendingRequests.map((request, index) => (
                                                <motion.tr
                                                    key={request.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(request.date)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.shift?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.requested_amount}</td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                                    No pending requests
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2">
                                <label className="text-xs text-gray-500">Adjust Height:</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="800"
                                    value={componentHeights.table1}
                                    onChange={handleResize('table1')}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {/* Upcoming Schedules - Right Table */}
                        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow relative">
                            <h3 className="text-lg font-medium mb-4">Upcoming Schedules</h3>
                            <div 
                                className="overflow-auto relative"
                                style={{ height: `${componentHeights.table2}px` }}
                            >
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Section</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {upcomingSchedules.length > 0 ? (
                                            upcomingSchedules.map((schedule, index) => (
                                                <motion.tr
                                                    key={schedule.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(schedule.date)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.employee?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.man_power_request?.shift?.name || 'N/A'}</td>
                                                </motion.tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                                    No upcoming schedules
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2">
                                <label className="text-xs text-gray-500">Adjust Height:</label>
                                <input
                                    type="range"
                                    min="200"
                                    max="800"
                                    value={componentHeights.table2}
                                    onChange={handleResize('table2')}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    <DetailModal
                        isOpen={modalState.open}
                        onClose={() => setModalState(prev => ({ ...prev, open: false }))}
                        title={modalState.title}
                        data={modalState.data}
                        columns={modalState.columns}
                        formatDate={formatDateTime}
                        onFilterOrPaginate={(url, query) => {
                            return fetchModalData(url, query).then(data => {
                                setModalState(prev => ({ ...prev, data }));
                            });
                        }}
                    />

                    <DetailModal
                        isOpen={chartModalState.open}
                        onClose={() => setChartModalState(prev => ({ ...prev, open: false }))}
                        title={chartModalState.title}
                        data={chartModalState.data}
                        columns={chartModalState.columns}
                        formatDate={formatDateTime}
                        onFilterOrPaginate={(url, query) => {
                            return fetchModalData(url, query).then(data => {
                                setChartModalState(prev => ({ ...prev, data }));
                            });
                        }}
                    />
                </motion.div>
            </AuthenticatedLayout>
        </ErrorBoundary>
    );
}