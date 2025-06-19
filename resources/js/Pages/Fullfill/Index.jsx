import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import dayjs from 'dayjs';
import { router } from '@inertiajs/react';

export default function Fulfill({ request, sameSubSectionEmployees, otherSubSectionEmployees, message }) {
    // --- CONSOLE LOG START ---
    console.log('Fulfill Component Rendered');
    console.log('Request Data:', request);
    console.log('Same Sub Section Employees (Raw Prop):', sameSubSectionEmployees);
    console.log('Other Sub Section Employees (Raw Prop):', otherSubSectionEmployees);
    // --- CONSOLE LOG END ---

    // Gabungkan dan pastikan properti 'subSections' di frontend
    // merujuk ke 'sub_sections_data' dari backend.
    // Lakukan penggabungan dan transformasi data di awal
    const combinedEmployees = [
        ...sameSubSectionEmployees.map(emp => ({ ...emp, subSections: emp.sub_sections_data || [] })),
        ...otherSubSectionEmployees.map(emp => ({ ...emp, subSections: emp.sub_sections_data || [] }))
    ];

    // --- NEW SORTING LOGIC START ---
    const allSortedEligibleEmployees = combinedEmployees.sort((a, b) => {
        // 1. Prioritaskan karyawan dari sub bagian yang sama dengan permintaan
        const aIsSameSubSection = a.subSections.some(ss => ss.id === request.sub_section_id);
        const bIsSameSubSection = b.subSections.some(ss => ss.id === request.sub_section_id);

        if (aIsSameSubSection && !bIsSameSubSection) return -1;
        if (!aIsSameSubSection && bIsSameSubSection) return 1;

        // 2. Prioritaskan 'bulanan' sebelum 'harian'
        if (a.type === 'bulanan' && b.type === 'harian') return -1;
        if (a.type === 'harian' && b.type === 'bulanan') return 1;

        // 3. Jika keduanya 'harian', prioritaskan 'bobot kerja' tertinggi
        if (a.type === 'harian' && b.type === 'harian') {
            // Asumsi working_day_weight lebih tinggi lebih baik
            if (a.working_day_weight > b.working_day_weight) return -1;
            if (a.working_day_weight < b.working_day_weight) return 1;
        }

        // 4. Jika keduanya 'bulanan' atau jika bobot kerja sama, prioritaskan rating tertinggi
        if (a.calculated_rating > b.calculated_rating) return -1;
        if (a.calculated_rating < b.calculated_rating) return 1;

        // 5. Jika rating sama, prioritaskan schedules_count terendah (paling sedikit penugasan minggu ini)
        if (a.schedules_count < b.schedules_count) return -1;
        if (a.schedules_count > b.schedules_count) return 1;

        // Jika semua kriteria sama, jaga urutan asli (atau urutan stabil jika tidak ada perubahan)
        return 0;
    });
    // --- NEW SORTING LOGIC END ---

    // --- CONSOLE LOG START ---
    console.log('All Sorted Eligible Employees (After Frontend Transformation & Sorting):', allSortedEligibleEmployees);
    // --- CONSOLE LOG END ---

    const initialSelectedEmployees = allSortedEligibleEmployees.slice(0, request.requested_amount);
    const initialSelectedEmployeeIds = initialSelectedEmployees.map((emp) => emp.id);

    const { data, setData, post, processing, errors } = useForm({
        employee_ids: initialSelectedEmployeeIds,
    });

    const [showModal, setShowModal] = useState(false);
    const [changingEmployeeIndex, setChangingEmployeeIndex] = useState(null);
    const [backendError, setBackendError] = useState(null);

    useEffect(() => {
        // Ketika props karyawan berubah, perbarui data form
        // Gunakan allSortedEligibleEmployees yang sudah diurutkan
        const newSelectedEmployees = allSortedEligibleEmployees.slice(0, request.requested_amount);
        setData('employee_ids', newSelectedEmployees.map((emp) => emp.id));
        setBackendError(null); // Reset backend error on prop change
    }, [allSortedEligibleEmployees, request.requested_amount]); // Dependencies untuk useEffect

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
        setBackendError(null);

        if (data.employee_ids.length !== request.requested_amount) {
            alert(`Anda harus memilih tepat ${request.requested_amount} karyawan untuk memenuhi permintaan ini.`);
            return;
        }
        if (data.employee_ids.some(id => id === null || id === undefined)) {
             alert('Beberapa slot karyawan masih kosong. Silakan isi semua slot yang diperlukan.');
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

    const openChangeModal = (index) => {
        console.log('Membuka modal untuk index:', index);
        setChangingEmployeeIndex(index);
        setShowModal(true);
    };

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

    const getEmployeeDetails = (id) => {
        return allSortedEligibleEmployees.find(emp => emp.id === id);
    };

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

    // `allEmployeesForModal` juga dibuat langsung dari props
    const allEmployeesForModal = allSortedEligibleEmployees; // Modal juga harus menggunakan data yang sudah disortir
    const totalSameSubSectionEligible = sameSubSectionEmployees.length;

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-gray-800 text-xl leading-tight">Penuhi Request Man Power</h2>}
        >
            <div className="mx-auto mt-6 max-w-4xl">
                {/* Request Details Card */}
                <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                    <h3 className="mb-3 font-bold text-lg">Detail Permintaan</h3>
                    <p><strong>Tanggal:</strong> {dayjs(request.date).format('DD MMMM YYYY')}</p> {/* Corrected format string */}
                    <p><strong>Sub Section:</strong> {request.sub_section?.name}</p>
                    <p><strong>Section:</strong> {request.sub_section?.section?.name}</p>
                    <p><strong>Shift:</strong> {request.shift?.name}</p>
                    <p><strong>Jumlah Diminta:</strong> {request.requested_amount}</p>
                    {request.notes && <p><strong>Catatan:</strong> {request.notes}</p>}
                </div>

                <form onSubmit={handleSubmit}>
                    {errors.employee_ids && (
                        <div className="mb-4 text-red-600 text-sm">{errors.employee_ids}</div>
                    )}
                    {backendError && (
                        <div className="bg-red-100 mb-4 p-3 border border-red-400 rounded-lg text-red-700">
                            <p className="font-semibold">Kesalahan Pemenuhan:</p>
                            <p>{backendError}</p>
                        </div>
                    )}

                    {totalSameSubSectionEligible < request.requested_amount && (
                        <div className="bg-yellow-100 mb-4 p-3 border border-yellow-400 rounded-lg text-yellow-700">
                            <p className="font-semibold">Peringatan:</p>
                            <p>Hanya {totalSameSubSectionEligible} karyawan dari **Sub Bagian yang sama** yang tersedia. Sistem telah mengisi sisa slot dari sub bagian lain.</p>
                        </div>
                    )}

                    <div className="bg-white shadow-md mb-6 p-4 rounded-lg">
                        <h3 className="mb-3 font-bold text-lg">Karyawan Terpilih Otomatis</h3>
                        <p className="mb-4 text-gray-600 text-sm">
                            Sistem telah otomatis memilih karyawan sesuai jumlah diminta, memprioritaskan dari sub bagian yang sama, lalu dari sub bagian lain, dengan prioritas **bulanan** lalu **harian** dengan bobot kerja tertinggi, kemudian rating, dan penugasan terendah.
                        </p>
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                            {Array.from({ length: request.requested_amount }).map((_, index) => {
                                const employeeId = data.employee_ids[index];
                                const employee = getEmployeeDetails(employeeId);
                                const isEmptySlot = !employeeId;

                                // Cari sub_section yang cocok dengan request.sub_section_id, jika tidak ada, ambil yang pertama
                                const employeeSubSection = employee?.subSections?.find(ss => ss.id === request.sub_section_id) || employee?.subSections?.[0];
                                const isDifferentSubSection = employeeSubSection && employeeSubSection.id !== request.sub_section_id;

                                // --- CONSOLE LOG START ---
                                console.log(`Employee (Slot ${index + 1}):`, employee);
                                if (employee) {
                                    console.log(`  Employee ID: ${employee.id}, Name: ${employee.name}`);
                                    console.log(`  Employee sub_sections_data (direct from prop):`, employee.sub_sections_data);
                                    console.log(`  Employee subSections (after frontend processing):`, employee.subSections);
                                    console.log(`  Displayed Sub Section:`, employeeSubSection);
                                    console.log(`  Displayed Section (via Sub Section):`, employeeSubSection?.section);
                                }
                                // --- CONSOLE LOG END ---

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
                                                        <span>Sub Section: {employeeSubSection?.name || 'N/A'} {isDifferentSubSection && <span className="font-semibold text-orange-600">(Lain)</span>}</span>
                                                        {employeeSubSection?.section?.name && (
                                                            <span className="ml-2">Section: {employeeSubSection.section.name}</span>
                                                        )}
                                                        <span className="ml-2">Tipe: {employee.type ? employee.type.charAt(0).toUpperCase() + employee.type.slice(1) : 'N/A'}</span>
                                                        <span className="ml-2">Penugasan Minggu Ini: {employee.schedules_count !== undefined ? employee.schedules_count : 'N/A'}</span>
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
                        disabled={processing || data.employee_ids.length !== request.requested_amount || data.employee_ids.some(id => id === null || id === undefined)}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg text-white transition duration-300 ease-in-out disabled:cursor-not-allowed"
                    >
                        {processing ? 'Menyimpan...' : 'Submit Permintaan'}
                    </button>
                </form>
            </div>

            {/* Employee Selection Modal */}
            {showModal && (
                <div className="z-50 fixed inset-0 flex justify-center items-center bg-gray-600 bg-opacity-75">
                    <div className="bg-white shadow-xl p-6 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto"> {/* Changed max-w-md to max-w-4xl */}
                        <h3 className="mb-4 font-bold text-xl">Pilih Karyawan Baru</h3>
                        <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"> {/* Added more grid columns */}
                            {allEmployeesForModal.map((emp) => {
                                const isSelected = data.employee_ids.includes(emp.id);
                                const isDisabled = isSelected;
                                const empSubSection = emp?.subSections?.find(ss => ss.id === request.sub_section_id) || emp?.subSections?.[0];
                                const isFromRequestedSubSection = empSubSection && empSubSection.id === request.sub_section_id;

                                let bgColor = 'hover:bg-gray-100';
                                let textColor = 'text-gray-900';
                                if (isSelected) {
                                    bgColor = 'bg-blue-100';
                                    textColor = 'text-blue-700 opacity-70 cursor-not-allowed';
                                } else if (!isFromRequestedSubSection) {
                                    // Menggunakan warna yang lebih kontras: pink
                                    bgColor = 'bg-pink-100 hover:bg-pink-200';
                                    textColor = 'text-pink-800';
                                }

                                // --- CONSOLE LOG START ---
                                console.log(`Employee (Modal):`, emp);
                                if (emp) {
                                    console.log(`  Employee ID (Modal): ${emp.id}, Name: ${emp.name}`);
                                    console.log(`  Employee sub_sections_data (direct from prop Modal):`, emp.sub_sections_data);
                                    console.log(`  Employee subSections (after frontend processing Modal):`, emp.subSections);
                                    console.log(`  Displayed Sub Section (Modal):`, empSubSection);
                                    console.log(`  Displayed Section (via Sub Section Modal):`, empSubSection?.section);
                                }
                                // --- CONSOLE LOG END ---

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
                                                <span>Sub Section: {empSubSection?.name || 'N/A'} {!isFromRequestedSubSection && <span className="font-semibold text-indigo-600">(Lain)</span>}</span>
                                                {empSubSection?.section?.name && (
                                                    <span className="ml-2">Section: {empSubSection.section.name}</span>
                                                )}
                                                <span>Tipe: {emp.type ? emp.type.charAt(0).toUpperCase() + emp.type.slice(1) : 'N/A'}</span>
                                                <span className="ml-2">Penugasan Minggu Ini: {emp.schedules_count !== undefined ? emp.schedules_count : 'N/A'}</span>
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