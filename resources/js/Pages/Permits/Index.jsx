import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { useState } from 'react';

dayjs.locale('id');

export default function PermitIndex({ auth, permits, authenticatedEmployee }) {
    const isEmployeeLoggedIn = !!authenticatedEmployee;
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');

    const openPhotoModal = (photoUrl) => {
        setCurrentPhotoUrl(photoUrl);
        setShowPhotoModal(true);
    };

    const closePhotoModal = () => {
        setShowPhotoModal(false);
        setCurrentPhotoUrl('');
    };

    const formatDateForMobile = (date) => {
        return dayjs(date).format('DD/MM');
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

            <div className="py-4 sm:py-8 lg:py-12">
                <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-4 sm:p-6 text-gray-900">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <h3 className="text-lg font-bold">
                                    {isEmployeeLoggedIn ? 'Daftar Pengajuan Izin Saya' : 'Daftar Pengajuan Izin Karyawan'}
                                </h3>
                                <Link
                                    href={route('employee.permits.create')}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center text-sm sm:text-base"
                                >
                                    Ajukan Izin Baru
                                </Link>
                            </div>

            {permits.data.length > 0 ? (
                <div className="overflow-x-auto">
                    {/* Mobile Cards View */}
                    <div className="sm:hidden space-y-3">
                        {permits.data.map((permit) => (
                            <div key={permit.id} className="border rounded-lg p-3 shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-sm">ID: {permit.id}</p>
                                        {!isEmployeeLoggedIn && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {permit.employee ? `${permit.employee.name} (${permit.employee.nik})` : 'N/A'}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full
                                        ${permit.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                        ${permit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${permit.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                        ${permit.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                                    `}>
                                        {permit.status}
                                    </span>
                                </div>

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Tipe</p>
                                        <p className="text-sm">{permit.permit_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Tanggal</p>
                                        <p className="text-sm">
                                            {formatDateForMobile(permit.start_date)}
                                            {permit.end_date && ` - ${formatDateForMobile(permit.end_date)}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">Alasan</p>
                                    <p className="text-sm line-clamp-2">{permit.reason}</p>
                                </div>

                                <div className="mt-2 flex justify-between items-center">
                                    {permit.photo && (
                                        <button
                                            onClick={() => openPhotoModal(`/storage/${permit.photo}`)}
                                            className="text-blue-600 text-xs flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Lihat Foto
                                        </button>
                                    )}
                                    {permit.admin_notes && (
                                        <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                            Catatan: {permit.admin_notes}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <table className="hidden sm:table min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                {!isEmployeeLoggedIn && (
                                    <th scope="col" className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Karyawan
                                    </th>
                                )}
                                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipe Izin
                                </th>
                                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal
                                </th>
                                <th scope="col" className="hidden md:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Alasan
                                </th>
                                <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {(permits.data.some(p => p.photo) || !isEmployeeLoggedIn) && (
                                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Foto
                                    </th>
                                )}
                                <th scope="col" className="hidden lg:table-cell px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Catatan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {permits.data.map((permit) => (
                                <tr key={permit.id}>
                                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        {permit.id}
                                    </td>
                                    {!isEmployeeLoggedIn && (
                                        <td className="hidden sm:table-cell px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {permit.employee ? `${permit.employee.name} (${permit.employee.nik})` : 'N/A'}
                                        </td>
                                    )}
                                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        {permit.permit_type}
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        <div className="flex flex-col">
                                            <span>{dayjs(permit.start_date).format('DD MMM')}</span>
                                            {permit.end_date && (
                                                <span className="text-xs text-gray-500">
                                                    s/d {dayjs(permit.end_date).format('DD MMM')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        <div className="max-w-xs truncate">{permit.reason}</div>
                                    </td>
                                    <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${permit.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                                            ${permit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${permit.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                                            ${permit.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                                        `}>
                                            {permit.status}
                                        </span>
                                    </td>
                                    {(permits.data.some(p => p.photo) || !isEmployeeLoggedIn) && (
                                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                            {permit.photo ? (
                                                <button
                                                    onClick={() => openPhotoModal(`/storage/${permit.photo}`)}
                                                    className="text-blue-600 hover:text-blue-900 underline focus:outline-none flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Lihat</span>
                                                </button>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    )}
                                    <td className="hidden lg:table-cell px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                        <div className="max-w-xs truncate">{permit.admin_notes || '-'}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-600 text-center py-4">Belum ada pengajuan izin.</p>
            )}

            {/* Pagination Links */}
            <div className="mt-4 flex flex-wrap justify-center">
                {permits.links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url || '#'}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-2 py-1 mx-0.5 sm:px-3 sm:py-1 sm:mx-1 rounded-md text-xs sm:text-sm
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
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-50"
                    onClick={closePhotoModal}
                >
                    <div
                        className="relative bg-white rounded-lg shadow-xl overflow-hidden max-w-full max-h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closePhotoModal}
                            className="absolute top-1 right-1 sm:top-2 sm:right-2 text-white bg-red-600 hover:bg-red-700 rounded-full p-1 sm:p-2 text-sm sm:text-lg font-bold"
                            aria-label="Tutup"
                        >
                            &times;
                        </button>
                        <img
                            src={currentPhotoUrl}
                            alt="Foto Izin"
                            className="max-w-full max-h-[80vh] sm:max-h-[90vh] object-contain rounded-lg"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/400x300/CCCCCC/000000?text=Gambar+Tidak+Ditemukan";
                            }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 text-sm">
                            Geser untuk memperbesar
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}