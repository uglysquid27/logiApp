import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

export default function Fulfill({ request, sameSubSectionEmployees, otherSubSectionEmployees, message }) {
    // 'sameSubSectionEmployees' dan 'otherSubSectionEmployees' sekarang berisi karyawan yang memenuhi syarat,
    // sudah diprioritaskan oleh backend.

    // === Logika Pemilihan Awal: Hanya isi otomatis dari sub-bagian yang sama ===
    let selectedEmployeesInitial = sameSubSectionEmployees.slice(0, request.requested_amount);
    const initialSelectedEmployeeIds = selectedEmployeesInitial.map((emp) => emp.id);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedEmployeeIds,
    });

    const [showModal, setShowModal] = useState(false);
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);
    const [backendError, setBackendError] = useState(null);

    // Effect untuk memperbarui form data jika daftar karyawan awal berubah (misalnya, setelah refresh)
    useEffect(() => {
        // Hanya inisialisasi dari sameSubSectionEmployees untuk pengisian otomatis
        let newSelectedEmployees = sameSubSectionEmployees.slice(0, request.requested_amount);
        setData('employee_ids', newSelectedEmployees.map((emp) => emp.id));
        setBackendError(null);
    }, [sameSubSectionEmployees, request.requested_amount]); // Bergantung hanya pada sameSubSectionEmployees

    // Effect untuk menangkap error backend yang diteruskan via Inertia's errors prop
    useEffect(() => {
        if (errors.fulfillment_error) {
            setBackendError(errors.fulfillment_error);
        } else {
            setBackendError(null);
        }
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form dikirim dengan data:', data);
        setBackendError(null); // Bersihkan error backend sebelumnya saat mencoba pengiriman baru

        // Client-side validation: ensure at least one employee is selected if requested amount > 0
        if (request.requested_amount > 0 && data.employee_ids.length === 0) {
            alert('Setidaknya satu karyawan harus dipilih untuk memenuhi permintaan ini.');
            return;
        }

        post(route('manpower-requests.fulfill.store', request.id), {
            onSuccess: () => {
                console.log('Form berhasil dikirim!');
                router.visit(route('manpower-requests.index'));
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

    // Fungsi untuk membuka modal dan mengatur indeks karyawan yang akan diubah
    const openChangeModal = (index) => {
        console.log('Membuka modal untuk index:', index);
        setChangingEmployeeIndex(index);
        setShowModal(true);
    };

    // Fungsi untuk menangani pemilihan karyawan baru dari modal
    const selectNewEmployee = (newEmployeeId) => {
        console.log('Memilih karyawan baru dengan ID:', newEmployeeId);

        if (changingEmployeeIndex !== null) {
            const currentEmployeeIds = [...data.employee_ids];
            const oldEmployeeId = currentEmployeeIds[changingEmployeeIndex];

            // Periksa apakah karyawan baru sudah dipilih di slot lain dalam form INI
            if (currentEmployeeIds.includes(newEmployeeId) && newEmployeeId !== oldEmployeeId) {
                alert('Karyawan ini sudah dipilih untuk slot lain.');
                return;
            }

            // Jika slot kosong yang sedang diisi
            if (changingEmployeeIndex >= data.employee_ids.length) {
                const newEmployeeIds = [...data.employee_ids, newEmployeeId];
                setData('employee_ids', newEmployeeIds);
            } else {
                currentEmployeeIds[changingEmployeeIndex] = newEmployeeId;
                setData('employee_ids', currentEmployeeIds);
            }

            setShowModal(false);
            setChangingEmployeeIndex(null);
        }
    };

    // Helper untuk mendapatkan detail karyawan berdasarkan ID untuk tampilan
    const getEmployeeDetails = (id) => {
        return sameSubSectionEmployees.find(emp => emp.id === id) ||
               otherSubSectionEmployees.find(emp => emp.id === id);
    };

    // Jika request sudah terpenuhi, tampilkan pesan dan cegah pengiriman form
    if (request.status === 'fulfilled') {
        return (
            <AuthenticatedLayout
                header={<h2 className="font-semibold text-gray-800 text-xl leading-tight">Penuhi Request Man Power</h2>}
            >
                <div className="bg-white shadow-md mx-auto mt-6 p-4 rounded-lg max-w-4xl text-center">
                    <p className="mb-3 font-bold text-green-600 text-lg">Permintaan ini sudah terpenuhi!</p>
                    <p className="text-gray-700">Tidak ada tindakan lebih lanjut yang diperlukan untuk permintaan ini.</p>
                    <button
                        onClick={() => router.visit(route('manpower-requests.index'))}
                        className="bg-blue-600 hover:bg-blue-700 mt-4 px-4 py-2 rounded-lg text-white transition duration-300 ease-in-out"
                    >
                        Kembali ke Daftar Permintaan
                    </button>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Gabungkan kedua daftar karyawan untuk ditampilkan di modal pemilihan
    const allEmployeesForModal = [...sameSubSectionEmployees, ...otherSubSectionEmployees];

    // Hitung total karyawan yang memenuhi syarat dari sub bagian yang sama
    const totalSameSubSectionEligible = sameSubSectionEmployees.length;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-gray-800 text-xl leading-tight">Penuhi Request Man Power</h2>}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                {/* Request Details Card */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Detail Permintaan</h3>
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
                        <div className="bg-red-100 mb-4 p-3 border border-red-400 rounded-lg text-red-700">
                            <p className="font-semibold">Kesalahan Pemenuhan:</p>
                            <p>{backendError}</p>
                        </div>
                    )}

                    {/* Warning: Not enough employees from the same sub-section (and remaining slots are empty) */}
                    {totalSameSubSectionEligible < request.requested_amount && (
                        <div className="bg-yellow-100 mb-4 p-3 border border-yellow-400 rounded-lg text-yellow-700">
                            <p className="font-semibold">Peringatan:</p>
                            <p>Hanya {totalSameSubSectionEligible} karyawan dari **Sub Bagian yang sama** yang tersedia. Anda perlu menambahkan {request.requested_amount - totalSameSubSectionEligible} karyawan lagi secara manual dari sub bagian lain jika diperlukan.</p>
                        </div>
                    )}

                    {/* Automatically Selected Employees Card */}
                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Karyawan Terpilih Otomatis</h3>
                        <p className="mb-4 text-gray-600 text-sm">
                            Sistem telah otomatis memilih karyawan dari sub bagian yang sama dengan prioritas **bulanan** lalu **harian** dengan bobot kerja terendah. Slot kosong dapat diisi secara manual.
                        </p>
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = data.employee_ids[index];
                                const employee = getEmployeeDetails(employeeId);
                                const isEmptySlot = !employeeId;

                                const isDifferentSubSection = employee && employee.sub_section?.id !== request.sub_section_id;

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
                                                <strong>{isEmptySlot ? `Slot ${index + 1} Kosong` : employee?.name || `Slot ${index + 1}`}</strong> ({employee?.nik || 'N/A'})
                                                {employee && (
                                                    <div className="mt-1 text-gray-500 text-xs">
                                                        <span>Sub Section: {employee.sub_section?.name || 'N/A'} {isDifferentSubSection && <span className="font-semibold text-orange-600">(Lain)</span>}</span>
                                                        <span className="ml-2">Tipe: {employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}</span>
                                                        <span className="ml-2">Total Penugasan: {employee.schedules_count !== undefined ? employee.schedules_count : 'N/A'}</span>
                                                        <span className="ml-2">Penugasan Minggu Ini: {employee.schedules_count_weekly !== undefined ? employee.schedules_count_weekly : 'N/A'}</span>
                                                        <span className="ml-2">Rating: {employee.calculated_rating !== undefined ? employee.calculated_rating : 'N/A'}</span>
                                                        {employee.type === 'harian' && (
                                                            <span className="ml-2">Bobot Kerja: {employee.working_day_weight !== undefined ? employee.working_day_weight : 'N/A'}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => openChangeModal(index)}
                                            className="font-semibold text-blue-600 hover:text-blue-800 text-sm"
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
                        disabled={processing || data.employee_ids.length === 0}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-white transition duration-300 ease-in-out disabled:cursor-not-allowed"
                    >
                        {processing ? 'Menyimpan...' : 'Submit Permintaan'}
                    </button>
                </form>
            </div>

            {/* Employee Selection Modal */}
            {showModal && (
                <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-75">
                    <div className="bg-white shadow-xl p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h3 className="mb-4 font-bold text-xl">Pilih Karyawan Baru</h3>
                        <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
                            {allEmployeesForModal.map((emp) => {
                                const isSelected = data.employee_ids.includes(emp.id);
                                const isDisabled = isSelected;
                                const isFromRequestedSubSection = emp.sub_section?.id === request.sub_section_id;

                                let bgColor = 'hover:bg-gray-100';
                                let textColor = 'text-gray-900';
                                if (isSelected) {
                                    bgColor = 'bg-blue-100';
                                    textColor = 'text-blue-700 opacity-70 cursor-not-allowed';
                                } else if (!isFromRequestedSubSection) {
                                    bgColor = 'bg-indigo-50 hover:bg-indigo-100';
                                    textColor = 'text-indigo-800';
                                }

                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => !isDisabled && selectNewEmployee(emp.id)}
                                        className={`block w-full text-left p-3 rounded-md text-sm transition duration-200 ${bgColor} ${textColor}`}
                                        disabled={isDisabled}
                                    >
                                        <strong>{emp.name}</strong> ({emp.nik})
                                        {emp && (
                                            <div className="mt-1 text-gray-500 text-xs">
                                                <span>Sub Section: {emp.sub_section?.name || 'N/A'} {!isFromRequestedSubSection && <span className="font-semibold text-indigo-600">(Lain)</span>}</span>
                                                <span>Tipe: {emp.type ? emp.type.charAt(0).toUpperCase() + emp.type.slice(1) : 'N/A'}</span>
                                                <span className="ml-2">Total Penugasan: {emp.schedules_count !== undefined ? emp.schedules_count : 'N/A'}</span>
                                                <span className="ml-2">Penugasan Minggu Ini: {emp.schedules_count_weekly !== undefined ? emp.schedules_count_weekly : 'N/A'}</span>
                                                <span className="ml-2">Rating: {emp.calculated_rating !== undefined ? emp.calculated_rating : 'N/A'}</span>
                                                {emp.type === 'harian' && (
                                                    <span className="ml-2">Bobot Kerja: {emp.working_day_weight !== undefined ? emp.working_day_weight : 'N/A'}</span>
                                                )}
                                            </div>
                                        )}
                                        {isSelected && <span className="ml-1 text-blue-700 text-xs">(Terpilih)</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg text-gray-800"
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
