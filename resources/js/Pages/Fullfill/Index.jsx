import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Fulfill({ request, employees }) {
    // Sort employees by working_day_weight in ascending order (lower weight = higher priority)
    const sortedEmployees = [...employees].sort((a, b) => {
        // Handle cases where working_day_weight might be undefined or null
        const weightA = a.working_day_weight !== undefined ? a.working_day_weight : Infinity;
        const weightB = b.working_day_weight !== undefined ? b.working_day_weight : Infinity;
        return weightA - weightB;
    });

    // Take the top 'requested_amount' employees from the sorted list
    const initialSelectedEmployees = sortedEmployees.slice(0, request.requested_amount);
    const initialSelectedEmployeeIds = initialSelectedEmployees.map((emp) => emp.id);

    const { data, setData, post, processing } = useForm({
        employee_ids: initialSelectedEmployeeIds, // Automatically select on initial load
    });

    // State for modal
    const [showModal, setShowModal] = useState(false);
    // State to track which slot (index in data.employee_ids) is being changed
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form dikirim dengan data:', data);
        post(route('manpower-requests.fulfill.store', request.id));
    };

    // Function to open the modal and set the index of the employee to change
    const openChangeModal = (index) => {
        console.log('Membuka modal untuk index:', index);
        setChangingEmployeeIndex(index);
        setShowModal(true);
    };

    // Function to handle selecting a new employee from the modal
    const selectNewEmployee = (newEmployeeId) => {
        console.log('Memilih karyawan baru dengan ID:', newEmployeeId);

        if (changingEmployeeIndex !== null) {
            const currentEmployeeIds = [...data.employee_ids];
            const oldEmployeeId = currentEmployeeIds[changingEmployeeIndex];

            if (currentEmployeeIds.includes(newEmployeeId) && newEmployeeId !== oldEmployeeId) {
                alert('Karyawan ini sudah dipilih untuk slot lain.');
                return;
            }

            currentEmployeeIds[changingEmployeeIndex] = newEmployeeId;
            setData('employee_ids', currentEmployeeIds);
            setShowModal(false);
            setChangingEmployeeIndex(null);
        }
    };

    // Helper to get employee details by ID for display
    const getEmployeeDetails = (id) => employees.find(emp => emp.id === id);
    console.log(employees)

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Penuhi Request Man Power</h2>}
        >
            <div className="max-w-4xl mx-auto mt-6">
                {/* Request Details Card */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-3">Detail Permintaan</h3>
                    <p><strong>Tanggal:</strong> {request.date}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Section:</strong> {request.sub_section?.section?.name}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Automatically Selected Employees Card */}
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-3">Karyawan Terpilih Otomatis (Prioritas Tertinggi)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.employee_ids.map((employeeId, index) => {
                                const employee = getEmployeeDetails(employeeId);
                                return (
                                    <div key={index} className="bg-gray-100 p-3 rounded-md flex justify-between items-center space-x-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={true} // Always checked as they are selected
                                                readOnly
                                                className="form-checkbox h-5 w-5 text-green-600"
                                            />
                                            <span>
                                                <strong>{employee?.name || 'N/A'}</strong> ({employee?.nik || 'N/A'})
                                                {/* Display schedules_count, calculated_rating, and working_day_weight */}
                                                {employee && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <span>Penugasan Minggu Ini: {employee.schedules_count !== undefined ? employee.schedules_count : 'N/A'}</span>
                                                        <span className="ml-2">Rating: {employee.calculated_rating !== undefined ? employee.calculated_rating : 'N/A'}</span>
                                                        <span className="ml-2">Bobot: {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}</span>
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openChangeModal(index)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                                        >
                                            Ubah
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out"
                    >
                        {processing ? 'Menyimpan...' : 'Submit Permintaan'}
                    </button>
                </form>
            </div>

            {/* Employee Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Pilih Karyawan Baru</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {/* Sort employees in the modal by weight as well, for consistent display */}
                            {sortedEmployees.map((emp) => {
                                const isSelected = data.employee_ids.includes(emp.id);
                                const isAssigned = emp.status === 'assigned'; // Assuming 'assigned' status means already taken
                                const isDisabled = isSelected || isAssigned;

                                let bgColor = 'hover:bg-gray-100';
                                if (isSelected) {
                                    bgColor = 'bg-blue-100 text-blue-700 opacity-70 cursor-not-allowed';
                                } else if (isAssigned) {
                                    bgColor = 'bg-red-100 text-red-700 opacity-70 cursor-not-allowed';
                                }

                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => !isDisabled && selectNewEmployee(emp.id)}
                                        className={`block w-full text-left p-3 rounded-md text-sm transition duration-200 ${bgColor}`}
                                        disabled={isDisabled}
                                    >
                                        <strong>{emp.name}</strong> ({emp.nik})
                                        {/* Display schedules_count, calculated_rating, and working_day_weight */}
                                        {emp && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span>Penugasan Minggu Ini: {emp.schedules_count !== undefined ? emp.schedules_count : 'N/A'}</span>
                                                <span className="ml-2">Rating: {emp.calculated_rating !== undefined ? emp.calculated_rating : 'N/A'}</span>
                                                <span className="ml-2">Bobot: {emp.working_day_weight !== undefined ? emp.working_day_weight : 'N/A'}</span>
                                            </div>
                                        )}
                                        {isAssigned && <span className="text-xs ml-1">(Assigned)</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
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
