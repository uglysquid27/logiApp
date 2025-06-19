import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useState } from 'react'; // Impor useState untuk mengelola state modal

dayjs.locale('id');

export default function PermitIndex({ auth, permits, authenticatedEmployee }) {
    const isEmployeeLoggedIn = !!authenticatedEmployee;

    // State untuk mengontrol visibilitas modal foto
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    // State untuk menyimpan URL foto yang akan ditampilkan di modal
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    // Fungsi untuk membuka modal dan mengatur URL foto
    const openPhotoModal = (photoUrl) => {
        setCurrentPhotoUrl(photoUrl);
        setShowPhotoModal(true);
    };

    // Fungsi untuk menutup modal
    const closePhotoModal = () => {
        setShowPhotoModal(false);
        setCurrentPhotoUrl('');
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    {isEmployeeLoggedIn ? 'Izin Saya' : 'Daftar Izin'}
                </h2>
            }
        >
            <Head title={isEmployeeLoggedIn ? 'Izin Saya' : 'Daftar Izin'} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">
                                    {isEmployeeLoggedIn ? 'Daftar Pengajuan Izin Saya' : 'Daftar Pengajuan Izin Karyawan'}
                                </h3>
                                {/* Tombol untuk menambahkan izin baru */}
                                <Link
                                    // PERBAIKAN: Menggunakan nama route yang benar dengan 'employee.' prefix
                                    href={route('employee.permits.create')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Ajukan Izin Baru
                                </Link>
                            </div>

                            {permits.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    ID
                                                </th>
                                                {/* Kolom Karyawan hanya tampil jika bukan karyawan yang login */}
                                                {!isEmployeeLoggedIn && (
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Karyawan
                                                    </th>
                                                )}
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tipe Izin
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mulai
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Selesai
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Alasan
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                {/* Kolom Foto hanya tampil jika ada foto atau bukan karyawan yang login */}
                                                {(permits.data.some(p => p.photo) || !isEmployeeLoggedIn) && (
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Foto
                                                    </th>
                                                )}
                                                 <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Catatan Admin
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {permits.data.map((permit) => (
                                                <tr key={permit.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.id}
                                                    </td>
                                                    {!isEmployeeLoggedIn && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {permit.employee ? `${permit.employee.name} (${permit.employee.nik})` : 'N/A'}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.permit_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {dayjs(permit.start_date).format('DD MMMYYYY')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.end_date ? dayjs(permit.end_date).format('DD MMMYYYY') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.reason}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                            ${permit.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                                            ${permit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                            ${permit.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                                            ${permit.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                                                        `}>
                                                            {permit.status}
                                                        </span>
                                                    </td>
                                                    {/* Kolom foto: tampilkan thumbnail atau link jika ada foto */}
                                                    {(permits.data.some(p => p.photo) || !isEmployeeLoggedIn) && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {permit.photo ? (
                                                                <button
                                                                    onClick={() => openPhotoModal(`/storage/${permit.photo}`)}
                                                                    className="text-blue-600 hover:text-blue-900 underline focus:outline-none"
                                                                >
                                                                    Lihat Foto
                                                                </button>
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {permit.admin_notes ? (
                                                                <span>
                                                                    {permit.admin_notes}
                                                                </span>
                                                            ) : (
                                                                '-'
                                                            )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600">Belum ada pengajuan izin.</p>
                            )}

                            {/* Pagination Links */}
                            <div className="mt-4 flex justify-center">
                                {permits.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 mx-1 rounded-md text-sm
                                            ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                                            ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Pop-up untuk Foto */}
            {showPhotoModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
                    onClick={closePhotoModal} // Tutup modal saat mengklik di luar gambar
                >
                    <div
                        className="relative bg-white rounded-lg shadow-xl overflow-hidden max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
                    >
                        <button
                            onClick={closePhotoModal}
                            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-700 rounded-full p-2 text-lg font-bold"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                        <img
                            src={currentPhotoUrl}
                            alt="Foto Izin"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/400x300/CCCCCC/000000?text=Gambar+Tidak+Ditemukan"; // Fallback image
                            }}
                        />
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
