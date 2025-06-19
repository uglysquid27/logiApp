import { useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

export default function Fulfill({ request, sameSubSectionEmployees, otherSubSectionEmployees, message }) {
    // Memoize combined employees with proper gender normalization
    const combinedEmployees = useMemo(() => [
        ...sameSubSectionEmployees.map(emp => ({
            ...emp,
            subSections: emp.sub_sections_data || [],
            gender: emp.gender?.toLowerCase() === 'female' ? 'female' : 'male'
        })),
        ...otherSubSectionEmployees.map(emp => ({
            ...emp,
            subSections: emp.sub_sections_data || [],
            gender: emp.gender?.toLowerCase() === 'female' ? 'female' : 'male'
        }))
    ], [sameSubSectionEmployees, otherSubSectionEmployees]);

    // Memoize sorted employees with stable sorting
    const allSortedEligibleEmployees = useMemo(() => {
        return [...combinedEmployees].sort((a, b) => {
            // 1. Same sub-section first
            const aIsSame = a.subSections.some(ss => ss.id === request.sub_section_id);
            const bIsSame = b.subSections.some(ss => ss.id === request.sub_section_id);
            if (aIsSame !== bIsSame) return aIsSame ? -1 : 1;

            // 2. Bulanan before harian
            if (a.type === 'bulanan' && b.type === 'harian') return -1;
            if (a.type === 'harian' && b.type === 'bulanan') return 1;

            // 3. For harian, higher weight first
            if (a.type === 'harian' && b.type === 'harian') {
                if (a.working_day_weight !== b.working_day_weight) {
                    return b.working_day_weight - a.working_day_weight;
                }
            }

            // 4. Higher rating first
            if (a.calculated_rating !== b.calculated_rating) {
                return b.calculated_rating - a.calculated_rating;
            }

            // 5. Fewer schedules first
            return a.schedules_count - b.schedules_count;
        });
    }, [combinedEmployees, request.sub_section_id]);

    // Initial selection - memoized
    const initialSelectedIds = useMemo(() => 
        allSortedEligibleEmployees.slice(0, request.requested_amount).map(emp => emp.id),
        [allSortedEligibleEmployees, request.requested_amount]
    );

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedIds,
    });

    const [showModal, setShowModal] = useState(false);
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);
    const [backendError, setBackendError] = useState(null);

    // Calculate gender statistics with proper gender detection
    const genderStats = useMemo(() => {
        return data.employee_ids.reduce((acc, id) => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            if (emp) {
                acc.total++;
                const gender = emp.gender === 'female' ? 'female' : 'male';
                acc[gender]++;
                acc[`${gender}_${emp.type}`]++;
            }
            return acc;
        }, {
            total: 0,
            male: 0,
            female: 0,
            male_bulanan: 0,
            male_harian: 0,
            female_bulanan: 0,
            female_harian: 0
        });
    }, [data.employee_ids, allSortedEligibleEmployees]);

    // Update selected employees - stable callback
    const updateSelectedEmployees = useCallback(() => {
        const newSelection = allSortedEligibleEmployees
            .slice(0, request.requested_amount)
            .map(emp => emp.id);
        
        if (JSON.stringify(newSelection) !== JSON.stringify(data.employee_ids)) {
            setData('employee_ids', newSelection);
        }
    }, [allSortedEligibleEmployees, request.requested_amount, data.employee_ids, setData]);

    // Effect to update selection when dependencies change
    useEffect(() => {
        updateSelectedEmployees();
        setBackendError(null);
    }, [updateSelectedEmployees]);

    // Error handling effect
    useEffect(() => {
        if (errors?.fulfillment_error) {
            setBackendError(errors.fulfillment_error);
        }
    }, [errors]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setBackendError(null);

        if (data.employee_ids.length !== request.requested_amount) {
            alert(`Please select exactly ${request.requested_amount} employees`);
            return;
        }

        post(route('manpower-requests.fulfill.store', request.id), {
            onSuccess: () => router.visit(route('manpower-requests.index')),
            onError: (errors) => {
                if (errors.fulfillment_error) {
                    setBackendError(errors.fulfillment_error);
                }
            }
        });
    }, [data.employee_ids, request.requested_amount, request.id, post]);

    const openChangeModal = useCallback((index) => {
        setChangingEmployeeIndex(index);
        setShowModal(true);
    }, []);

    const selectNewEmployee = useCallback((newEmployeeId) => {
        if (changingEmployeeIndex === null) return;

        const currentIds = [...data.employee_ids];
        if (currentIds.includes(newEmployeeId)) {
            alert('This employee is already selected');
            return;
        }

        currentIds[changingEmployeeIndex] = newEmployeeId;
        setData('employee_ids', currentIds);
        setShowModal(false);
        setChangingEmployeeIndex(null);
    }, [changingEmployeeIndex, data.employee_ids, setData]);

    const getEmployeeDetails = useCallback((id) => {
        return allSortedEligibleEmployees.find(emp => emp.id === id);
    }, [allSortedEligibleEmployees]);

    if (request.status === 'fulfilled') {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-xl text-gray-800">Penuhi Request Man Power</h2>}
            >
                <div className="bg-white shadow-md mx-auto mt-6 p-4 rounded-lg max-w-4xl text-center">
                    <p className="mb-3 font-bold text-green-600 text-lg">Permintaan ini sudah terpenuhi!</p>
                    <button
                        onClick={() => router.visit(route('manpower-requests.index'))}
                        className="bg-blue-600 hover:bg-blue-700 mt-4 px-4 py-2 rounded-lg text-white"
                    >
                        Kembali ke Daftar
                    </button>
                </div>
            </AuthenticatedLayout>
        );
    }

    const totalSameSubSection = sameSubSectionEmployees.length;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800">Penuhi Request Man Power</h2>}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                {/* Request Details */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Detail Permintaan</h3>
                    <p><strong>Tanggal:</strong> {dayjs(request.date).format('DD MMMM YYYY')}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                </div>

                {/* Gender Statistics */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Distribusi Gender</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">Total Terpilih</p>
                            <p className="text-xl font-bold">{genderStats.total}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">Laki-laki</p>
                            <p className="text-xl font-bold">{genderStats.male}</p>
                        </div>
                        <div className="bg-pink-100 p-3 rounded-lg border border-pink-200">
                            <p className="text-sm text-pink-900">Perempuan</p>
                            <p className="text-xl font-bold">{genderStats.female}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-sm">Laki Bulanan: {genderStats.male_bulanan}</p>
                            <p className="text-sm">Perempuan Bulanan: {genderStats.female_bulanan}</p>
                            <p className="text-sm">Laki Harian: {genderStats.male_harian}</p>
                            <p className="text-sm">Perempuan Harian: {genderStats.female_harian}</p>
                        </div>
                    </div>
                </div>

                {backendError && (
                    <div className="bg-red-100 mb-4 p-3 border border-red-400 rounded-lg text-red-700">
                        <p className="font-semibold">Error:</p>
                        <p>{backendError}</p>
                    </div>
                )}

                {totalSameSubSection < request.requested_amount && (
                    <div className="bg-yellow-100 mb-4 p-3 border border-yellow-400 rounded-lg text-yellow-700">
                        <p>Hanya {totalSameSubSection} karyawan dari sub-bagian yang sama yang tersedia</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Karyawan Terpilih</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = data.employee_ids[index];
                                const employee = getEmployeeDetails(employeeId);
                                const isEmptySlot = !employeeId;
                                const employeeSubSection = employee?.subSections?.find(ss => ss.id === request.sub_section_id);
                                const isFemale = employee?.gender === 'female';

                                return (
                                    <div key={employeeId || `slot-${index}`} className="flex justify-between items-center space-x-3 bg-gray-100 p-3 rounded-md">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={!isEmptySlot}
                                                readOnly
                                                className="w-5 h-5 text-green-600 form-checkbox"
                                            />
                                            <span>
                                                <strong>{isEmptySlot ? `Slot ${index + 1} Kosong` : employee?.name}</strong> ({employee?.nik || 'N/A'})
                                                {employee && (
                                                    <div className="mt-1 text-gray-500 text-xs">
                                                        <span className={`inline-block px-1 rounded ${
                                                            isFemale
                                                                ? 'bg-pink-100 text-pink-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {isFemale ? 'Perempuan' : 'Laki-laki'}
                                                        </span>
                                                        <span> | Tipe: {employee.type}</span>
                                                        <span> | Sub: {employeeSubSection?.name || 'Lain'}</span>
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openChangeModal(index)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {isEmptySlot ? 'Pilih' : 'Ubah'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-white transition duration-200"
                    >
                        {processing ? 'Menyimpan...' : 'Submit Permintaan'}
                    </button>
                </form>

                {/* Employee Selection Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-4">Pilih Karyawan Baru</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {allSortedEligibleEmployees.map(emp => {
                                        const isSelected = data.employee_ids.includes(emp.id);
                                        const empSubSection = emp.subSections?.find(ss => ss.id === request.sub_section_id);
                                        const isSameSubSection = empSubSection?.id === request.sub_section_id;
                                        const isFemale = emp.gender === 'female';

                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => !isSelected && selectNewEmployee(emp.id)}
                                                disabled={isSelected}
                                                className={`text-left p-3 rounded-md border transition ${
                                                    isSelected
                                                        ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
                                                        : isFemale
                                                            ? 'hover:bg-pink-50 border-pink-200'
                                                            : 'hover:bg-blue-50 border-blue-200'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <strong>{emp.name}</strong>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            <p>NIK: {emp.nik}</p>
                                                            <p>Tipe: {emp.type}</p>
                                                            <p>Sub: {empSubSection?.name || 'Lain'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-1 rounded ${
                                                        isFemale
                                                            ? 'bg-pink-100 text-pink-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {isFemale ? 'P' : 'L'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}