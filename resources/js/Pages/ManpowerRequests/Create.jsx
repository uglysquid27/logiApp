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

  const { data, setData, post, processing, errors } = useForm({
    requests: []
  });

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setShowSubSectionModal(true);
  };

  const handleSubSectionSelect = (subSection) => {
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

    const newRequest = {
      sub_section_id: subSection.id,
      sub_section_name: subSection.name,
      section_name: selectedSection.name,
      date: '',
      time_slots: initialTimeSlots
    };

    setRequests([...requests, newRequest]);
    setActiveRequestIndex(requests.length);
    setShowSubSectionModal(false);
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

  const submitAllRequests = (e) => {
    e.preventDefault();
    
    const formattedRequests = requests.map(request => ({
      sub_section_id: request.sub_section_id,
      date: request.date,
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

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 text-gray-900">
              {!selectedSection ? (
                <SectionSelection 
                  sections={sections} 
                  onSelect={handleSectionSelect} 
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex overflow-x-auto pb-2">
                    {requests.map((request, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveRequestIndex(index)}
                        className={`flex items-center px-4 py-2 mr-2 text-sm font-medium rounded-t-md ${
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
                      className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-md"
                    >
                      + Tambah Sub Section
                    </button>
                  </div>

                  {requests.length > 0 && (
                    <>
                      <RequestForm
                        request={requests[activeRequestIndex]}
                        shifts={shifts}
                        errors={errors.requests?.[activeRequestIndex] || {}}
                        onChange={(field, value) => handleRequestChange(activeRequestIndex, field, value)}
                        onSlotChange={(shiftId, field, value) => handleSlotChange(activeRequestIndex, shiftId, field, value)}
                      />
                      <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={submitAllRequests}
                          disabled={processing}
                          className={`inline-flex items-center px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white text-sm font-medium rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            processing ? 'opacity-75' : ''
                          }`}
                        >
                          {processing ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Submit All Requests'
                          )}
                        </button>
                      </div>
                    </>
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
      />
    </AuthenticatedLayout>
  );
}