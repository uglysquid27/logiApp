import { useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

export default function Fulfill({ 
    request, 
    sameSubSectionEmployees, 
    otherSubSectionEmployees, 
    message,
    auth 
}) {
    // Debug incoming data
    useEffect(() => {
        console.log('Request:', {
            ...request,
            date: dayjs(request.date).format('YYYY-MM-DD')
        });
        console.log('Same Sub-Section Employees:', sameSubSectionEmployees);
        console.log('Other Sub-Section Employees:', otherSubSectionEmployees);
        console.log('Auth User:', auth.user);
    }, []);

    // Normalize gender with strict validation
    const normalizeGender = (gender) => {
        if (!gender) {
            console.warn('Employee missing gender, defaulting to male');
            return 'male';
        }
        const normalized = gender.toString().toLowerCase().trim();
        if (normalized !== 'female' && normalized !== 'male') {
            console.warn(`Invalid gender value: ${gender}, defaulting to male`);
            return 'male';
        }
        return normalized;
    };

    // Combine and normalize employee data
    const combinedEmployees = useMemo(() => {
        const employees = [
            ...sameSubSectionEmployees.map(emp => ({
                ...emp,
                subSections: emp.sub_sections_data || [],
                gender: normalizeGender(emp.gender),
                originalGender: emp.gender
            })),
            ...otherSubSectionEmployees.map(emp => ({
                ...emp,
                subSections: emp.sub_sections_data || [],
                gender: normalizeGender(emp.gender),
                originalGender: emp.gender
            }))
        ];

        console.log('Combined Employees:', employees.map(e => ({
            id: e.id,
            name: e.name,
            gender: e.gender,
            originalGender: e.originalGender,
            type: e.type,
            subSection: e.subSections?.[0]?.name
        })));

        return employees;
    }, [sameSubSectionEmployees, otherSubSectionEmployees]);

    // Sort employees with gender priority
    const allSortedEligibleEmployees = useMemo(() => {
        const sorted = [...combinedEmployees].sort((a, b) => {
            // 1. Priority to matching gender requirements
            const aGenderMatch = request.male_count > 0 && a.gender === 'male' ? 0 :
                request.female_count > 0 && a.gender === 'female' ? 0 : 1;
            const bGenderMatch = request.male_count > 0 && b.gender === 'male' ? 0 :
                request.female_count > 0 && b.gender === 'female' ? 0 : 1;
            if (aGenderMatch !== bGenderMatch) return aGenderMatch - bGenderMatch;

            // 2. Same sub-section first
            const aIsSame = a.subSections.some(ss => ss.id === request.sub_section_id);
            const bIsSame = b.subSections.some(ss => ss.id === request.sub_section_id);
            if (aIsSame !== bIsSame) return aIsSame ? -1 : 1;

            // 3. Bulanan before harian
            if (a.type === 'bulanan' && b.type === 'harian') return -1;
            if (a.type === 'harian' && b.type === 'bulanan') return 1;

            // 4. For harian, higher weight first
            if (a.type === 'harian' && b.type === 'harian') {
                return b.working_day_weight - a.working_day_weight;
            }

            // 5. Higher rating first
            return b.calculated_rating - a.calculated_rating;
        });

        console.log('Sorted Employees:', sorted.map(e => ({
            id: e.id,
            name: e.name,
            gender: e.gender,
            type: e.type,
            subSection: e.subSections?.[0]?.name,
            rating: e.calculated_rating,
            weight: e.working_day_weight
        })));

        return sorted;
    }, [combinedEmployees, request.sub_section_id, request.male_count, request.female_count]);

    // Initial selection respecting gender requirements
    const initialSelectedIds = useMemo(() => {
        const requiredMale = request.male_count || 0;
        const requiredFemale = request.female_count || 0;
        const totalRequired = requiredMale + requiredFemale;

        // Separate employees by gender and sub-section
        const sameSubMales = allSortedEligibleEmployees
            .filter(e => e.gender === 'male' && e.subSections.some(ss => ss.id === request.sub_section_id));
        const sameSubFemales = allSortedEligibleEmployees
            .filter(e => e.gender === 'female' && e.subSections.some(ss => ss.id === request.sub_section_id));
        const otherSubMales = allSortedEligibleEmployees
            .filter(e => e.gender === 'male' && !e.subSections.some(ss => ss.id === request.sub_section_id));
        const otherSubFemales = allSortedEligibleEmployees
            .filter(e => e.gender === 'female' && !e.subSections.some(ss => ss.id === request.sub_section_id));

        const selected = [];

        // 1. First pick required males from same sub-section
        selected.push(...sameSubMales.slice(0, requiredMale).map(e => e.id));

        // 2. Then pick required females from same sub-section
        selected.push(...sameSubFemales.slice(0, requiredFemale).map(e => e.id));

        // 3. If still need more males, take from other sub-sections
        const currentMaleCount = selected.filter(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            return emp?.gender === 'male';
        }).length;

        if (currentMaleCount < requiredMale) {
            const needed = requiredMale - currentMaleCount;
            selected.push(...otherSubMales.slice(0, needed).map(e => e.id));
        }

        // 4. If still need more females, take from other sub-sections
        const currentFemaleCount = selected.filter(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            return emp?.gender === 'female';
        }).length;

        if (currentFemaleCount < requiredFemale) {
            const needed = requiredFemale - currentFemaleCount;
            selected.push(...otherSubFemales.slice(0, needed).map(e => e.id));
        }

        // 5. Fill remaining slots with best candidates regardless of gender
        if (selected.length < request.requested_amount) {
            const remaining = allSortedEligibleEmployees
                .filter(e => !selected.includes(e.id))
                .slice(0, request.requested_amount - selected.length);
            selected.push(...remaining.map(e => e.id));
        }

        console.log('Initial Selection:', {
            selectedIds: selected,
            maleCount: selected.filter(id => {
                const emp = allSortedEligibleEmployees.find(e => e.id === id);
                return emp?.gender === 'male';
            }).length,
            femaleCount: selected.filter(id => {
                const emp = allSortedEligibleEmployees.find(e => e.id === id);
                return emp?.gender === 'female';
            }).length
        });

        return selected.slice(0, request.requested_amount);
    }, [allSortedEligibleEmployees, request.requested_amount, request.male_count, request.female_count, request.sub_section_id]);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedIds,
        fulfilled_by: auth.user.id // Added fulfilled_by field
    });

    const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
    const [showModal, setShowModal] = useState(false);
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);
    const [backendError, setBackendError] = useState(null);

    // Sync selectedIds with Inertia's form data
    useEffect(() => {
        setData('employee_ids', selectedIds);
    }, [selectedIds]);

    // Reset selection when initialSelectedIds changes
    useEffect(() => {
        setSelectedIds(initialSelectedIds);
    }, [initialSelectedIds]);

    // Calculate gender statistics
    const genderStats = useMemo(() => {
        const stats = {
            total: 0,
            male: 0,
            female: 0,
            male_bulanan: 0,
            male_harian: 0,
            female_bulanan: 0,
            female_harian: 0,
            required_male: request.male_count || 0,
            required_female: request.female_count || 0
        };

        selectedIds.forEach(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            if (emp) {
                stats.total++;
                if (emp.gender === 'female') {
                    stats.female++;
                    stats[`female_${emp.type}`]++;
                } else {
                    stats.male++;
                    stats[`male_${emp.type}`]++;
                }
            }
        });

        console.log('Gender Statistics:', stats);
        return stats;
    }, [selectedIds, allSortedEligibleEmployees, request.male_count, request.female_count]);

    useEffect(() => {
        if (errors?.fulfillment_error) {
            setBackendError(errors.fulfillment_error);
        }
    }, [errors]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setBackendError(null);

        // Validate gender requirements
        const selectedEmployees = selectedIds.map(id =>
            allSortedEligibleEmployees.find(e => e.id === id)
        );

        const maleCount = selectedEmployees.filter(e => e?.gender === 'male').length;
        const femaleCount = selectedEmployees.filter(e => e?.gender === 'female').length;

        if (request.male_count > 0 && maleCount < request.male_count) {
            alert(`Diperlukan minimal ${request.male_count} karyawan laki-laki`);
            return;
        }

        if (request.female_count > 0 && femaleCount < request.female_count) {
            alert(`Diperlukan minimal ${request.female_count} karyawan perempuan`);
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
    }, [selectedIds, request, allSortedEligibleEmployees, post]);

    const openChangeModal = useCallback((index) => {
        setChangingEmployeeIndex(index);
        setShowModal(true);
    }, []);

    const selectNewEmployee = useCallback((newEmployeeId) => {
        if (changingEmployeeIndex === null) return;

        const newIds = [...selectedIds];
        const currentEmpId = newIds[changingEmployeeIndex];

        // Prevent duplicate selection
        if (newIds.includes(newEmployeeId)) {
            alert('Karyawan ini sudah dipilih');
            return;
        }

        const newEmployee = allSortedEligibleEmployees.find(e => e.id === newEmployeeId);
        const currentEmp = allSortedEligibleEmployees.find(e => e.id === currentEmpId);

        // Calculate new gender counts
        let newMaleCount = selectedIds.filter(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            return emp?.gender === 'male';
        }).length;

        let newFemaleCount = selectedIds.filter(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            return emp?.gender === 'female';
        }).length;

        // Adjust counts based on replacement
        if (currentEmp) {
            if (currentEmp.gender === 'male') newMaleCount--;
            if (currentEmp.gender === 'female') newFemaleCount--;
        }

        if (newEmployee.gender === 'male') newMaleCount++;
        if (newEmployee.gender === 'female') newFemaleCount++;

        // Validate against requirements
        if (request.male_count > 0 && newMaleCount > request.male_count) {
            alert(`Maksimum ${request.male_count} karyawan laki-laki diperbolehkan`);
            return;
        }

        if (request.female_count > 0 && newFemaleCount > request.female_count) {
            alert(`Maksimum ${request.female_count} karyawan perempuan diperbolehkan`);
            return;
        }

        newIds[changingEmployeeIndex] = newEmployeeId;
        setSelectedIds(newIds);
        setShowModal(false);
        setChangingEmployeeIndex(null);
    }, [changingEmployeeIndex, selectedIds, allSortedEligibleEmployees, request.male_count, request.female_count]);

    const getEmployeeDetails = useCallback((id) => {
        return allSortedEligibleEmployees.find(emp => emp.id === id);
    }, [allSortedEligibleEmployees]);

    if (request.status === 'fulfilled') {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-gray-800 text-xl">Penuhi Request Man Power</h2>}
                user={auth.user}
            >
                <div className="bg-white shadow-md mx-auto mt-6 p-4 rounded-lg max-w-4xl text-center">
                    <p className="mb-3 font-bold text-green-600 text-lg">Permintaan ini sudah terpenuhi!</p>
                    {request.fulfilled_by && (
                        <p className="text-gray-600 mb-4">
                            Dipenuhi oleh: {request.fulfilled_by.name} ({request.fulfilled_by.email})
                        </p>
                    )}
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
            header={<h2 className="font-semibold text-gray-800 text-xl">Penuhi Request Man Power</h2>}
            user={auth.user}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                {/* Request Details */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Detail Permintaan</h3>
                    <p><strong>Tanggal:</strong> {dayjs(request.date).format('DD MMMM YYYY')}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                    <p><strong>Diproses oleh:</strong> {auth.user.name} ({auth.user.email})</p>
                </div>

                {/* Gender Requirements */}
                {(request.male_count > 0 || request.female_count > 0) && (
                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Persyaratan Gender</h3>
                        <div className="gap-4 grid grid-cols-2">
                            {request.male_count > 0 && (
                                <div className={`bg-blue-100 p-3 rounded-lg border ${genderStats.male < genderStats.required_male ? 'border-red-500' : 'border-blue-200'}`}>
                                    <p className="text-blue-900 text-sm">Laki-laki Dibutuhkan</p>
                                    <p className="font-bold text-xl">{genderStats.male} / {genderStats.required_male}</p>
                                </div>
                            )}
                            {request.female_count > 0 && (
                                <div className={`bg-pink-100 p-3 rounded-lg border ${genderStats.female < genderStats.required_female ? 'border-red-500' : 'border-pink-200'}`}>
                                    <p className="text-pink-900 text-sm">Perempuan Dibutuhkan</p>
                                    <p className="font-bold text-xl">{genderStats.female} / {genderStats.required_female}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Gender Distribution */}
                {(request.male_count > 0 || request.female_count > 0) && (
                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Distribusi Gender</h3>
                        <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
                            <div className="bg-blue-50 p-3 border border-blue-100 rounded-lg">
                                <p className="text-blue-800 text-sm">Total Terpilih</p>
                                <p className="font-bold text-xl">{genderStats.total}</p>
                            </div>
                            {request.male_count > 0 && (
                                <div className="bg-blue-100 p-3 border border-blue-200 rounded-lg">
                                    <p className="text-blue-900 text-sm">Laki-laki</p>
                                    <p className="font-bold text-xl">{genderStats.male}</p>
                                </div>
                            )}
                            {request.female_count > 0 && (
                                <div className="bg-pink-100 p-3 border border-pink-200 rounded-lg">
                                    <p className="text-pink-900 text-sm">Perempuan</p>
                                    <p className="font-bold text-xl">{genderStats.female}</p>
                                </div>
                            )}
                            <div className="bg-gray-50 p-3 border border-gray-200 rounded-lg">
                                {genderStats.male_bulanan > 0 && <p className="text-sm">Laki Bulanan: {genderStats.male_bulanan}</p>}
                                {genderStats.female_bulanan > 0 && <p className="text-sm">Perempuan Bulanan: {genderStats.female_bulanan}</p>}
                                {genderStats.male_harian > 0 && <p className="text-sm">Laki Harian: {genderStats.male_harian}</p>}
                                {genderStats.female_harian > 0 && <p className="text-sm">Perempuan Harian: {genderStats.female_harian}</p>}
                                {(genderStats.male_bulanan === 0 && genderStats.female_bulanan === 0 &&
                                    genderStats.male_harian === 0 && genderStats.female_harian === 0) && (
                                        <p className="text-gray-400 text-sm">Tidak ada data</p>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

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
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = selectedIds[index];
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
                                                        <span className={`inline-block px-1 rounded ${isFemale
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

                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Konfirmasi</h3>
                        <p className="text-gray-600 mb-4">Anda akan mengirim permintaan ini sebagai: {auth.user.name}</p>
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-white transition duration-200"
                        >
                            {processing ? 'Menyimpan...' : 'Submit Permintaan'}
                        </button>
                    </div>
                </form>

                {/* Employee Selection Modal */}
                {showModal && (
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
                                <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                    {allSortedEligibleEmployees.map(emp => {
                                        const isSelected = selectedIds.includes(emp.id);
                                        const empSubSection = emp.subSections?.find(ss => ss.id === request.sub_section_id);
                                        const isSameSubSection = empSubSection?.id === request.sub_section_id;
                                        const isFemale = emp.gender === 'female';

                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => !isSelected && selectNewEmployee(emp.id)}
                                                disabled={isSelected}
                                                className={`text-left p-3 rounded-md border transition ${isSelected
                                                        ? 'bg-blue-50 border-blue-200 cursor-not-allowed'
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
                                                            <p>Sub: {empSubSection?.name || 'Lain'}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xs px-1 rounded ${isFemale
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
                )}
            </div>
        </AuthenticatedLayout>
    );
}