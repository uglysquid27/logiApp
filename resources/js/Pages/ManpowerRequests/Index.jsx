import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState, useMemo } from 'react';
import SectionGroup from './Components/ManpowerRequests/SectionGroup';

export default function Index({ sections, auth }) {
  const { delete: destroy } = useForm({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // {section, date, requests}
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal pagination
  const [modalPage, setModalPage] = useState(1);
  const modalItemsPerPage = 6;

  const user = auth?.user || null;

  const statusClasses = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    fulfilled: 'bg-indigo-100 text-indigo-700',
    revision_requested: 'bg-purple-100 text-purple-700',
  };
  const getStatusClasses = (status) =>
    statusClasses[status?.toLowerCase()] || 'bg-blue-100 text-blue-700';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return String(dateString);
    }
  };

  // 🔹 Group by section + date
  const sectionDateGroups = useMemo(() => {
    if (!sections?.data) return [];
    const groups = [];

    sections.data.forEach((section) => {
      const dateMap = {};
      (section.sub_sections || []).forEach((sub) => {
        (sub.man_power_requests || []).forEach((req) => {
          const dateKey = new Date(req.date).toISOString().slice(0, 10);
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = [];
          }
          dateMap[dateKey].push({ ...req, sub_section: { id: sub.id, name: sub.name } });
        });
      });

      Object.keys(dateMap).forEach((dateKey) => {
        const reqs = dateMap[dateKey];
        groups.push({
          sectionId: section.id,
          sectionName: section.name,
          date: dateKey,
          requests: reqs,
          totalRequests: reqs.length,
          totalWorkers: reqs.reduce((sum, r) => sum + (r.requested_amount || 0), 0),
          statuses: [...new Set(reqs.map((r) => r.status))],
        });
      });
    });

    return groups;
  }, [sections]);

  // 🔹 Sorting
  const sortedGroups = useMemo(() => {
    const items = [...sectionDateGroups];
    if (sortConfig.key === 'name') {
      items.sort((a, b) =>
        sortConfig.direction === 'asc'
          ? a.sectionName.localeCompare(b.sectionName)
          : b.sectionName.localeCompare(a.sectionName)
      );
    } else if (sortConfig.key === 'date') {
      items.sort((a, b) => {
        const ad = new Date(a.date).getTime();
        const bd = new Date(b.date).getTime();
        return sortConfig.direction === 'asc' ? ad - bd : bd - ad;
      });
    } else if (sortConfig.key === 'total') {
      items.sort((a, b) =>
        sortConfig.direction === 'asc'
          ? a.totalRequests - b.totalRequests
          : b.totalRequests - a.totalRequests
      );
    }
    return items;
  }, [sectionDateGroups, sortConfig]);

  // 🔹 Pagination table utama
  const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);
  const paginatedGroups = sortedGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestDelete = (id) => {
    setRequestToDelete(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => {
    if (!requestToDelete) return;
    destroy(route('manpower-requests.destroy', requestToDelete), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Request deleted');
        setShowDeleteModal(false);
        setRequestToDelete(null);
      },
      onError: () => {
        toast.error('Failed to delete');
        setShowDeleteModal(false);
        setRequestToDelete(null);
      },
    });
  };

  const openDetails = (group) => {
    setSelectedGroup(group);
    setModalPage(1); // reset modal pagination
    setShowDetailsModal(true);
  };

  const toggleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const getShiftLabel = (req) => {
    if (req?.shift && (req.shift.name || typeof req.shift === 'string')) {
      return req.shift.name || String(req.shift);
    }
    if (req?.shift_id) return `Shift ${req.shift_id}`;
    if (typeof req?.shift === 'number') return `Shift ${req.shift}`;
    return 'N/A';
  };

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

              {paginatedGroups.length === 0 ? (
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
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => toggleSort('name')}
                        >
                          <div className="flex items-center">
                            Section
                            {sortConfig.key === 'name' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => toggleSort('date')}
                        >
                          <div className="flex items-center">
                            Date
                            {sortConfig.key === 'date' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Statuses
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => toggleSort('total')}
                        >
                          <div className="flex items-center">
                            Total Requests
                            {sortConfig.key === 'total' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Workers
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedGroups.map((group, idx) => (
                        <tr 
                          key={`${group.sectionId}-${group.date}-${idx}`} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {group.sectionName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(group.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {group.statuses.map(status => (
                                <span 
                                  key={status} 
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(status)}`}
                                >
                                  {status.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {group.totalRequests}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {group.totalWorkers}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => openDetails(group)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-end flex-wrap gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm transition-all ${
                        page === currentPage
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full sm:p-6">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      {selectedGroup.sectionName} Requests - {formatDate(selectedGroup.date)}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="bg-white dark:bg-gray-700 rounded-md text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4">
                  <SectionGroup
                    section={{ name: selectedGroup.sectionName }}
                    requests={selectedGroup.requests}
                    formatDate={formatDate}
                    getStatusClasses={getStatusClasses}
                    onDelete={requestDelete}
                    onRevision={() => {}}
                    isUser={!!user}
                    initialOpen
                  />
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
