import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Index({ requests }) {
  const { post } = useForm({});

  const getStatusClasses = (status) => {
    switch (status.toLowerCase()) {
      case 'fulfilled':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'revision_requested':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  const manpowerRequests = requests?.data || [];
  const paginationLinks = requests?.links || [];

  const handleRequestRevision = (requestId) => {
    if (!confirm('Apakah Anda yakin ingin meminta revisi untuk permintaan ini? Ini akan membatalkan jadwal yang sudah ada dan mengubah statusnya menjadi "revision requested".')) {
      return;
    }

    post(route('manpower-requests.request-revision', requestId), {
      onSuccess: () => {
        window.location.href = route('manpower-requests.revision.edit', requestId);
      },
      onError: (errors) => {
        console.error('Error initiating revision:', errors);
        alert('Gagal mengirim permintaan revisi. Silakan coba lagi.');
      }
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4 sm:mb-0">
                  Daftar Request Man Power
                </h1>
                <Link
                  href="/manpower-requests/create" 
                  className="inline-flex items-center bg-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 -ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path>
                  </svg>
                  Request Man Power
                </Link>
              </div>

              {/* Mobile Cards View */}
              <div className="sm:hidden space-y-4">
                {manpowerRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Belum ada request man power.
                      </p>
                      <Link
                        href="/manpower-requests/create" 
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                      >
                        Buat request pertama Anda
                      </Link>
                    </div>
                  </div>
                ) : (
                  manpowerRequests.map((req) => (
                    <div key={req.id} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(req.status)}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(req.date)}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="font-medium text-gray-700 dark:text-gray-300">{req.sub_section?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{req.shift?.name || 'N/A'}</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Jumlah</div>
                          <div>{req.requested_amount}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Male</div>
                          <div>{req.male_count}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 dark:text-gray-400">Female</div>
                          <div>{req.female_count}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        {req.status === 'pending' && (
                          <>
                            <Link
                              href={`/manpower-requests/${req.id}/edit`} 
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium px-2 py-1"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/manpower-requests/${req.id}/fulfill`} 
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium px-2 py-1"
                            >
                              Penuhi
                            </Link>
                          </>
                        )}
                        {req.status === 'fulfilled' && (
                          <>
                            <span className="text-green-600 dark:text-green-400 text-sm italic flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                              </svg>
                              Dipenuhi
                            </span>
                            {/* <button
                              onClick={() => handleRequestRevision(req.id)}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm font-medium px-2 py-1"
                            >
                              Revisi
                            </button> */}
                          </>
                        )}
                        {req.status === 'revision_requested' && (
                          <>
                            {/* <span className="text-purple-600 dark:text-purple-400 text-sm italic flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-7.586 7.586A.5.5 0 018 14.586v-1.586h-1.586a.5.5 0 01-.354-.854l7.586-7.586zM9.5 16h-5a2 2 0 01-2-2v-5c0-.552.448-1 1-1h1c.552 0 1 .448 1 1v1h1c.552 0 1 .448 1 1v1h1c.552 0 1 .448 1 1v1c0 1.104-.896 2-2 2z" clipRule="evenodd" fillRule="evenodd"></path>
                              </svg>
                              Revisi
                            </span> */}
                            <Link
                              href={route('manpower-requests.revision.edit', req.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium px-2 py-1"
                            >
                              Edit
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sub Section
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Shift
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Jumlah
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Male
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Female
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aksi
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Oleh
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {manpowerRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                              Belum ada request man power.
                            </p>
                            <Link
                              href="/manpower-requests/create" 
                              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                            >
                              Buat request pertama Anda
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      manpowerRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(req.date)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {req.sub_section?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {req.shift?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {req.requested_amount}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {req.male_count}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {req.female_count}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClasses(req.status)}`}
                            >
                              {req.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
                            {req.status === 'pending' ? (
                              <div className="flex justify-end items-center space-x-3">
                                <Link
                                  href={`/manpower-requests/${req.id}/edit`} 
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold"
                                >
                                  Edit
                                </Link>
                                <Link
                                  href={`/manpower-requests/${req.id}/fulfill`} 
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold"
                                >
                                  Penuhi
                                </Link>
                              </div>
                            ) : req.status === 'fulfilled' ? (
                              <div className="flex justify-end items-center space-x-3">
                                <span className="text-green-600 dark:text-green-400 italic inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                  Dipenuhi
                                </span>
                                {/* <button
                                  onClick={() => handleRequestRevision(req.id)}
                                  className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold"
                                >
                                  Revisi
                                </button> */}
                              </div>
                            ) : req.status === 'revision_requested' ? (
                              <div className="flex justify-end items-center space-x-3">
                                {/* <span className="text-purple-600 dark:text-purple-400 italic inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M13.586 3.586a2 2 0 112.828 2.828l-7.586 7.586A.5.5 0 018 14.586v-1.586h-1.586a.5.5 0 01-.354-.854l7.586-7.586zM9.5 16h-5a2 2 0 01-2-2v-5c0-.552.448-1 1-1h1c.552 0 1 .448 1 1v1h1c.552 0 1 .448 1 1v1h1c.552 0 1 .448 1 1v1c0 1.104-.896 2-2 2z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                  Revisi
                                </span> */}
                                <Link
                                  href={route('manpower-requests.revision.edit', req.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold"
                                >
                                  Edit
                                </Link>
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                            {req.fulfilled_by?.name || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Links */}
              {paginationLinks.length > 3 && (
                <div className="mt-6 flex justify-end flex-wrap gap-2">
                  {paginationLinks.map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        link.active
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      } ${!link.url && 'pointer-events-none opacity-50'}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      preserveScroll
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}