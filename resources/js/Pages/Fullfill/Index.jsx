import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react'; // Removed useMemo, kept useEffect
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs'; // Import dayjs for date formatting

export default function Fulfill({ request, employees, message }) {
    // The 'employees' prop now comes pre-sorted and filtered from the controller.
    // It already contains only active, relevant sub-section employees,
    // who are NOT already scheduled on the request date,
    // and are prioritized (bulanan first, then harian by working_day_weight).

    // Calculate initial selected employees directly from the pre-sorted 'employees' prop
    // This will take the top 'requested_amount' employees based on the backend's prioritization.
    const initialSelectedEmployeeIds = employees.slice(0, request.requested_amount).map((emp) => emp.id);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedEmployeeIds,
    });

    // State for modal
    const [showModal, setShowModal] = useState(false);
    // State to track which slot (index in data.employee_ids) is being changed
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);

    // State for custom error messages from backend
    const [backendError, setBackendError] = useState(null);

    // Effect to update form data if the initial employees list changes (e.g., after a refresh)
    // This is important if the 'employees' prop itself changes after the component mounts
    useEffect(() => {
        setData('employee_ids', initialSelectedEmployeeIds);
        // Clear backend error when component mounts or props change
        setBackendError(null);
    }, [employees, request.requested_amount]); // Depend on employees and requested_amount

    // Effect to catch backend errors passed via Inertia's errors prop
    useEffect(() => {
        if (errors.fulfillment_error) {
            setBackendError(errors.fulfillment_error);
            // Optionally, you might want to clear specific employee_ids errors
            // if the fulfillment_error is more general.
        } else {
            setBackendError(null);
        }
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form dikirim dengan data:', data);
        setBackendError(null); // Clear previous backend errors on new submission attempt

        post(route('manpower-requests.fulfill.store', request.id), {
            onSuccess: () => {
                console.log('Form berhasil dikirim!');
                // Redirect to index page with success message
                window.location.href = route('manpower-requests.index');
            },
            onError: (formErrors) => {
                console.error('Ada kesalahan saat mengirim form:', formErrors);
                if (formErrors.fulfillment_error) {
                    setBackendError(formErrors.fulfillment_error);
                } else if (formErrors.employee_ids) {
                    alert('Kesalahan penugasan karyawan: ' + formErrors.employee_ids);
                } else {
                    alert('Terjadi kesalahan yang tidak diketahui. Silakan cek konsol.');
                }
            },
            onFinish: () => {
                console.log('Proses pengiriman form selesai.');
            }
        });
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

            // Check if the new employee is already selected in another slot within THIS form
            if (currentEmployeeIds.includes(newEmployeeId) && newEmployeeId !== oldEmployeeId) {
                alert('Karyawan ini sudah dipilih untuk slot lain.');
                return;
            }

            // If it's an empty slot being filled, ensure it's added correctly
            if (changingEmployeeIndex >= data.employee_ids.length) {
                // This means we are filling an empty slot at the end
                const newEmployeeIds = [...data.employee_ids, newEmployeeId];
                setData('employee_ids', newEmployeeIds);
            } else {
                // This means we are replacing an existing employee
                currentEmployeeIds[changingEmployeeIndex] = newEmployeeId;
                setData('employee_ids', currentEmployeeIds);
            }

            setShowModal(false);
            setChangingEmployeeIndex(null);
        }
    };

    // Helper to get employee details by ID for display (from the full 'employees' list passed by controller)
    // 'employees' prop is now the already prioritized and filtered list.
    const getEmployeeDetails = (id) => employees.find(emp => emp.id === id);

    // If request is already fulfilled, display message and prevent form submission
    if (request.status === 'fulfilled') {
        return (
            <AuthenticatedLayout
                header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Penuhi Request Man Power</h2>}
            >
                <div className="max-w-4xl mx-auto mt-6 p-4 bg-white rounded-lg shadow-md text-center">
                    <p className="text-lg font-bold text-green-600 mb-3">Permintaan ini sudah terpenuhi!</p>
                    <p className="text-gray-700">Tidak ada tindakan lebih lanjut yang diperlukan untuk permintaan ini.</p>
                    <button
                        onClick={() => window.location.href = route('manpower-requests.index')}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
                    >
                        Kembali ke Daftar Permintaan
                    </button>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Penuhi Request Man Power</h2>}
        >
            <div className="max-w-4xl mx-auto mt-6">
                {/* Request Details Card */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-3">Detail Permintaan</h3>
                    <p><strong>Tanggal:</strong> {dayjs(request.date).format('DD MMMMYYYY')}</p>
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Section:</strong> {request.sub_section?.section?.name}</p>
                    <p><strong>Shift:</strong> {request.shift?.name}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                    {request.notes && <p><strong>Catatan:</strong> {request.notes}</p>}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Display validation errors if any */}
                    {errors.employee_ids && (
                        <div className="mb-4 text-red-600 text-sm">{errors.employee_ids}</div>
                    )}
                    {backendError && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            <p className="font-semibold">Kesalahan Pemenuhan:</p>
                            <p>{backendError}</p>
                        </div>
                    )}

                    {/* Warning if not enough employees are available to meet the requested amount */}
                    {employees.length < request.requested_amount && (
                        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
                            <p className="font-semibold">Peringatan:</p>
                            <p>Hanya {employees.length} karyawan yang memenuhi syarat dan tersedia untuk ditugaskan, padahal {request.requested_amount} karyawan diminta. Mohon sesuaikan secara manual atau kurangi jumlah permintaan.</p>
                        </div>
                    )}

                    {/* Automatically Selected Employees Card */}
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
                        <h3 className="text-lg font-bold mb-3">Karyawan Terpilih Otomatis (Prioritas Tertinggi)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Map through data.employee_ids, which holds the current selection */}
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = data.employee_ids[index];
                                const employee = getEmployeeDetails(employeeId);
                                const isEmptySlot = !employeeId;

                                return (
                                    <div key={employeeId || `slot-${index}`} className="bg-gray-100 p-3 rounded-md flex justify-between items-center space-x-3">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={!isEmptySlot}
                                                readOnly
                                                className="form-checkbox h-5 w-5 text-green-600"
                                            />
                                            <span>
                                                <strong>{isEmptySlot ? `Slot ${index + 1} Kosong` : employee?.name || `Slot ${index + 1}`}</strong> ({employee?.nik || 'N/A'})
                                                {/* Display employee type (bulanan/harian) and other details */}
                                                {employee && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        <span>Tipe: {employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}</span>
                                                        {/* Assuming schedules_count, schedules_count_weekly, calculated_rating, working_day_weight are loaded with employee model */}
                                                        <span className="ml-2">Total Penugasan: {employee.schedules_count !== undefined ? employee.schedules_count : 'N/A'}</span>
                                                        <span className="ml-2">Penugasan Minggu Ini: {employee.schedules_count_weekly !== undefined ? employee.schedules_count_weekly : 'N/A'}</span>
                                                        <span className="ml-2">Rating: {employee.calculated_rating !== undefined ? employee.calculated_rating : 'N/A'}</span>
                                                        {employee.type === 'harian' && ( // Only show bobot for 'harian'
                                                            <span className="ml-2">Bobot Kerja: {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openChangeModal(index)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
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
                        disabled={processing || data.employee_ids.length === 0} // Disable if no employees selected
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Iterate through ALL eligible employees (pre-sorted from controller) */}
                            {employees.map((emp) => {
                                const isSelected = data.employee_ids.includes(emp.id);
                                const isDisabled = isSelected;

                                let bgColor = 'hover:bg-gray-100';
                                let textColor = 'text-gray-900';
                                if (isSelected) {
                                    bgColor = 'bg-blue-100';
                                    textColor = 'text-blue-700 opacity-70 cursor-not-allowed';
                                }

                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => !isDisabled && selectNewEmployee(emp.id)}
                                        className={`block w-full text-left p-3 rounded-md text-sm transition duration-200 ${bgColor} ${textColor}`}
                                        disabled={isDisabled}
                                    >
                                        <strong>{emp.name}</strong> ({emp.nik})
                                        {/* Display employee type (bulanan/harian) and other details */}
                                        {emp && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span>Tipe: {emp.type ? emp.type.charAt(0).toUpperCase() + emp.type.slice(1) : 'N/A'}</span>
                                                <span className="ml-2">Total Penugasan: {emp.schedules_count !== undefined ? emp.schedules_count : 'N/A'}</span>
                                                <span className="ml-2">Penugasan Minggu Ini: {emp.schedules_count_weekly !== undefined ? emp.schedules_count_weekly : 'N/A'}</span>
                                                <span className="ml-2">Rating: {emp.calculated_rating !== undefined ? emp.calculated_rating : 'N/A'}</span>
                                                {emp.type === 'harian' && (
                                                    <span className="ml-2">Bobot Kerja: {emp.working_day_weight !== undefined ? emp.working_day_weight : 'N/A'}</span>
                                                )}
                                            </div>
                                        )}
                                        {isSelected && <span className="ml-1 text-xs text-blue-700">(Terpilih)</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
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
