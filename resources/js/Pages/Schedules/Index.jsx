import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Impor lokal bahasa Indonesia
import localizedFormat from 'dayjs/plugin/localizedFormat'; // Plugin untuk format lokal
import isToday from 'dayjs/plugin/isToday'; // Plugin untuk mengecek apakah hari ini
import isTomorrow from 'dayjs/plugin/isTomorrow'; // Plugin untuk mengecek apakah besok
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

// Aktifkan plugin dayjs
dayjs.extend(localizedFormat);
dayjs.extend(isToday);
dayjs.extend(isTomorrow);
dayjs.locale('id'); // Set lokal ke bahasa Indonesia

// Modal Component for Shift Details (remains for its original purpose)
const ShiftDetailModal = ({ shift, onClose }) => {
  if (!shift) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Detail Shift: {shift.name}</h3>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><strong>Nama Shift:</strong> {shift.name}</p>
          <p><strong>Waktu Mulai:</strong> {shift.start_time}</p>
          <p><strong>Waktu Selesai:</strong> {shift.end_time}</p>
          <p><strong>Total Jam:</strong> {shift.hours} jam</p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// New Modal Component for Manpower Request Details
const ManPowerRequestDetailModal = ({ request, assignedEmployees, onClose }) => {
  if (!request) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return dayjs(dateString).format('dddd, DD MMMMYYYY'); // Corrected format
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Detail Man Power Request</h3>
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><strong>Tanggal Dibutuhkan:</strong> {formatDate(request.date)}</p>
          <p><strong>Sub Section:</strong> {request.sub_section?.name || 'N/A'}</p>
          <p><strong>Section:</strong> {request.sub_section?.section?.name || 'N/A'}</p>
          <p><strong>Shift:</strong> {request.shift?.name || 'N/A'}</p>
          <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
          <p><strong>Status:</strong> {request.status}</p>

          <h4 className="text-lg font-semibold mt-4 text-gray-800 dark:text-gray-200">Pegawai Ditugaskan:</h4>
          {assignedEmployees && assignedEmployees.length > 0 ? (
            <ul className="list-disc list-inside space-y-1">
              {assignedEmployees.map((empItem, index) => (
                // --- CRITICAL FIX: Access properties directly from empItem ---
                <li key={index} className="text-gray-700 dark:text-gray-300">
                  {empItem.name} (NIK: {empItem.nik})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 italic">Belum ada pegawai yang ditugaskan untuk request ini.</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};


const ScheduleSection = ({ title, schedulesBySubSection, openManPowerRequestModal }) => (
  <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex-1 min-w-80">
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
    {Object.keys(schedulesBySubSection).length === 0 ? (
      <p className="text-gray-600 dark:text-gray-400 italic">Tidak ada penjadwalan di bagian ini.</p>
    ) : (
      Object.entries(schedulesBySubSection).map(([subSectionName, employeesWithDetails]) => (
        <div key={subSectionName} className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-blue-700 dark:text-blue-400">{subSectionName}</h3>
            {/* Button to open Manpower Request Details Modal */}
            {employeesWithDetails[0]?.man_power_request && (
              <button
                // Pass both the man_power_request object AND the array of assigned employees
                onClick={() => openManPowerRequestModal(
                    employeesWithDetails[0].man_power_request,
                    employeesWithDetails.map(item => item.employee) // Extract just the employee objects
                )}
                className="ml-2 p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-150 flex-shrink-0"
                title={`Lihat detail Request untuk ${subSectionName}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    Nama Pegawai
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    NIK
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    Tipe
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    Sub-Section
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {employeesWithDetails.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.employee.name || 'Nama Pegawai Tidak Diketahui'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.nik || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.employee.status || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.sub_section?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {item.sub_section?.section?.name || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))
    )}
  </div>
);

const Index = () => {
  const { schedules } = usePage().props;
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [currentShiftDetails, setCurrentShiftDetails] = useState(null);
  const [showManPowerRequestModal, setShowManPowerRequestModal] = useState(false);
  const [currentManPowerRequestDetails, setCurrentManPowerRequestDetails] = useState(null);
  const [assignedEmployeesForModal, setAssignedEmployeesForModal] = useState([]); // New state for assigned employees

  // Function to open the Shift modal with shift details
  const openShiftModal = (shiftDetails) => {
    setCurrentShiftDetails(shiftDetails);
    setShowShiftModal(true);
  };

  // Function to close the Shift modal
  const closeShiftModal = () => {
    setShowShiftModal(false);
    setCurrentShiftDetails(null);
  };

  // Function to open the Manpower Request modal with request details AND assigned employees
  const openManPowerRequestModal = (requestDetails, employees) => {
    setCurrentManPowerRequestDetails(requestDetails);
    setAssignedEmployeesForModal(employees); // Set the assigned employees
    setShowManPowerRequestModal(true);
  };

  // Function to close the Manpower Request modal
  const closeManPowerRequestModal = () => {
    setShowManPowerRequestModal(false);
    setCurrentManPowerRequestDetails(null);
    setAssignedEmployeesForModal([]); // Clear assigned employees on close
  };

  // Kelompokkan jadwal berdasarkan date, then shift, then sub-section
  const groupedSchedulesByDateShiftSubSection = schedules.reduce((acc, schedule) => {
    // Ensure all necessary relationships are loaded
    if (!schedule.employee || !schedule.sub_section || !schedule.man_power_request?.shift || !schedule.man_power_request?.sub_section?.section) {
      console.warn('Schedule missing employee, sub_section, man_power_request.shift, or man_power_request.sub_section.section data:', schedule);
      return acc;
    }

    const dateKey = dayjs(schedule.date).format('YYYY-MM-DD'); // Consistent date key for grouping
    const displayDate = dayjs(schedule.date).format('dddd, DD MMMMYYYY'); // Corrected format for full year
    const shiftObj = schedule.man_power_request.shift; // Get the full shift object
    const shiftName = shiftObj.name; // Access shift name from man_power_request

    const subSectionName = schedule.sub_section.name || 'Lain-lain';

    if (!acc[dateKey]) {
      acc[dateKey] = {
        displayDate: displayDate,
        shifts: {}
      };
    }

    if (!acc[dateKey].shifts[shiftName]) {
      acc[dateKey].shifts[shiftName] = {
        details: shiftObj, // Store the full shift object here
        subSections: {} // Nested sub-sections
      };
    }

    if (!acc[dateKey].shifts[shiftName].subSections[subSectionName]) {
      acc[dateKey].shifts[shiftName].subSections[subSectionName] = []; // Initialize array for this sub-section
    }

    // Push an object containing employee, sub_section, AND man_power_request details
    acc[dateKey].shifts[shiftName].subSections[subSectionName].push({
      employee: schedule.employee,
      sub_section: schedule.sub_section, // This will contain section if eager loaded
      man_power_request: schedule.man_power_request // Store the full man_power_request object
    });

    return acc;
  }, {});

  // Sort dates (e.g., today, tomorrow, then future dates)
  const sortedDates = Object.keys(groupedSchedulesByDateShiftSubSection).sort((a, b) => {
    return dayjs(a).valueOf() - dayjs(b).valueOf(); // Ascending date order
  });

  // Define a custom order for shifts
  const shiftOrder = { 'Pagi': 1, 'Siang': 2, 'Malam': 3 };

  return (
    <AuthenticatedLayout
    header={
      <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
        Agenda Penjadwalan
      </h2>
    }
  >
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">Agenda Penjadwalan</h1>

      {Object.keys(groupedSchedulesByDateShiftSubSection).length === 0 ? (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200 rounded-md" role="alert">
          <p className="font-bold">Informasi:</p>
          <p>Belum ada penjadwalan untuk hari ini atau besok di shift manapun.</p>
        </div>
      ) : (
        // Iterate through sorted dates
        sortedDates.map(dateKey => {
          const dateData = groupedSchedulesByDateShiftSubSection[dateKey];
          const shiftsForDate = dateData.shifts;

          // Sort shifts for the current date
          const sortedShiftsForDate = Object.keys(shiftsForDate).sort((a, b) => {
            return (shiftOrder[a] || 99) - (shiftOrder[b] || 99);
          });

          return (
            <React.Fragment key={dateKey}>
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm">
                  {dateData.displayDate}
                </h2>
                {/* Wrap shifts in a flex container for horizontal display */}
                <div className="flex flex-col md:flex-row md:space-x-4 overflow-x-auto pb-4">
                  {sortedShiftsForDate.map(shiftName => (
                    <div key={`${dateKey}-${shiftName}`} className="flex-1 min-w-80">
                      <div className="flex justify-between items-center mb-4">
                        {/* ScheduleSection now only renders the sub-sections and employees */}
                        <ScheduleSection
                          title={`Shift ${shiftName}`}
                          schedulesBySubSection={shiftsForDate[shiftName].subSections}
                          openManPowerRequestModal={openManPowerRequestModal} // Pass the new modal opener
                        />
                        {/* Original button for Shift Details - kept for completeness if needed */}
                        {/* <button
                          onClick={() => openShiftModal(shiftsForDate[shiftName].details)}
                          className="ml-2 p-2 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-150 flex-shrink-0"
                          title={`Lihat detail Shift ${shiftName}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </button> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <hr className="my-10 border-t-2 border-gray-200 dark:border-gray-700" />
            </React.Fragment>
          );
        })
      )}
    </div>

    {/* Shift Detail Modal */}
    <ShiftDetailModal
      shift={currentShiftDetails}
      onClose={closeShiftModal}
    />

    {/* New Manpower Request Detail Modal */}
    <ManPowerRequestDetailModal
      request={currentManPowerRequestDetails}
      assignedEmployees={assignedEmployeesForModal} // Pass the assigned employees
      onClose={closeManPowerRequestModal}
    />
    </AuthenticatedLayout>
  );
};

export default Index;
