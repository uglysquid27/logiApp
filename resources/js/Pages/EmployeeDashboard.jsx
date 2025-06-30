import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import React from 'react';

dayjs.locale('id');

export default function EmployeeDashboard() {
    const { auth, mySchedules } = usePage().props;

    // State for rejection modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [currentScheduleId, setCurrentScheduleId] = useState(null);
    const [rejectionReasonInput, setRejectionReasonInput] = useState('');

    // State for custom alert
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error');

    // State for coworkers data
    const [coworkersData, setCoworkersData] = useState(null);
    const [loadingCoworkers, setLoadingCoworkers] = useState(false);

    // Auto-hide alert after 5 seconds
    useEffect(() => {
        if (showAlert) {
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [showAlert]);

    // Function to display a custom alert message
    const showCustomAlert = (message, type = 'error') => {
        setAlertMessage(message);
        setAlertType(type);
        setShowAlert(true);
    };

    // Function to fetch coworkers data
    const fetchSameShiftEmployees = async (scheduleId) => {
        if (coworkersData?.current_schedule?.id === scheduleId) {
            setCoworkersData(null);
            return;
        }

        setLoadingCoworkers(true);
        try {
            const response = await fetch(route('employee.schedule.same-shift', scheduleId));
            const data = await response.json();
            setCoworkersData(data);
        } catch (error) {
            console.error('Failed to fetch coworkers:', error);
            showCustomAlert('Gagal memuat rekan kerja. Silakan coba lagi.', 'error');
        } finally {
            setLoadingCoworkers(false);
        }
    };

    // Function to open the rejection modal
    const openRejectModal = (scheduleId) => {
        setCurrentScheduleId(scheduleId);
        setRejectionReasonInput('');
        setShowRejectModal(true);
    };

    // Function to close the rejection modal
    const closeRejectModal = () => {
        setShowRejectModal(false);
        setCurrentScheduleId(null);
        setRejectionReasonInput('');
    };

    // Function to handle schedule response (Accept/Reject)
    const respond = (scheduleId, status, reason = '') => {
        if (status === 'rejected' && (!reason || reason.trim() === '')) {
            showCustomAlert('Alasan tidak boleh kosong untuk penolakan!', 'error');
            return;
        }

        router.post(
            route('employee.schedule.respond', scheduleId),
            {
                status: status,
                rejection_reason: reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showCustomAlert('Status berhasil diperbarui.', 'success');
                    router.reload({ preserveScroll: true });
                    closeRejectModal();
                },
                onError: (errors) => {
                    let errorMessage = 'Gagal merespon jadwal. Silakan coba lagi.';
                    if (errors && Object.keys(errors).length > 0) {
                        errorMessage += '\nDetail: ' + Object.values(errors).join('\n');
                    }
                    showCustomAlert(errorMessage, 'error');
                },
            }
        );
    };

    // Helper function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('dddd, DD MMMM YYYY');
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

            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto py-6">
                    {/* Custom Alert Display */}
                    {showAlert && (
                        <div className={`mb-4 px-4 py-3 rounded-lg shadow-md text-sm
                            ${alertType === 'success'
                                ? 'bg-green-100 border border-green-400 text-green-700 dark:bg-green-800 dark:border-green-600 dark:text-green-200'
                                : 'bg-red-100 border border-red-400 text-red-700 dark:bg-red-800 dark:border-red-600 dark:text-red-200'}`}>
                            {alertMessage}
                            <button
                                onClick={() => setShowAlert(false)}
                                className="ml-4 float-right font-bold"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {/* Welcome Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-2xl rounded-2xl p-6 sm:p-8 mb-8 text-gray-900 dark:text-white transform hover:scale-[1.01] transition-all duration-300 ease-in-out">
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 tracking-wide">
                            Selamat Datang, {employeeName}!
                        </h3>
                        <p className="text-base sm:text-lg md:text-xl font-light opacity-90">
                            NIK Anda: <span className="font-semibold tracking-wider">{employeeNik}</span>
                        </p>
                    </div>

                    {/* Schedule Section */}
                    <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 sm:p-8">
                        <h4 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                            Penjadwalan Anda
                        </h4>

                        {mySchedules && mySchedules.length > 0 ? (
                            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Tanggal
                                            </th>
                                            <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Shift
                                            </th>
                                            <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Waktu
                                            </th>
                                            <th scope="col" className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Sub Bagian
                                            </th>
                                            <th scope="col" className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Section
                                            </th>
                                            <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="hidden lg:table-cell px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                                Alasan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {mySchedules.map((schedule) => (
                                            <React.Fragment key={schedule.id}>
                                                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-100">
                                                        {formatDate(schedule.date)}
                                                    </td>
                                                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                                                        {schedule.man_power_request?.shift?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                                                        {schedule.man_power_request?.start_time?.substring(0, 5) || 'N/A'} - {schedule.man_power_request?.end_time?.substring(0, 5) || 'N/A'}
                                                    </td>
                                                    <td className="hidden sm:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                                                        {schedule.sub_section?.name || 'N/A'}
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                                                        {schedule.sub_section?.section?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                                                        {schedule.status === 'accepted' ? (
                                                            <div className="flex flex-col gap-1 sm:gap-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                                    Diterima
                                                                </span>
                                                                <button
                                                                    onClick={() => fetchSameShiftEmployees(schedule.id)}
                                                                    className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                                >
                                                                    {loadingCoworkers && coworkersData?.current_schedule?.id === schedule.id ? (
                                                                        'Memuat...'
                                                                    ) : (
                                                                        'Lihat Rekan Kerja'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : schedule.status === 'rejected' ? (
                                                            <div className="flex flex-col gap-1 sm:gap-2">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                                                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                                    Ditolak
                                                                </span>
                                                                <button
                                                                    onClick={() => fetchSameShiftEmployees(schedule.id)}
                                                                    className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                                >
                                                                    {loadingCoworkers && coworkersData?.current_schedule?.id === schedule.id ? (
                                                                        'Memuat...'
                                                                    ) : (
                                                                        'Lihat Rekan Kerja'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 sm:gap-2">
                                                                <button
                                                                    onClick={() => respond(schedule.id, 'accepted')}
                                                                    className="flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                                    Terima
                                                                </button>

                                                                <button
                                                                    onClick={() => openRejectModal(schedule.id)}
                                                                    className="flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                                >
                                                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                                                    Tolak
                                                                </button>

                                                                <button
                                                                    onClick={() => fetchSameShiftEmployees(schedule.id)}
                                                                    className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                                                                >
                                                                    {loadingCoworkers && coworkersData?.current_schedule?.id === schedule.id ? (
                                                                        'Memuat...'
                                                                    ) : (
                                                                        'Lihat Rekan Kerja'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="hidden lg:table-cell px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                                                        {schedule.status === 'rejected' ? (
                                                            <p className="text-xs text-red-300 italic">"{schedule.rejection_reason || 'Tidak ada alasan'}"</p>
                                                        ) : schedule.status === 'accepted' ? (
                                                            <span className="inline-block text-xs sm:text-sm text-gray-500 italic">Tidak ada alasan</span>
                                                        ) : (
                                                            <span className="inline-block text-xs sm:text-sm text-gray-500 italic">Menunggu Respon</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Coworkers Row */}
                                                {coworkersData?.current_schedule?.id === schedule.id && (
                                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                                        <td colSpan="7" className="px-3 py-4 sm:px-6 sm:py-4">
                                                            <div className="space-y-3">
                                                                <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200">
                                                                    Rekan Kerja di Shift yang Sama:
                                                                </h3>
                                                                {coworkersData.coworkers.length > 0 ? (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {coworkersData.coworkers.map((coworker) => (
                                                                            <div key={coworker.id} className={`p-3 rounded-lg border-l-4 ${coworker.status === 'accepted' ? 'border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700' :
                                                                                    coworker.status === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-700' :
                                                                                        'border-yellow-500 bg-yellow-50 dark:bg-yellow-900 dark:border-yellow-700'
                                                                                }`}>
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                                                        <span className="text-indigo-600 dark:text-indigo-300 font-medium">
                                                                                            {coworker.employee.name.charAt(0)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-medium text-gray-800 dark:text-gray-100">{coworker.employee.name}</p>
                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">NIK: {coworker.employee.nik}</p>
                                                                                        <p className={`text-xs ${coworker.status === 'accepted' ? 'text-green-600 dark:text-green-400' :
                                                                                                coworker.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                                                                                                    'text-yellow-600 dark:text-yellow-400'
                                                                                            }`}>
                                                                                            Status: {coworker.status === 'accepted' ? 'Diterima' : coworker.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                                                                        </p>
                                                                                        {coworker.status === 'rejected' && coworker.rejection_reason && (
                                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                                Alasan: "{coworker.rejection_reason}"
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada rekan kerja yang ditemukan untuk shift ini</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
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

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto transform transition-all duration-300 scale-100 opacity-100">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Tolak Penjadwalan
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-6 text-xs sm:text-sm">
                            Mohon masukkan alasan mengapa Anda tidak dapat menghadiri penjadwalan ini. Alasan yang jelas akan membantu proses selanjutnya.
                        </p>
                        <div className="mb-6">
                            <label htmlFor="rejection-reason" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="rejection-reason"
                                rows="4"
                                className="block w-full px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 resize-y text-xs sm:text-sm"
                                placeholder="Misalnya: Saya sedang sakit, ada keperluan mendesak, dll."
                                value={rejectionReasonInput}
                                onChange={(e) => setRejectionReasonInput(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex justify-end gap-2 sm:gap-3">
                            <button
                                onClick={closeRejectModal}
                                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => respond(currentScheduleId, 'rejected', rejectionReasonInput)}
                                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                            >
                                Kirim
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}