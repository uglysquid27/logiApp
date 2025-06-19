import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import moment from 'moment'; // Pastikan Anda telah menginstal moment.js (npm install moment)

export default function AdminIndex({ auth, permits, filters }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        admin_notes: '', // Menambahkan field admin_notes
    });

    const [showRespondModal, setShowRespondModal] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState(null);

    // Fungsi untuk mengubah filter status
    const handleFilterChange = (newStatus) => {
        window.location.href = route('admin.permits.index', { status: newStatus });
    };

    // Fungsi untuk membuka modal respons
    const openRespondModal = (permit) => {
        setSelectedPermit(permit);
        // Set initial status and admin_notes based on current permit status
        setData({
            status: permit.status === 'approved' ? 'approved' : (permit.status === 'rejected' ? 'rejected' : (permit.status === 'cancelled' ? 'cancelled' : 'pending')),
            admin_notes: permit.admin_notes || '', // Mengisi admin_notes dari data permit yang ada
        });
        setShowRespondModal(true);
    };

    // Fungsi untuk menutup modal respons
    const closeRespondModal = () => {
        setShowRespondModal(false);
        setSelectedPermit(null);
        reset(); // Reset form data
    };

    // Fungsi untuk submit respons
    const submitResponse = (e) => {
        e.preventDefault();
        if (selectedPermit) {
            console.log("Data being sent:", data); // Log data to be sent
            post(route('admin.permits.respond', selectedPermit.id), {
                onSuccess: () => {
                    closeRespondModal();
                    // Optional: show a success message
                },
                onError: (validationErrors) => {
                    console.error('Validation Errors:', validationErrors);
                    // Errors will be set to the useForm.errors object
                }
            });
        }
    };

    // Helper function to get status classes based on database enum values
    const getStatusClasses = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
            case 'approved': // Changed from 'accepted' to 'approved'
                return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
            case 'cancelled': // Added 'cancelled' status
                return 'bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Admin Permit Management</h2>}
        >
            <Head title="Admin Permits" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <h3 className="text-lg font-medium mb-4">Permintaan Izin Karyawan</h3>

                            {/* Filter Buttons */}
                            <div className="mb-4 flex space-x-2">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filters.status === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Semua
                                </button>
                                <button
                                    onClick={() => handleFilterChange('pending')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filters.status === 'pending' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => handleFilterChange('approved')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filters.status === 'approved' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Diterima
                                </button>
                                <button
                                    onClick={() => handleFilterChange('rejected')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filters.status === 'rejected' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Ditolak
                                </button>
                                <button
                                    onClick={() => handleFilterChange('cancelled')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium ${filters.status === 'cancelled' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                >
                                    Dibatalkan
                                </button>
                            </div>

                            {permits.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-lg overflow-hidden">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Karyawan (NIK)
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Jenis Izin
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Tanggal Mulai
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Tanggal Selesai
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Alasan
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Catatan Admin
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {permits.data.map((permit) => (
                                                <tr key={permit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {permit.employee ? `${permit.employee.name} (${permit.employee.nik})` : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {permit.permit_type || 'Tidak Tersedia'} {/* Changed from permit.type */}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {moment(permit.start_date).format('DD-MM-YYYY')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {permit.end_date ? moment(permit.end_date).format('DD-MM-YYYY') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                        {permit.reason || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(permit.status)}`}>
                                                            {permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-xs overflow-hidden text-ellipsis"> {/* Added max-w-xs for potential long notes */}
                                                        {permit.admin_notes || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openRespondModal(permit)}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-2"
                                                        >
                                                            Respon
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-700 dark:text-gray-300">Tidak ada permintaan izin ditemukan.</p>
                            )}

                            {/* Pagination */}
                            <div className="mt-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        <Link
                                            href={permits.links.prev}
                                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                        >
                                            Previous
                                        </Link>
                                        <Link
                                            href={permits.links.next}
                                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                                        >
                                            Next
                                        </Link>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Menampilkan
                                                <span className="font-medium mx-1">{permits.from}</span>
                                                ke
                                                <span className="font-medium mx-1">{permits.to}</span>
                                                dari
                                                <span className="font-medium mx-1">{permits.total}</span>
                                                hasil
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                {permits.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || '#'}
                                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                                                            link.active
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                                                        } ${index === 0 ? 'rounded-l-md' : ''} ${index === permits.links.length - 1 ? 'rounded-r-md' : ''}`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Respond Permit Modal */}
            {showRespondModal && selectedPermit && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-8 bg-white dark:bg-gray-800 w-full max-w-md mx-auto rounded-lg shadow-lg">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Respon Permintaan Izin</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Karyawan: {selectedPermit.employee ? selectedPermit.employee.name : 'N/A'}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">Jenis Izin: {selectedPermit.permit_type || 'Tidak Tersedia'}</p> {/* Changed from selectedPermit.type */}

                        <form onSubmit={submitResponse}>
                            <div className="mb-4">
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="">Pilih Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Terima</option> {/* Changed from 'accepted' to 'approved' */}
                                    <option value="rejected">Tolak</option>
                                    <option value="cancelled">Dibatalkan</option> {/* Added cancelled option */}
                                </select>
                                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                            </div>

                            {/* Admin Notes Field */}
                            <div className="mb-4">
                                <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Catatan Admin
                                </label>
                                <textarea
                                    id="admin_notes"
                                    name="admin_notes"
                                    rows="3"
                                    value={data.admin_notes}
                                    onChange={(e) => setData('admin_notes', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Masukkan catatan untuk admin..."
                                ></textarea>
                                {errors.admin_notes && <p className="text-red-500 text-xs mt-1">{errors.admin_notes}</p>}
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={closeRespondModal}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {processing ? 'Memproses...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
