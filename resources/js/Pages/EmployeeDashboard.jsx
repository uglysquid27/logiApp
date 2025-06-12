import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { router } from '@inertiajs/react';

dayjs.locale('id'); // Set dayjs locale to Indonesian

export default function EmployeeDashboard() {
    const { auth, mySchedules } = usePage().props;

    // Function to handle schedule response (Accept/Reject)
    const respond = (scheduleId, status, reason = '') => {
        router.post(
            route('employee.schedule.respond', scheduleId),
            {
                status: status,
                rejection_reason: reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    console.log('Response berhasil!');
                    router.reload({ preserveScroll: true });
                },
                onError: (errors) => {
                    console.error('Terjadi kesalahan saat merespon jadwal:', errors);
                    alert('Gagal merespon jadwal. Silakan coba lagi. Cek konsol untuk detail.');
                },
            }
        );
    };

    // Helper function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('dddd, DD MMMM YYYY'); // Example: Senin, 10 Juni 2025
    };

    const employeeName = auth?.user?.name || 'Pegawai';
    const employeeNik = auth?.user?.nik || 'N/A';

    return (
        <AuthenticatedLayout
            user={auth?.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                    Employee Dashboard
                </h2>
            }
        >
            <Head title="Employee Dashboard" />

            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8"> {/* Default light, dark: for dark */}
                <div className="max-w-7xl mx-auto py-6">
                    {/* Welcome Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl rounded-2xl p-6 sm:p-8 mb-8 text-gray-900 dark:text-white transform hover:scale-[1.01] transition-all duration-300 ease-in-out">
                        <h3 className="text-3xl sm:text-4xl font-extrabold mb-2 tracking-wide">
                            Selamat Datang, {employeeName}!
                        </h3>
                        <p className="text-lg sm:text-xl font-light opacity-90">
                            NIK Anda: <span className="font-semibold tracking-wider">{employeeNik}</span>
                        </p>
                    </div>

                    {/* Schedule Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
                        <h4 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                            Penjadwalan Anda
                        </h4>

                        {mySchedules && mySchedules.length > 0 ? (
                            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Shift
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Waktu
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Sub Bagian
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Section
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-4 py-3 sm:px-6 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Alasan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {mySchedules.map((schedule) => (
                                            <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                                <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-700 dark:text-gray-100">
                                                    {formatDate(schedule.date)}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                                    {schedule.man_power_request?.shift?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                                    {schedule.man_power_request?.start_time?.substring(0, 5) || 'N/A'} - {schedule.man_power_request?.end_time?.substring(0, 5) || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                                    {schedule.sub_section?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                                                    {schedule.sub_section?.section?.name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-sm">
                                                    {schedule.status === 'accepted' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                            Diterima
                                                        </span>
                                                    ) : schedule.status === 'rejected' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                                                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                            Ditolak
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                onClick={() => respond(schedule.id, 'accepted')}
                                                                className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                                Terima
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    const reason = prompt('Masukkan alasan kenapa tidak bisa hadir:');
                                                                    if (!reason || reason.trim() === '') {
                                                                        return alert('Alasan tidak boleh kosong!');
                                                                    }
                                                                    respond(schedule.id, 'rejected', reason);
                                                                }}
                                                                className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                                Tolak
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 sm:px-6 text-sm">
                                                    {schedule.status === 'accepted' ? (
                                                      <p className="text-xs text-red-300 italic">"{schedule.rejection_reason || 'Tidak ada alasan'}"</p>
                                                    ) : schedule.status === 'rejected' ? (
                                                        <p className="text-xs text-red-300 italic">"{schedule.rejection_reason || 'Tidak ada alasan'}"</p>

                                                    ) : (
                                                        <span className="inline-block text-sm text-gray-500 italic">Menunggu Respon</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center text-gray-600 dark:text-gray-300 italic shadow-inner">
                                <p>Anda belum memiliki penjadwalan yang ditugaskan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Custom Scrollbar Styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #e5e7eb; /* light mode: gray-200 */
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-track {
                    background: #374151; /* dark mode: gray-700 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #93c5fd; /* light mode: blue-300 */
                    border-radius: 10px;
                    border: 2px solid #e5e7eb; /* light mode: gray-200 */
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #6366f1; /* dark mode: indigo-500 */
                    border-color: #374151; /* dark mode: gray-700 */
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #60a5fa; /* light mode: blue-400 */
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #4f46e5; /* dark mode: indigo-600 */
                }
            `}</style>
        </AuthenticatedLayout>
    );
}