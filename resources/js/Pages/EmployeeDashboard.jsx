import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, useForm } from '@inertiajs/react';
import dayjs from 'dayjs'; // Import dayjs for date formatting
import 'dayjs/locale/id'; // Import Indonesian locale

dayjs.locale('id'); // Set dayjs locale to Indonesian

export default function EmployeeDashboard() {
    // Destructure auth and mySchedules from usePage().props
    const { data, setData, post, processing } = useForm({ status: '', rejection_reason: '' });

    const respond = (scheduleId) => {
        post(route('employee.schedule.respond', scheduleId), {
            preserveScroll: true,
            onSuccess: () => setData('rejection_reason', ''),
        });
    };

    const { auth, mySchedules } = usePage().props;
    console.log(auth)
    console.log(mySchedules)
    console.log(usePage().props);

    // Helper function to format dates for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return dayjs(dateString).format('dddd, DD MMMM YYYY'); // Example: Senin, 10 Juni 2025
    };

    return (
        <AuthenticatedLayout
            user={auth.user} // Pass the authenticated employee data to the layout
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Employee Dashboard</h2>}
        >
            <Head title="Employee Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <h3 className="text-2xl font-bold mb-4">
                                Selamat Datang, {auth.user.name || 'Pegawai'}!
                            </h3>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                                NIK Anda: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{auth.user.nik}</span>
                            </p>

                            <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Penjadwalan Anda
                            </h4>

                            {mySchedules && mySchedules.length > 0 ? (
                                <div className="overflow-x-auto shadow-md rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Tanggal
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Shift
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Waktu
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Sub Bagian
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Section
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Aksi
                                                </th>

                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {mySchedules.map((schedule) => (
                                                <tr key={schedule.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {formatDate(schedule.date)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {schedule.man_power_request?.shift?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {schedule.man_power_request?.start_time || 'N/A'} - {schedule.man_power_request?.end_time || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {schedule.sub_section?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {schedule.sub_section?.section?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        {schedule.status === 'accepted' ? (
                                                            <span className="px-2 py-1 rounded text-xs font-semibold bg-green-200 text-green-800">
                                                                Diterima
                                                            </span>
                                                        ) : schedule.status === 'rejected' ? (
                                                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-200 text-red-800">
                                                                Ditolak
                                                            </span>
                                                        ) : (
                                                            // Belum direspon, maka tampilkan tombol aksi
                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setData({ status: 'accepted', rejection_reason: '' });
                                                                        respond(schedule.id);
                                                                    }}
                                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                                                    disabled={processing}
                                                                >
                                                                    Saya menerima
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        const reason = prompt('Masukkan alasan kenapa tidak bisa hadir:');
                                                                        if (!reason || reason.trim() === '') {
                                                                            return alert('Alasan tidak boleh kosong!');
                                                                        }

                                                                        setData({ status: 'rejected', rejection_reason: reason });
                                                                        respond(schedule.id);
                                                                    }}
                                                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                                                    disabled={processing}
                                                                >
                                                                    Saya tidak bisa
                                                                </button>
                                                            </div>
                                                        )}

                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-400 italic">
                                    Anda belum memiliki penjadwalan yang ditugaskan.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
