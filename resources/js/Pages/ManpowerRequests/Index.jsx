import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react';
import SectionGroup from './components/ManpowerRequests/SectionGroup';

export default function Index({ requests, auth, sections }) {
  const { post, delete: destroy } = useForm({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const user = auth && auth.user ? auth.user : null;

  // Status styling configuration
  const statusClasses = {
    fulfilled: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    revision_requested: 'bg-purple-100 text-purple-700',
  };

  const getStatusClasses = (status) =>
    statusClasses[status?.toLowerCase()] || 'bg-blue-100 text-blue-700';

  // Format date with error handling
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Handle delete request
  const handleDeleteRequest = (requestId) => {
    setRequestToDelete(requestId);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!requestToDelete) return;

    destroy(route('manpower-requests.destroy', requestToDelete), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Request deleted successfully');
        setShowDeleteModal(false);
        setRequestToDelete(null);
      },
      onError: (errors) => {
        console.error('Delete error:', errors);
        toast.error(errors.message || 'Failed to delete request');
        setShowDeleteModal(false);
        setRequestToDelete(null);
      }
    });
  };

  // Group requests by section
  const requestsBySection = sections.map(section => ({
    ...section,
    requests: (requests?.data || []).filter(req => 
      req.sub_section?.section_id === section.id
    )
  })).filter(section => section.requests.length > 0);

  const isUser = user && user.role === 'user';

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Manpower Requests</h2>}
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg sm:rounded-lg">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4 sm:mb-0">
                  Manpower Requests
                </h1>
                <Link
                  href={route('manpower-requests.create')}
                  className="inline-flex items-center bg-indigo-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Request
                </Link>
              </div>

              {requestsBySection.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-6">
                  {requestsBySection.map(section => (
                    <SectionGroup
                      key={section.id}
                      section={section}
                      requests={section.requests}
                      formatDate={formatDate}
                      getStatusClasses={getStatusClasses}
                      onDelete={handleDeleteRequest}
                      onRevision={() => {}}
                      isUser={isUser}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {requests?.links?.length > 3 && (
                <Pagination links={requests.links} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Delete Request
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this request? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse justify-center sm:justify-start">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:text-sm"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-600 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          No manpower requests found.
        </p>
        <Link
          href={route('manpower-requests.create')}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
        >
          Create your first request
        </Link>
      </div>
    </div>
  );
}

function Pagination({ links }) {
  return (
    <div className="mt-6 flex justify-end flex-wrap gap-2">
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.url || '#'}
          className={`px-3 py-1 rounded-md text-sm transition-all ${link.active
            ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            } ${!link.url && 'pointer-events-none opacity-50'}`}
          dangerouslySetInnerHTML={{ __html: link.label }}
          preserveScroll
        />
      ))}
    </div>
  );
}