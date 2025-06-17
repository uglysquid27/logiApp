import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs'; // Make sure dayjs is imported for date formatting if needed

export default function PermitCreate({ auth, employees, authenticatedEmployee }) { // Tambahkan authenticatedEmployee
    const { data, setData, post, processing, errors } = useForm({
        // Set nilai awal employee_id berdasarkan authenticatedEmployee atau string kosong
        employee_id: authenticatedEmployee ? authenticatedEmployee.id : '',
        permit_type: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    // Options for permit_type, matching your database ENUM
    const permitTypes = [
        { value: '', label: 'Pilih Tipe Izin' },
        { value: 'sakit', label: 'Sakit' },
        { value: 'cuti', label: 'Cuti' },
        { value: 'izin_khusus', label: 'Izin Khusus' },
        { value: 'lainnya', label: 'Lainnya' },
    ];

    const submit = (e) => {
        e.preventDefault();
        console.log('Mengirim data izin:', data);
        post(route('permits.store'), {
            onSuccess: () => {
                console.log('Izin berhasil diajukan!');
                router.visit(route('permits.index')); // Redirect ke daftar izin
            },
            onError: (err) => {
                console.error('Ada kesalahan saat mengajukan izin:', err);
                // Errors from backend will automatically populate the 'errors' object from useForm
            },
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Ajukan Izin Baru</h2>}
        >
            <Head title="Ajukan Izin" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <form onSubmit={submit} className="space-y-6">
                                {/* Employee Select */}
                                <div>
                                    <InputLabel htmlFor="employee_id" value="Karyawan" />
                                    {/* Select input for employee_id */}
                                    <select
                                        id="employee_id"
                                        name="employee_id"
                                        value={data.employee_id}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                        // Nonaktifkan jika ada authenticatedEmployee
                                        disabled={!!authenticatedEmployee}
                                        required
                                    >
                                        {/* Tampilkan opsi "Pilih Karyawan" hanya jika tidak ada authenticatedEmployee */}
                                        {!authenticatedEmployee && <option value="">Pilih Karyawan</option>}
                                        {/* Map melalui daftar karyawan. Jika ada authenticatedEmployee, pastikan dia yang pertama */}
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} ({employee.nik})
                                            </option>
                                        ))}
                                    </select>
                                    {/* Tampilkan nama karyawan yang terpilih jika input dinonaktifkan */}
                                    {authenticatedEmployee && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            Izin ini akan diajukan untuk: <strong>{authenticatedEmployee.name}</strong> ({authenticatedEmployee.nik})
                                        </p>
                                    )}
                                    <InputError message={errors.employee_id} className="mt-2" />
                                </div>

                                {/* Permit Type Select */}
                                <div>
                                    <InputLabel htmlFor="permit_type" value="Tipe Izin" />
                                    <select
                                        id="permit_type"
                                        name="permit_type"
                                        value={data.permit_type}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('permit_type', e.target.value)}
                                        required
                                    >
                                        {permitTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.permit_type} className="mt-2" />
                                </div>

                                {/* Start Date Input */}
                                <div>
                                    <InputLabel htmlFor="start_date" value="Tanggal Mulai" />
                                    <TextInput
                                        id="start_date"
                                        type="date"
                                        name="start_date"
                                        value={data.start_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('start_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.start_date} className="mt-2" />
                                </div>

                                {/* End Date Input */}
                                <div>
                                    <InputLabel htmlFor="end_date" value="Tanggal Selesai (Opsional)" />
                                    <TextInput
                                        id="end_date"
                                        type="date"
                                        name="end_date"
                                        value={data.end_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('end_date', e.target.value)}
                                    />
                                    <InputError message={errors.end_date} className="mt-2" />
                                </div>

                                {/* Reason Textarea */}
                                <div>
                                    <InputLabel htmlFor="reason" value="Alasan" />
                                    <textarea
                                        id="reason"
                                        name="reason"
                                        value={data.reason}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('reason', e.target.value)}
                                        rows="4"
                                        required
                                    ></textarea>
                                    <InputError message={errors.reason} className="mt-2" />
                                </div>

                                <div className="flex items-center justify-end mt-4">
                                    <PrimaryButton className="ms-4" disabled={processing}>
                                        {processing ? 'Mengajukan...' : 'Ajukan Izin'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
