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
import dayjs from 'dayjs'; // Import dayjs for date formatting

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
    // Destructure all necessary props
    const {
        summary,
        manpowerRequestChartData,
        employeeAssignmentChartData,
        recentPendingRequests, // New prop
        upcomingSchedules,     // New prop
    } = usePage().props;

    // Helper for date formatting
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('DD MMMM YYYY'); // e.g., 02 Juni 2025
    };

    // Options for Manpower Request Status Trends Chart
    const manpowerRequestChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#6b7280' // Tailwind gray-500 for legend labels
                }
            },
            title: {
                display: true,
                text: 'Tren Status Manpower Request (6 Bulan Terakhir)',
                color: '#1f2937' // Tailwind gray-900 for chart title
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#4b5563' // Tailwind gray-600 for x-axis ticks
                },
                grid: {
                    color: '#e5e7eb' // Tailwind gray-200 for x-axis grid lines
                }
            },
            y: {
                ticks: {
                    color: '#4b5563', // Tailwind gray-600 for y-axis ticks
                    beginAtZero: true
                },
                grid: {
                    color: '#e5e7eb' // Tailwind gray-200 for y-axis grid lines
                }
            }
        }
    };

    // Options for Employee Assignment Distribution Chart
    const employeeAssignmentChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#6b7280' // Tailwind gray-500 for legend labels
                }
            },
            title: {
                display: true,
                text: 'Distribusi Penugasan Karyawan per Sub-Bagian',
                color: '#1f2937' // Tailwind gray-900 for chart title
            },
        },
        scales: {
            x: {
                ticks: {
                    color: '#4b5563' // Tailwind gray-600 for x-axis ticks
                },
                grid: {
                    color: '#e5e7eb' // Tailwind gray-200 for x-axis grid lines
                }
            },
            y: {
                ticks: {
                    color: '#4b5563', // Tailwind gray-600 for y-axis ticks
                    beginAtZero: true
                },
                grid: {
                    color: '#e5e7eb' // Tailwind gray-200 for y-axis grid lines
                }
            }
        }
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
                        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center transition duration-300 ease-in-out hover:shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Pegawai Aktif</h3>
                            <p className="text-5xl font-extrabold text-indigo-600">
                                {summary.activeEmployeesCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalEmployeesCount} Total</p>
                        </div>

                        {/* Pending Manpower Requests Card */}
                        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center transition duration-300 ease-in-out hover:shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Request Pending</h3>
                            <p className="text-5xl font-extrabold text-yellow-600">
                                {summary.pendingRequestsCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalRequestsCount} Total</p>
                        </div>

                        {/* Fulfilled Manpower Requests Card */}
                        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center transition duration-300 ease-in-out hover:shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Request Terpenuhi</h3>
                            <p className="text-5xl font-extrabold text-green-600">
                                {summary.fulfilledRequestsCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalRequestsCount} Total</p>
                        </div>

                        {/* Schedules This Week Card */}
                        <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center transition duration-300 ease-in-out hover:shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Penjadwalan Minggu Ini</h3>
                            <p className="text-5xl font-extrabold text-blue-600">
                                {summary.thisWeekSchedulesCount}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">dari {summary.totalSchedulesCount} Total</p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"> {/* Added mb-8 for spacing */}
                        {/* Manpower Request Status Trends Chart */}
                        <div className="bg-white shadow-lg rounded-lg p-6 h-96">
                            <Bar data={manpowerRequestChartData} options={manpowerRequestChartOptions} />
                        </div>

                        {/* Employee Assignment Distribution Chart */}
                        <div className="bg-white shadow-lg rounded-lg p-6 h-96">
                            <Bar data={employeeAssignmentChartData} options={employeeAssignmentChartOptions} />
                        </div>
                    </div>

                    {/* New Sections Below Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Recent Pending Manpower Requests Table */}
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

                        {/* Upcoming Schedules Table */}
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
        </AuthenticatedLayout>
    );
}
