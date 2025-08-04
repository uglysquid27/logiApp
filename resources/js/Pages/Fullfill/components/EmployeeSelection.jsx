export default function EmployeeSelection({ 
    request, 
    selectedIds, 
    getEmployeeDetails, 
    openChangeModal 
}) {
    return (
        <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
            <h3 className="mb-3 font-bold text-lg">Karyawan Terpilih</h3>
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                {Array.from({ length: request.requested_amount }).map((_, index) => {
                    const employeeId = selectedIds[index];
                    const employee = getEmployeeDetails(employeeId);
                    const isEmptySlot = !employeeId;
                    const employeeSubSection = employee?.subSections?.find(ss => ss.id === request.sub_section_id);
                    const isFemale = employee?.gender === 'female';
                    const isCurrentlyScheduled = employee?.isCurrentlyScheduled;

                    return (
                        <div key={employeeId || `slot-${index}`} className={`flex justify-between items-center space-x-3 p-3 rounded-md ${
                            isCurrentlyScheduled ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                        }`}>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={!isEmptySlot}
                                    readOnly
                                    className={`w-5 h-5 form-checkbox ${
                                        isCurrentlyScheduled ? 'text-green-600' : 'text-blue-600'
                                    }`}
                                />
                                <span>
                                    <strong>{isEmptySlot ? `Slot ${index + 1} Kosong` : employee?.name}</strong> ({employee?.nik || 'N/A'})
                                    {employee && (
                                        <div className="mt-1 text-gray-500 text-xs">
                                            {isCurrentlyScheduled && (
                                                <span className="inline-block px-1 rounded bg-green-100 text-green-800 mr-1">
                                                    Sudah dijadwalkan
                                                </span>
                                            )}
                                            <span className={`inline-block px-1 rounded ${isFemale
                                                    ? 'bg-pink-100 text-pink-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {isFemale ? 'Perempuan' : 'Laki-laki'}
                                            </span>
                                            <span> | Tipe: {employee.type}</span>
                                            <span> | Sub: {employeeSubSection?.name || 'Lain'}</span>
                                            {employee.type === 'harian' && (
                                                <span> | Bobot Kerja: {employee.working_day_weight}</span>
                                            )}
                                        </div>
                                    )}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => openChangeModal(index)}
                                className={`text-sm ${
                                    isCurrentlyScheduled ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'
                                }`}
                            >
                                {isEmptySlot ? 'Pilih' : 'Ubah'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}