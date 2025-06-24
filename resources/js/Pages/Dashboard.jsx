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
    // Safely handle null/undefined data
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
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              &times;
            </button>
          </div>
  
          {/* Modal content */}
          <div className="p-4">
            {/* Filter section */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map((col, index) => (
                col.filterable && (
                  <div key={index} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {col.header}
                    </label>
                    {/* Render appropriate filter input based on type */}
                  </div>
                )
              ))}
            </div>
  
            {/* Data table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.length > 0 ? (
                    items.map((item, itemIdx) => (
                      <tr key={itemIdx || item.id}>
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {col.render ? col.render(item, formatDate) : (item[col.field] || 'N/A')}
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
  
            {/* Pagination */}
            {isPaginated && paginationLinks.length > 0 && (
              <div className="mt-4 flex justify-center">
                <nav className="flex space-x-1">
                  {paginationLinks.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => link.url && onFilterOrPaginate(link.url)}
                      className={`px-3 py-1 rounded-md ${link.active ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      disabled={!link.url}
                    />
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default function Dashboard() {
    const { props } = usePage();
    const {
        summary = {},
        manpowerRequestChartData = { labels: [], datasets: [] },
        employeeAssignmentChartData = { labels: [], datasets: [] },
        recentPendingRequests = [],
        upcomingSchedules = []
    } = props;

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
                { header: 'Date', field: 'date', render: formatDate },
                { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                { header: 'Shift', field: 'shift', render: (item) => item.shift?.name || 'N/A' },
                { header: 'Amount', field: 'requested_amount' }
            ]
        );
    };

    const handleEmployeeAssignmentBarClick = (labelIndex) => {
        const subSectionName = employeeAssignmentChartData.labels[labelIndex];
        const subSectionId = employeeAssignmentChartData.subSectionIds?.[labelIndex];

        openChartModal(
            route('dashboard.schedules.bySubSection', { subSectionId }),
            `Employee Assignments - ${subSectionName}`,
            [
                { header: 'Date', field: 'date', render: formatDate },
                { header: 'Employee', field: 'employee', render: (item) => item.employee?.name || 'N/A' },
                { header: 'Sub Section', field: 'sub_section', render: (item) => item.sub_section?.name || 'N/A' },
                { header: 'Shift', field: 'shift', render: (item) => item.man_power_request?.shift?.name || 'N/A' }
            ]
        );
    };

    const getChartOptions = (onClick) => ({
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } }
        },
        onClick
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

    return (
        <ErrorBoundary>
            <AuthenticatedLayout
                header={<h2 className="text-xl font-semibold">Dashboard</h2>}
            >
                <Head title="Dashboard" />

                <div className="py-6 px-4 sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {cardData.map((card, index) => (
                            <div
                                key={index}
                                onClick={card.onClick}
                                className={`bg-white p-4 rounded-lg shadow cursor-pointer transition hover:shadow-md hover:translate-y-[-2px] border-t-4 border-${card.color}-500`}
                            >
                                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
                                <div className="mt-2 flex items-baseline">
                                    <span className={`text-3xl font-bold text-${card.color}-600`}>
                                        {typeof card.value === 'number' ? card.value.toLocaleString() : 'N/A'}
                                    </span>
                                    <span className="ml-2 text-sm text-gray-500">
                                        / {typeof card.total === 'number' ? card.total.toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Manpower Request Trends</h3>
                            <div className="h-64">
                                <Bar
                                    data={manpowerRequestChartData}
                                    options={getChartOptions((e, elements) => {
                                        if (elements.length) {
                                            handleManpowerRequestBarClick(elements[0].datasetIndex, elements[0].index);
                                        }
                                    })}
                                />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Employee Assignments</h3>
                            <div className="h-64">
                                <Bar
                                    data={employeeAssignmentChartData}
                                    options={getChartOptions((e, elements) => {
                                        if (elements.length) {
                                            handleEmployeeAssignmentBarClick(elements[0].index);
                                        }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Recent Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Recent Pending Requests</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Section</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {recentPendingRequests.length > 0 ? (
                                            recentPendingRequests.map((request) => (
                                                <tr key={request.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(request.date)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.shift?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{request.requested_amount}</td>
                                                </tr>
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
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow">
                            <h3 className="text-lg font-medium mb-4">Upcoming Schedules</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sub Section</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {upcomingSchedules.length > 0 ? (
                                            upcomingSchedules.map((schedule) => (
                                                <tr key={schedule.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{formatDate(schedule.date)}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.employee?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.sub_section?.name || 'N/A'}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{schedule.man_power_request?.shift?.name || 'N/A'}</td>
                                                </tr>
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
                        </div>
                    </div>
                </div>

                {/* Modals */}
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
            </AuthenticatedLayout>
        </ErrorBoundary>
    );
}