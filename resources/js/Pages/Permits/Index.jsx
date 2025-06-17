import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs'; // Untuk memformat tanggal
import 'dayjs/locale/id'; // Opsional: Untuk lokalisasi tanggal jika diperlukan

// Set dayjs locale to Indonesian (optional, but good for consistency)
dayjs.locale('id');

export default function PermitIndex({ auth, permits }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Daftar Izin</h2>}
        >
            <Head title="Daftar Izin" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Daftar Pengajuan Izin Karyawan</h3>
                                {/* Tombol untuk menambahkan izin baru */}
                                <Link
                                    href={route('permits.create')} // Anda perlu mendefinisikan route ini nanti
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
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Karyawan
                                                </th>
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
                                                <th scope="col" className="relative px-6 py-3">
                                                    <span className="sr-only">Aksi</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {permits.data.map((permit) => (
                                                <tr key={permit.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.id}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.employee ? `${permit.employee.name} (${permit.employee.nik})` : 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.permit_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {dayjs(permit.start_date).format('DD MMM YYYY')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {permit.end_date ? dayjs(permit.end_date).format('DD MMM YYYY') : '-'}
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link
                                                            href={route('permits.show', permit.id)} // Anda perlu mendefinisikan route ini nanti
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        >
                                                            Lihat
                                                        </Link>
                                                        <Link
                                                            href={route('permits.edit', permit.id)} // Anda perlu mendefinisikan route ini nanti
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </Link>
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
                                        href={link.url || '#'} // Fallback to '#' if URL is null (for current page)
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
        </AuthenticatedLayout>
    );
}
