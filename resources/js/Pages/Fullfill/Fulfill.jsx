import { useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

import RequestDetails from './components/RequestDetails';
import GenderStats from './components/GenderStats';
import EmployeeSelection from './components/EmployeeSelection';
import ConfirmationSection from './components/ComfirmationSection';
import EmployeeModal from './components/EmployeeModal';

export default function Fulfill({ 
    request, 
    sameSubSectionEmployees, 
    otherSubSectionEmployees, 
    currentScheduledIds = [],
    message,
    auth 
}) {
    // Dark mode state
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(prev => {
            const newMode = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('darkMode', newMode.toString());
                if (newMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
            return newMode;
        });
    };

    // Apply dark mode class on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [isDarkMode]);

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
        return [
            ...sameSubSectionEmployees.map(emp => ({
                ...emp,
                subSections: emp.sub_sections_data || [],
                gender: normalizeGender(emp.gender),
                originalGender: emp.gender,
                isCurrentlyScheduled: currentScheduledIds.includes(emp.id)
            })),
            ...otherSubSectionEmployees.map(emp => ({
                ...emp,
                subSections: emp.sub_sections_data || [],
                gender: normalizeGender(emp.gender),
                originalGender: emp.gender,
                isCurrentlyScheduled: currentScheduledIds.includes(emp.id)
            }))
        ];
    }, [sameSubSectionEmployees, otherSubSectionEmployees, currentScheduledIds]);

    // Sort employees with gender priority
   const allSortedEligibleEmployees = useMemo(() => {
    const sorted = [...combinedEmployees].sort((a, b) => {
        // 1. Currently scheduled employees first
        if (a.isCurrentlyScheduled !== b.isCurrentlyScheduled) {
            return a.isCurrentlyScheduled ? -1 : 1;
        }

        // 2. Calculate total score as simple sum of components
        const aTotalScore = (a.workload_points || 0) + (a.blind_test_points || 0) + (a.average_rating || 0);
        const bTotalScore = (b.workload_points || 0) + (b.blind_test_points || 0) + (b.average_rating || 0);
 

        // 3. Priority to matching gender requirements
        const aGenderMatch = request.male_count > 0 && a.gender === 'male' ? 0 :
            request.female_count > 0 && a.gender === 'female' ? 0 : 1;
        const bGenderMatch = request.male_count > 0 && b.gender === 'male' ? 0 :
            request.female_count > 0 && b.gender === 'female' ? 0 : 1;
        if (aGenderMatch !== bGenderMatch) return aGenderMatch - bGenderMatch;

        // 4. Higher total score first (new simple sum)
        if (aTotalScore !== bTotalScore) {
            return bTotalScore - aTotalScore;
        }

        // 5. Same sub-section first
        const aIsSame = a.subSections.some(ss => ss.id === request.sub_section_id);
        const bIsSame = b.subSections.some(ss => ss.id === request.sub_section_id);
        if (aIsSame !== bIsSame) return aIsSame ? -1 : 1;

        // 6. Bulanan before harian
        if (a.type === 'bulanan' && b.type === 'harian') return -1;
        if (a.type === 'harian' && b.type === 'bulanan') return 1;

        // 7. For harian, higher weight first
        if (a.type === 'harian' && b.type === 'harian') {
            return b.working_day_weight - a.working_day_weight;
        }

        // 8. Finally, sort by ID to ensure consistent ordering
        return a.id - b.id;
    });

    return sorted;
}, [combinedEmployees, request.sub_section_id, request.male_count, request.female_count]);


    // Initial selection - prioritize currently scheduled employees
    const initialSelectedIds = useMemo(() => {
        // First try to use currently scheduled employees
        const validCurrentIds = currentScheduledIds.filter(id => 
            allSortedEligibleEmployees.some(e => e.id === id)
        );
        
        if (validCurrentIds.length > 0) {
            // Fill remaining slots with new selections if needed
            if (validCurrentIds.length < request.requested_amount) {
                const remainingCount = request.requested_amount - validCurrentIds.length;
                const remainingEmployees = allSortedEligibleEmployees
                    .filter(e => !validCurrentIds.includes(e.id))
                    .slice(0, remainingCount)
                    .map(e => e.id);
                
                return [...validCurrentIds, ...remainingEmployees];
            }
            return validCurrentIds.slice(0, request.requested_amount);
        }

        // Fall back to original selection logic if no current schedules
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

        return selected.slice(0, request.requested_amount);
    }, [allSortedEligibleEmployees, request.requested_amount, request.male_count, request.female_count, request.sub_section_id, currentScheduledIds]);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedIds,
        fulfilled_by: auth.user.id
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
            required_female: request.female_count || 0,
            current_scheduled: 0
        };

        selectedIds.forEach(id => {
            const emp = allSortedEligibleEmployees.find(e => e.id === id);
            if (emp) {
                stats.total++;
                if (emp.isCurrentlyScheduled) {
                    stats.current_scheduled++;
                }
                if (emp.gender === 'female') {
                    stats.female++;
                    stats[`female_${emp.type}`]++;
                } else {
                    stats.male++;
                    stats[`male_${emp.type}`]++;
                }
            }
        });

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

        // Prevent duplicate selection (unless it's the same employee)
        if (newEmployeeId !== currentEmpId && newIds.includes(newEmployeeId)) {
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

    if (request.status === 'fulfilled' && !request.schedules?.length) {
        return (
            <AuthenticatedLayout
                header={
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl">Penuhi Request Man Power</h2>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                }
                user={auth.user}
            >
                <div className="bg-white dark:bg-gray-800 shadow-md mx-auto mt-6 p-4 rounded-lg max-w-4xl text-center">
                    <p className="mb-3 font-bold text-green-600 dark:text-green-400 text-lg">Permintaan ini sudah terpenuhi!</p>
                    {request.fulfilled_by && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Dipenuhi oleh: {request.fulfilled_by.name} ({request.fulfilled_by.email})
                        </p>
                    )}
                    <button
                        onClick={() => router.visit(route('manpower-requests.index'))}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 mt-4 px-4 py-2 rounded-lg text-white"
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
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 dark:text-gray-200 text-xl">Penuhi Request Man Power</h2>
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>
                </div>
            }
            user={auth.user}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                <RequestDetails request={request} auth={auth} />
                
                {request.status === 'fulfilled' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 shadow-md mb-6 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                        <h3 className="mb-3 font-bold text-lg text-blue-800 dark:text-blue-300">Informasi Jadwal Saat Ini</h3>
                        <p className="text-blue-700 dark:text-blue-300">
                            {genderStats.current_scheduled} dari {request.requested_amount} karyawan sudah dijadwalkan sebelumnya.
                        </p>
                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                            Anda dapat mengganti karyawan yang menolak atau membiarkan yang sudah menerima.
                        </p>
                    </div>
                )}

                <GenderStats 
                    genderStats={genderStats} 
                    request={request} 
                    selectedIds={selectedIds} 
                    allSortedEligibleEmployees={allSortedEligibleEmployees}
                />

                {backendError && (
                    <div className="bg-red-100 dark:bg-red-900/20 mb-4 p-3 border border-red-400 dark:border-red-600 rounded-lg text-red-700 dark:text-red-300">
                        <p className="font-semibold">Error:</p>
                        <p>{backendError}</p>
                    </div>
                )}

                {totalSameSubSection < request.requested_amount && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 mb-4 p-3 border border-yellow-400 dark:border-yellow-600 rounded-lg text-yellow-700 dark:text-yellow-300">
                        <p>Hanya {totalSameSubSection} karyawan dari sub-bagian yang sama yang tersedia</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <EmployeeSelection 
                        request={request}
                        selectedIds={selectedIds}
                        getEmployeeDetails={getEmployeeDetails}
                        openChangeModal={openChangeModal}
                    />

                    <ConfirmationSection 
                        auth={auth}
                        processing={processing}
                    />
                </form>

                <EmployeeModal 
                    showModal={showModal}
                    setShowModal={setShowModal}
                    request={request}
                    allSortedEligibleEmployees={allSortedEligibleEmployees}
                    selectedIds={selectedIds}
                    selectNewEmployee={selectNewEmployee}
                />
            </div>
        </AuthenticatedLayout>
    );
}