import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import SectionSelection from './components/SectionSelection';
import RequestForm from './components/RequestForm';
import SubSectionModal from './components/SubSectionModal';

export default function Create({ sections, shifts }) {
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSubSectionModal, setShowSubSectionModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);
  const [globalDate, setGlobalDate] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [selectedSubSections, setSelectedSubSections] = useState([]);

  const { data, setData, post, processing, errors } = useForm({
    requests: []
  });

  const today = new Date().toISOString().split('T')[0];

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setSelectedSubSections([]); // Reset selected subsections when changing section
    setShowSubSectionModal(true);
  };

  const handleSubSectionSelect = (subSections) => {
    const initialTimeSlots = {};
    shifts.forEach(shift => {
      initialTimeSlots[shift.id] = {
        requested_amount: '',
        male_count: 0,
        female_count: 0,
        start_time: shift.start_time || '',
        end_time: shift.end_time || '',
        reason: '',
        is_additional: false,
      };
    });

    const newRequests = subSections.map(subSection => ({
      sub_section_id: subSection.id,
      sub_section_name: subSection.name,
      section_name: selectedSection.name,
      date: globalDate,
      time_slots: JSON.parse(JSON.stringify(initialTimeSlots)) // Deep copy
    }));

    setRequests([...requests, ...newRequests]);
    setActiveRequestIndex(requests.length > 0 ? requests.length : 0);
    setShowSubSectionModal(false);
    setSelectedSubSections([]);
  };

  const handleGlobalDateChange = (newDate) => {
    setGlobalDate(newDate);
    const updatedRequests = requests.map(request => ({
      ...request,
      date: newDate
    }));
    setRequests(updatedRequests);
  };

  const handleRequestChange = (index, field, value) => {
    const updatedRequests = [...requests];
    updatedRequests[index][field] = value;
    setRequests(updatedRequests);
  };

  const handleSlotChange = (index, shiftId, field, value) => {
    const updatedRequests = [...requests];
    updatedRequests[index].time_slots[shiftId][field] = value;
    setRequests(updatedRequests);
  };

  const removeRequest = (index) => {
    const updatedRequests = [...requests];
    updatedRequests.splice(index, 1);
    setRequests(updatedRequests);
    if (activeRequestIndex >= index) {
      setActiveRequestIndex(Math.max(0, activeRequestIndex - 1));
    }
  };

  const handleShowSummary = () => {
    const hasValidRequests = requests.some(request => 
      Object.values(request.time_slots).some(slot => 
        slot.requested_amount && parseInt(slot.requested_amount) > 0
      )
    );

    if (!hasValidRequests) {
      alert('At least one request must have requested amount > 0');
      return;
    }

    if (!globalDate) {
      alert('Please select a date for all requests');
      return;
    }

    setShowSummary(true);
  };

  const submitAllRequests = (e) => {
    if (e) e.preventDefault();
    
    const formattedRequests = requests.map(request => ({
      sub_section_id: request.sub_section_id,
      date: globalDate,
      time_slots: Object.entries(request.time_slots)
        .filter(([_, slot]) => slot.requested_amount && parseInt(slot.requested_amount) > 0)
        .reduce((acc, [shiftId, slot]) => ({
          ...acc,
          [shiftId]: {
            requested_amount: parseInt(slot.requested_amount),
            male_count: parseInt(slot.male_count) || 0,
            female_count: parseInt(slot.female_count) || 0,
            start_time: slot.start_time,
            end_time: slot.end_time,
            reason: slot.reason || '',
            is_additional: slot.is_additional || false
          }
        }), {})
    })).filter(request => Object.keys(request.time_slots).length > 0);

    if (formattedRequests.length === 0) {
      alert('At least one request must have requested amount > 0');
      return;
    }

    setData('requests', formattedRequests);
    post('/manpower-requests');
  };

  const RequestSummary = () => {
    const formatTimeForDisplay = (timeString) => {
      if (!timeString) return '-';
      if (timeString.includes(':') && timeString.split(':').length === 3) {
        return timeString.substring(0, 5);
      }
      return timeString;
    };

    const getShiftName = (shiftId) => {
      const shift = shifts.find(s => s.id == shiftId);
      return shift ? shift.name : `Shift ${shiftId}`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const calculateTotals = () => {
      let totalEmployees = 0;
      let totalMale = 0;
      let totalFemale = 0;
      let totalSections = requests.length;
      let totalShifts = 0;

      requests.forEach(request => {
        Object.values(request.time_slots).forEach(slot => {
          if (slot.requested_amount && parseInt(slot.requested_amount) > 0) {
            totalEmployees += parseInt(slot.requested_amount);
            totalMale += parseInt(slot.male_count) || 0;
            totalFemale += parseInt(slot.female_count) || 0;
            totalShifts += 1;
          }
        });
      });

      return { totalEmployees, totalMale, totalFemale, totalSections, totalShifts };
    };

    const totals = calculateTotals();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Request Summary
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review your manpower requests before submission
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Date:</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(globalDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totals.totalSections}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Sections
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totals.totalShifts}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
              Shifts
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totals.totalEmployees}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              Total Staff
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {totals.totalMale}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
              Male
            </div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {totals.totalFemale}
            </div>
            <div className="text-xs text-pink-600 dark:text-pink-400 uppercase tracking-wide">
              Female
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Request Details</h4>
          
          {requests.map((request, requestIndex) => {
            const activeSlots = Object.entries(request.time_slots).filter(
              ([_, slot]) => slot.requested_amount && parseInt(slot.requested_amount) > 0
            );

            if (activeSlots.length === 0) return null;

            return (
              <div key={requestIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {request.section_name} - {request.sub_section_name}
                  </h5>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {activeSlots.length} shift{activeSlots.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {activeSlots.map(([shiftId, slot]) => (
                    <div key={shiftId} className="bg-white dark:bg-gray-700 rounded-md p-3">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {getShiftName(shiftId)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Staff: </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {slot.requested_amount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Male: </span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {slot.male_count || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Female: </span>
                          <span className="font-medium text-pink-600 dark:text-pink-400">
                            {slot.female_count || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Start: </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatTimeForDisplay(slot.start_time)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">End: </span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatTimeForDisplay(slot.end_time)}
                          </span>
                        </div>
                      </div>
                      
                      {slot.reason && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Reason: </span>
                          <span className="text-xs text-gray-800 dark:text-gray-200">
                            {slot.reason}
                          </span>
                        </div>
                      )}
                      
                      {slot.is_additional && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            Additional Request
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setShowSummary(false)}
            disabled={processing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Edit
          </button>
          
          <button
            type="button"
            onClick={submitAllRequests}
            disabled={processing}
            className={`inline-flex items-center px-6 py-2 bg-indigo-600 dark:bg-indigo-700 text-white text-sm font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              processing ? 'opacity-75' : ''
            }`}
          >
            {processing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit All Requests
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (showSummary) {
    return (
      <AuthenticatedLayout
        header={
          <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
            Review Man Power Requests
          </h2>
        }
      >
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
              <div className="p-6 text-gray-900 dark:text-gray-100">
                <RequestSummary />
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900 dark:text-gray-100">
              {!selectedSection ? (
                <SectionSelection 
                  sections={sections} 
                  onSelect={handleSectionSelect} 
                />
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                      Select Date for All Requests
                    </h3>
                    <input
                      type="date"
                      value={globalDate}
                      onChange={(e) => handleGlobalDateChange(e.target.value)}
                      min={today}
                      className="block w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                      required
                    />
                    {globalDate && (
                      <p className="mt-2 text-sm text-blue-600 dark:text-blue-300">
                        This date will be applied to all sub-sections you add.
                      </p>
                    )}
                    {errors.date && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.date}</p>}
                  </div>

                  <div className="flex overflow-x-auto pb-2">
                    {requests.map((request, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveRequestIndex(index)}
                        className={`flex items-center px-4 py-2 mr-2 text-sm font-medium rounded-t-md whitespace-nowrap ${
                          activeRequestIndex === index 
                            ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {request.section_name} - {request.sub_section_name}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeRequest(index); }}
                          className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          &times;
                        </button>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowSubSectionModal(true)}
                      // disabled={!globalDate}
                      className={`flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-md whitespace-nowrap `}
                    >
                      + Add Sub Section
                    </button>
                  </div>

                  {requests.length > 0 && globalDate && (
                    <>
                      <RequestForm
                        request={requests[activeRequestIndex]}
                        shifts={shifts}
                        errors={errors.requests?.[activeRequestIndex] || {}}
                        onChange={(field, value) => handleRequestChange(activeRequestIndex, field, value)}
                        onSlotChange={(shiftId, field, value) => handleSlotChange(activeRequestIndex, shiftId, field, value)}
                        globalDate={globalDate}
                        hideDate={true}
                      />
                      <div className="flex justify-end pt-4 space-x-3">
                        <button
                          type="button"
                          onClick={handleShowSummary}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white text-sm font-medium rounded-md hover:bg-gray-700 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Review Summary
                        </button>
                      </div>
                    </>
                  )}

                  {requests.length > 0 && !globalDate && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                      <p className="text-yellow-800 dark:text-yellow-200">
                        Please select a date above before configuring your requests.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SubSectionModal
        isOpen={showSubSectionModal}
        onClose={() => setShowSubSectionModal(false)}
        section={selectedSection}
        onSelect={handleSubSectionSelect}
        selectedSubSections={requests.map(r => r.sub_section_id)}
      />
    </AuthenticatedLayout>
  );
}