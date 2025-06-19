import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

export default function Fulfill({ request, sameSubSectionEmployees, otherSubSectionEmployees, message }) {
    // Combine and transform employee data
    const combinedEmployees = [
        ...sameSubSectionEmployees.map(emp => ({ 
            ...emp, 
            subSections: emp.sub_sections_data || [],
            gender: emp.gender || 'male' // Default to male if not specified
        })),
        ...otherSubSectionEmployees.map(emp => ({ 
            ...emp, 
            subSections: emp.sub_sections_data || [],
            gender: emp.gender || 'male'
        }))
    ];

    // Sorting logic
    const allSortedEligibleEmployees = combinedEmployees.sort((a, b) => {
        const aIsSameSubSection = a.subSections.some(ss => ss.id === request.sub_section_id);
        const bIsSameSubSection = b.subSections.some(ss => ss.id === request.sub_section_id);

        if (aIsSameSubSection && !bIsSameSubSection) return -1;
        if (!aIsSameSubSection && bIsSameSubSection) return 1;
        if (a.type === 'bulanan' && b.type === 'harian') return -1;
        if (a.type === 'harian' && b.type === 'bulanan') return 1;
        if (a.type === 'harian' && b.type === 'harian') {
            if (a.working_day_weight > b.working_day_weight) return -1;
            if (a.working_day_weight < b.working_day_weight) return 1;
        }
        if (a.calculated_rating > b.calculated_rating) return -1;
        if (a.calculated_rating < b.calculated_rating) return 1;
        if (a.schedules_count < b.schedules_count) return -1;
        if (a.schedules_count > b.schedules_count) return 1;
        return 0;
    });

    // Initial selection
    const initialSelectedEmployees = allSortedEligibleEmployees.slice(0, request.requested_amount);
    const initialSelectedEmployeeIds = initialSelectedEmployees.map((emp) => emp.id);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedEmployeeIds,
    });

    const [showModal, setShowModal] = useState(false);
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);
    const [backendError, setBackendError] = useState(null);

    // Calculate gender statistics
    const genderStats = data.employee_ids.reduce((stats, id) => {
        const employee = allSortedEligibleEmployees.find(e => e.id === id);
        if (employee) {
            stats.total++;
            stats[employee.gender]++;
            stats[`${employee.gender}_${employee.type}`]++;
        }
        return stats;
    }, {
        total: 0,
        male: 0,
        female: 0,
        male_bulanan: 0,
        male_harian: 0,
        female_bulanan: 0,
        female_harian: 0
    });

    useEffect(() => {
        const newSelectedEmployees = allSortedEligibleEmployees.slice(0, request.requested_amount);
        setData('employee_ids', newSelectedEmployees.map((emp) => emp.id));
        setBackendError(null);
    }, [allSortedEligibleEmployees, request.requested_amount]);

    useEffect(() => {
        if (errors.fulfillment_error) {
            setBackendError(errors.fulfillment_error);
        } else {
            setBackendError(null);
        }
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setBackendError(null);

        if (data.employee_ids.length !== request.requested_amount) {
            alert(`You must select exactly ${request.requested_amount} employees`);
            return;
        }

        post(route('manpower-requests.fulfill.store', request.id), {
            onSuccess: () => router.visit(route('manpower-requests.index')),
            onError: (errors) => {
                if (errors.fulfillment_error) setBackendError(errors.fulfillment_error);
            }
        });
    };

    const openChangeModal = (index) => {
        setChangingEmployeeIndex(index);
        setShowModal(true);
    };

    const selectNewEmployee = (newEmployeeId) => {
        if (changingEmployeeIndex !== null) {
            const currentIds = [...data.employee_ids];
            if (currentIds.includes(newEmployeeId)) {
                alert('Employee already selected');
                return;
            }
            currentIds[changingEmployeeIndex] = newEmployeeId;
            setData('employee_ids', currentIds);
            setShowModal(false);
        }
    };

    const getEmployeeDetails = (id) => {
        return allSortedEligibleEmployees.find(emp => emp.id === id);
    };

    if (request.status === 'fulfilled') {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-xl text-gray-800">Request Fulfilled</h2>}
            >
                <div className="bg-white shadow-md mx-auto mt-6 p-4 rounded-lg max-w-4xl text-center">
                    <p className="mb-3 font-bold text-green-600 text-lg">Request already fulfilled</p>
                    <button
                        onClick={() => router.visit(route('manpower-requests.index'))}
                        className="bg-blue-600 hover:bg-blue-700 mt-4 px-4 py-2 rounded-lg text-white"
                    >
                        Back to List
                    </button>
                </div>
            </AuthenticatedLayout>
        );
    }

    const totalSameSubSection = sameSubSectionEmployees.length;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800">Fulfill Manpower Request</h2>}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                {/* Request Details */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Request Details</h3>
                    <p><strong>Date:</strong> {dayjs(request.date).format('DD MMMM YYYY')}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Requested Amount:</strong> {request.requested_amount}</p>
                </div>

                {/* Gender Statistics */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Gender Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-sm text-blue-800">Total Selected</p>
                            <p className="text-xl font-bold">{genderStats.total}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">Male</p>
                            <p className="text-xl font-bold">{genderStats.male}</p>
                        </div>
                        <div className="bg-pink-100 p-3 rounded-lg border border-pink-200">
                            <p className="text-sm text-pink-900">Female</p>
                            <p className="text-xl font-bold">{genderStats.female}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-sm">Male Bulanan: {genderStats.male_bulanan}</p>
                            <p className="text-sm">Female Bulanan: {genderStats.female_bulanan}</p>
                            <p className="text-sm">Male Harian: {genderStats.male_harian}</p>
                            <p className="text-sm">Female Harian: {genderStats.female_harian}</p>
                        </div>
                    </div>
                </div>

                {backendError && (
                    <div className="bg-red-100 mb-4 p-3 border border-red-400 rounded-lg text-red-700">
                        <p>{backendError}</p>
                    </div>
                )}

                {totalSameSubSection < request.requested_amount && (
                    <div className="bg-yellow-100 mb-4 p-3 border border-yellow-400 rounded-lg text-yellow-700">
                        <p>Only {totalSameSubSection} employees from the same sub-section available</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Selected Employees</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = data.employee_ids[index];
                                const employee = getEmployeeDetails(employeeId);
                                const isEmptySlot = !employeeId;
                                const employeeSubSection = employee?.subSections?.find(ss => ss.id === request.sub_section_id) || employee?.subSections?.[0];

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
                                                <strong>{isEmptySlot ? `Slot ${index + 1} Empty` : employee?.name}</strong> ({employee?.nik})
                                                {employee && (
                                                    <div className="mt-1 text-gray-500 text-xs">
                                                        <span className={`inline-block px-1 rounded ${employee.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                            {employee.gender === 'male' ? 'Male' : 'Female'}
                                                        </span>
                                                        <span> | Type: {employee.type}</span>
                                                        <span> | Sub: {employeeSubSection?.name}</span>
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openChangeModal(index)}
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            {isEmptySlot ? 'Select' : 'Change'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg text-white"
                    >
                        {processing ? 'Saving...' : 'Submit Request'}
                    </button>
                </form>

                {/* Employee Selection Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <div className="p-6">
                                <h3 className="text-xl font-bold mb-4">Select Employee</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {allSortedEligibleEmployees.map(emp => {
                                        const isSelected = data.employee_ids.includes(emp.id);
                                        const empSubSection = emp.subSections?.find(ss => ss.id === request.sub_section_id);
                                        
                                        return (
                                            <button
                                                key={emp.id}
                                                onClick={() => !isSelected && selectNewEmployee(emp.id)}
                                                disabled={isSelected}
                                                className={`text-left p-3 rounded-md border ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'}`}
                                            >
                                                <div className="flex justify-between">
                                                    <strong>{emp.name}</strong>
                                                    <span className={`text-xs px-1 rounded ${emp.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                        {emp.gender}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <p>NIK: {emp.nik}</p>
                                                    <p>Type: {emp.type}</p>
                                                    <p>Sub: {empSubSection?.name || 'Other'}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 bg-gray-200 rounded-lg"
                                    >
                                        Cancel
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