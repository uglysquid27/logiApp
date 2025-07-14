import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Index({ requests, auth }) {
  const { post, delete: destroy } = useForm({});

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

  // Handle revision request
  const handleRequestRevision = (requestId) => {
    if (!confirm('Request revision for this manpower request?')) return;

    console.log('Initiating revision for request:', requestId);

    post(route('manpower-requests.request-revision', requestId), {
      preserveScroll: true,
      onSuccess: () => {
        console.log('Revision initiated for request:', requestId);
        window.location.href = route('manpower-requests.revision.edit', requestId);
      },
      onError: (errors) => {
        console.error('Revision failed:', errors);
        toast.error('Failed to request revision');
      }
    });
  };

  // Handle delete request
  const handleDeleteRequest = (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
  
    console.log('Attempting to delete request ID:', requestId); // Debug log
    
    destroy(route('manpower-requests.destroy', requestId), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Request deleted successfully');
      },
      onError: (errors) => {
        console.error('Delete error:', errors);
        toast.error(errors.message || 'Failed to delete request');
        
        // Additional debug logging
        if (errors.response) {
          console.log('Response data:', errors.response.data);
          console.log('Response status:', errors.response.status);
        }
      }
    });
  };

  // Data preparation
  const manpowerRequests = requests?.data || [];
  const paginationLinks = requests?.links || [];

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

              {/* Mobile View */}
              <div className="sm:hidden space-y-4">
                {manpowerRequests.length === 0 ? (
                  <EmptyState />
                ) : (
                  manpowerRequests.map((req) => (
                    <MobileRequestCard 
                      key={req.id}
                      request={req}
                      onDelete={handleDeleteRequest}
                      onRevision={handleRequestRevision}
                      getStatusClasses={getStatusClasses}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden sm:block overflow-x-auto">
                <DesktopRequestTable 
                  requests={manpowerRequests}
                  onDelete={handleDeleteRequest}
                  onRevision={handleRequestRevision}
                  getStatusClasses={getStatusClasses}
                  formatDate={formatDate}
                  isEmpty={manpowerRequests.length === 0}
                />
              </div>

              {/* Pagination */}
              {paginationLinks.length > 3 && (
                <Pagination links={paginationLinks} />
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// Sub-components for better organization
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

function MobileRequestCard({ request, onDelete, onRevision, getStatusClasses, formatDate }) {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-600">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(request.status)}`}>
            {request.status.replace('_', ' ')}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(request.date)}
        </div>
      </div>

      <div className="mb-2">
        <div className="font-medium text-gray-700 dark:text-gray-300">
          {request.sub_section?.name || 'N/A'}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {request.shift?.name || 'N/A'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <div className="text-gray-500 dark:text-gray-400">Total</div>
          <div>{request.requested_amount}</div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Male</div>
          <div>{request.male_count}</div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">Female</div>
          <div>{request.female_count}</div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        {request.status === 'pending' && (
          <>
            <Link
              href={route('manpower-requests.edit', request.id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium px-2 py-1"
            >
              Edit
            </Link>
            <Link
              href={route('manpower-requests.fulfill', request.id)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 text-sm font-medium px-2 py-1"
            >
              Fulfill
            </Link>
            <button
              onClick={() => onDelete(request.id)}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium px-2 py-1"
            >
              Cancel
            </button>
          </>
        )}
        {request.status === 'fulfilled' && (
          <>
            <span className="text-green-600 dark:text-green-400 text-sm italic flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Fulfilled
            </span>
            <button
              onClick={() => onRevision(request.id)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 text-sm font-medium px-2 py-1"
            >
              Revise
            </button>
            <button
              onClick={() => onDelete(request.id)}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium px-2 py-1"
            >
              Cancel
            </button>
          </>
        )}
        {request.status === 'revision_requested' && (
          <>
            <Link
              href={route('manpower-requests.revision.edit', request.id)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium px-2 py-1"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(request.id)}
              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 text-sm font-medium px-2 py-1"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DesktopRequestTable({ requests, onDelete, onRevision, getStatusClasses, formatDate, isEmpty }) {
  return (
    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sub Section</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shift</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Male</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Female</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">By</th>
        </tr>
      </thead>
      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {isEmpty ? (
          <tr>
            <td colSpan="9" className="px-6 py-12 text-center">
              <EmptyState />
            </td>
          </tr>
        ) : (
          requests.map((req) => (
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
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusClasses(req.status)}`}>
                  {req.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
                {req.status === 'pending' && (
                  <PendingActions requestId={req.id} onDelete={onDelete} />
                )}
                {req.status === 'fulfilled' && (
                  <FulfilledActions requestId={req.id} onDelete={onDelete} onRevision={onRevision} />
                )}
                {req.status === 'revision_requested' && (
                  <RevisionActions requestId={req.id} onDelete={onDelete} />
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-center">
                {req.fulfilled_by?.name || '-'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function PendingActions({ requestId, onDelete }) {
  return (
    <div className="flex justify-end items-center space-x-3">
      <Link
        href={route('manpower-requests.edit', requestId)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold"
      >
        Edit
      </Link>
      <Link
        href={route('manpower-requests.fulfill', requestId)}
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 font-semibold"
      >
        Fulfill
      </Link>
      <button
        onClick={() => onDelete(requestId)}
        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-semibold"
      >
        Cancel
      </button>
    </div>
  );
}

function FulfilledActions({ requestId, onDelete, onRevision }) {
  return (
    <div className="flex justify-end items-center space-x-3">
      <span className="text-green-600 dark:text-green-400 italic inline-flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Fulfilled
      </span>
      <button
        onClick={() => onRevision(requestId)}
        className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold"
      >
        Revise
      </button>
      <button
        onClick={() => onDelete(requestId)}
        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-semibold"
      >
        Cancel
      </button>
    </div>
  );
}

function RevisionActions({ requestId, onDelete }) {
  return (
    <div className="flex justify-end items-center space-x-3">
      <Link
        href={route('manpower-requests.revision.edit', requestId)}
        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-semibold"
      >
        Edit
      </Link>
      <button
        onClick={() => onDelete(requestId)}
        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-semibold"
      >
        Cancel
      </button>
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
  );
}