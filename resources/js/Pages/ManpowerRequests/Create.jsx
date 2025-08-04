// js/pages/ManpowerRequests/Create/Create.jsx
import { useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import SectionSelection from './components/SectionSelection';
import RequestForm from './components/RequestForm';

export default function Create({ sections, shifts }) {
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeRequestIndex, setActiveRequestIndex] = useState(0);

  const { data, setData, post, processing, errors } = useForm({
    requests: []
  });

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setShowSectionModal(false);
  };

  const handleSubSectionSelect = (subSection) => {
    // Initialize time slots for this sub-section
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
    setSelectedSection(null);
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

  const submit = (e) => {
    e.preventDefault();
    // Prepare the data to be sent
    const formattedRequests = requests.map(request => ({
      sub_section_id: request.sub_section_id,
      date: request.date,
      time_slots: Object.entries(request.time_slots).reduce((acc, [shiftId, slot]) => {
        if (slot.requested_amount && parseInt(slot.requested_amount) > 0) {
          acc[shiftId] = {
            requested_amount: parseInt(slot.requested_amount),
            male_count: parseInt(slot.male_count) || 0,
            female_count: parseInt(slot.female_count) || 0,
            start_time: slot.start_time,
            end_time: slot.end_time,
            reason: slot.reason || '',
            is_additional: slot.is_additional || false
          };
        }
        return acc;
      }, {})
    })).filter(request => Object.keys(request.time_slots).length > 0);

    if (formattedRequests.length === 0) {
      alert('Setidaknya satu permintaan harus memiliki jumlah yang diminta lebih dari 0');
      return;
    }

    setData('requests', formattedRequests);
    post('/manpower-requests', {
      onSuccess: () => {
        setRequests([]);
      }
    });
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl leading-tight">
          Request Man Power
        </h2>
      }
    >
      <div className="py-4 sm:py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 shadow-lg sm:rounded-lg overflow-hidden">
            <div className="p-4 sm:p-6 md:p-8 text-gray-900 dark:text-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="font-bold text-gray-700 dark:text-gray-300 text-xl sm:text-2xl">
                  Buat Request Man Power Baru
                </h1>
                <Link
                  href="/manpower-requests"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 dark:text-indigo-400 text-sm"
                >
                  <svg className="mr-1 w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Kembali ke Daftar
                </Link>
              </div>

              {!selectedSection && requests.length === 0 ? (
                <SectionSelection 
                  sections={sections} 
                  onSelect={handleSectionSelect} 
                />
              ) : selectedSection ? (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                    Pilih Sub Section dari {selectedSection.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedSection.sub_sections.map(subSection => (
                      <button
                        key={subSection.id}
                        type="button"
                        onClick={() => handleSubSectionSelect(subSection)}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      >
                        {subSection.name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSection(null)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Kembali ke pilih section
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-6">
                  {/* Request tabs */}
                  <div className="flex overflow-x-auto pb-2">
                    {requests.map((request, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveRequestIndex(index)}
                        className={`px-4 py-2 mr-2 text-sm font-medium rounded-t-md ${activeRequestIndex === index ? 'bg-indigo-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
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
                      onClick={() => setShowSectionModal(true)}
                      className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-md"
                    >
                      + Tambah Sub Section
                    </button>
                  </div>

                  {/* Active request form */}
                  {requests.length > 0 && (
                    <RequestForm
                      request={requests[activeRequestIndex]}
                      shifts={shifts}
                      errors={errors.requests?.[activeRequestIndex] || {}}
                      onChange={(field, value) => handleRequestChange(activeRequestIndex, field, value)}
                      onSlotChange={(shiftId, field, value) => handleSlotChange(activeRequestIndex, shiftId, field, value)}
                    />
                  )}

                  <div className="flex justify-end items-center pt-2">
                    <button
                      type="submit"
                      disabled={processing || requests.length === 0}
                      className={`inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-4 sm:px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed ${processing ? 'opacity-75' : ''}`}
                    >
                      {processing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        'Submit Semua Request'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Selection Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Pilih Section
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {sections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setSelectedSection(section);
                    setShowSectionModal(false);
                  }}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                >
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">
                    {section.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {section.sub_sections.length} sub section
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}