export default function EmployeeModal({
    showModal,
    setShowModal,
    request,
    allSortedEligibleEmployees,
    selectedIds,
    selectNewEmployee
}) {
    if (!showModal) return null;

    return (
        <div
            className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4"
            onClick={() => setShowModal(false)}
        >
            <div
                className="relative bg-white shadow-xl rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => setShowModal(false)}
                    className="top-4 right-4 absolute text-gray-500 hover:text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    <h3 className="mb-4 font-bold text-xl">Pilih Karyawan Baru</h3>

                    {/* Group for Same Sub-Section Employees */}
                    <h4 className="mb-3 font-semibold text-lg text-gray-700">Karyawan dari Sub-Bagian Sama ({request.sub_section?.name})</h4>
                    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
                        {allSortedEligibleEmployees
                            .filter(emp => emp.subSections.some(ss => ss.id === request.sub_section_id))
                            .map(emp => {
                                const isSelected = selectedIds.includes(emp.id);
                                const isCurrentlyScheduled = emp.isCurrentlyScheduled;

                                let displaySubSectionName = 'Tidak Ada Bagian';
                                if (emp.subSections && emp.subSections.length > 0) {
                                    const sameSub = emp.subSections.find(ss => ss.id === request.sub_section_id);
                                    if (sameSub) {
                                        displaySubSectionName = sameSub.name;
                                    } else {
                                        displaySubSectionName = emp.subSections[0].name;
                                    }
                                }

                                const isFemale = emp.gender === 'female';

                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => !isSelected && selectNewEmployee(emp.id)}
                                        disabled={isSelected}
                                        className={`text-left p-3 rounded-md border transition ${isSelected
                                                ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
                                                : isCurrentlyScheduled
                                                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                    : isFemale
                                                        ? 'hover:bg-pink-50 border-pink-200'
                                                        : 'hover:bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <div className="mt-1 text-gray-500 text-xs">
                                                    <p>NIK: {emp.nik}</p>
                                                    <p>Tipe: {emp.type}</p>
                                                    <p>Sub: {displaySubSectionName}</p>
                                                    {emp.type === 'harian' && (
                                                        <p>Bobot Kerja: {emp.working_day_weight}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-xs px-1 rounded mb-1 ${isFemale
                                                        ? 'bg-pink-100 text-pink-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {isFemale ? 'P' : 'L'}
                                                </span>
                                                {isCurrentlyScheduled && (
                                                    <span className="text-xs px-1 rounded bg-green-100 text-green-800">
                                                        Sudah dijadwalkan
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>

                    {/* Group for Other Sub-Section Employees */}
                    <h4 className="mb-3 font-semibold text-lg text-gray-700">Karyawan dari Sub-Bagian Lain</h4>
                    <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                        {allSortedEligibleEmployees
                            .filter(emp => !emp.subSections.some(ss => ss.id === request.sub_section_id))
                            .map(emp => {
                                const isSelected = selectedIds.includes(emp.id);
                                const isCurrentlyScheduled = emp.isCurrentlyScheduled;

                                let displaySubSectionName = 'Tidak Ada Bagian';
                                if (emp.subSections && emp.subSections.length > 0) {
                                    displaySubSectionName = emp.subSections[0].name;
                                }

                                const isFemale = emp.gender === 'female';

                                return (
                                    // Inside the employee button in both sections (same sub-section and other sub-section)
                                    <button
                                        key={emp.id}
                                        onClick={() => !isSelected && selectNewEmployee(emp.id)}
                                        disabled={isSelected}
                                        className={`text-left p-3 rounded-md border transition ${isSelected
                                                ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
                                                : isCurrentlyScheduled
                                                    ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                                    : isFemale
                                                        ? 'hover:bg-pink-50 border-pink-200'
                                                        : 'hover:bg-blue-50 border-blue-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <strong>{emp.name}</strong>
                                                <div className="mt-1 text-gray-500 text-xs">
                                                    <p>NIK: {emp.nik}</p>
                                                    <p>Tipe: {emp.type}</p>
                                                    <p>Sub: {displaySubSectionName}</p>
                                                    <p>Skor: {emp.total_score.toFixed(2)}</p>
                                                    {emp.type === 'harian' && (
                                                        <p>Bobot Kerja: {emp.working_day_weight}</p>
                                                    )}
                                                    <p>Beban Kerja: {emp.workload_points}</p>
                                                    <p>Test Buta: {emp.blind_test_points}</p>
                                                    <p>Rating: {emp.average_rating.toFixed(1)}</p>
                                                </div>
                                            </div>
                                            {/* ... rest of the button code ... */}
                                        </div>
                                    </button>
                                );
                            })}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}