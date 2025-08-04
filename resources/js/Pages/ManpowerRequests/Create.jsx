// js/pages/ManpowerRequests/Create/Create.jsx
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import useManpowerForm from './hooks/useManpowerForm';
import SubSectionModal from './components/SubSectionModal';
import DuplicateWarning from './components/DuplicateWarning';
import ShiftSlot from './components/ShiftSlot';

export default function Create({ subSections, shifts }) {
  const {
    data,
    setData,
    errors,
    processing,
    sectionsWithSubs,
    isModalOpen,
    setIsModalOpen,
    searchTerm,
    setSearchTerm,
    filteredSections,
    selectSubSection,
    duplicateRequests,
    showDuplicateWarning,
    setShowDuplicateWarning,
    handleSlotChange,
    handleNumberFocus,
    submit,
    today
  } = useManpowerForm(subSections, shifts);

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

              <form onSubmit={submit} className="space-y-6">
                {/* Sub Section Field */}
                <div>
                  <label htmlFor="sub_section_id" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Sub Section <span className="text-red-500">*</span>
                  </label>

                  {/* Selected sub-section display */}
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.sub_section_id ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100 cursor-pointer`}
                  >
                    {data.sub_section_name ? (
                      <span className="block truncate">{data.sub_section_name}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-400">-- Pilih Sub Section --</span>
                    )}
                  </div>
                  {errors.sub_section_id && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.sub_section_id}</p>}
                </div>

                {/* Date Field */}
                <div>
                  <label htmlFor="date" className="block mb-1 font-medium text-gray-700 dark:text-gray-300 text-sm">
                    Tanggal Dibutuhkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    min={today}
                    className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${errors.date ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    required
                  />
                  {errors.date && <p className="mt-1 text-red-600 dark:text-red-400 text-sm">{errors.date}</p>}
                </div>

                {/* Shift-based Manpower Slots */}
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-lg">
                    Jumlah Man Power per Shift
                  </h3>
                  <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm italic">
                    Isi hanya shift yang Anda butuhkan *manpower*nya. Shift lain akan diabaikan.
                  </p>

                  {shifts && Array.isArray(shifts) && shifts.map((shift) => (
                    <ShiftSlot
                      key={shift.id}
                      shift={shift}
                      slotData={data.time_slots[shift.id] || {}}
                      errors={errors}
                      duplicateRequests={duplicateRequests}
                      showDuplicateWarning={showDuplicateWarning}
                      handleSlotChange={handleSlotChange}
                      handleNumberFocus={handleNumberFocus}
                    />
                  ))}
                </div>

                {/* Duplicate Requests Warning */}
                {showDuplicateWarning && (
                  <DuplicateWarning
                    duplicateRequests={duplicateRequests}
                    setShowDuplicateWarning={setShowDuplicateWarning}
                    processSubmission={submit}
                  />
                )}

                {/* Submit Button - Only show if no duplicates or warning dismissed */}
                {!showDuplicateWarning && (
                  <div className="flex justify-end items-center pt-2">
                    <button
                      type="submit"
                      className={`inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 shadow-sm px-4 sm:px-6 py-2 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 font-medium text-white text-sm disabled:cursor-not-allowed ${processing ? 'opacity-75' : ''}`}
                      disabled={processing}
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
                        'Submit Request'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-section Selection Modal */}
      {isModalOpen && (
        <SubSectionModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredSections={filteredSections}
          data={data}
          selectSubSection={selectSubSection}
        />
      )}
    </AuthenticatedLayout>
  );
}