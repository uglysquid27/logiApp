import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs'; // Pastikan dayjs diimpor untuk pemformatan tanggal jika diperlukan
import { useState, useEffect } from 'react'; // Impor useState dan useEffect

export default function PermitCreate({ auth, employees, authenticatedEmployee }) { // Tambahkan authenticatedEmployee
    const { data, setData, post, processing, errors } = useForm({
        employee_id: authenticatedEmployee ? authenticatedEmployee.id : '',
        permit_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        photo: null, // Tambahkan ini untuk file foto (awalnya null)
    });

    const [isSickPermit, setIsSickPermit] = useState(data.permit_type === 'sakit');

    // Perbarui state isSickPermit ketika permit_type berubah
    useEffect(() => {
        setIsSickPermit(data.permit_type === 'sakit');
        // Jika berubah dari 'sakit', kosongkan nilai foto
        if (data.permit_type !== 'sakit' && data.photo !== null) {
            setData('photo', null);
        }
    }, [data.permit_type]);


    // Opsi untuk permit_type, sesuai dengan ENUM database Anda
    const permitTypes = [
        { value: '', label: 'Pilih Tipe Izin' },
        { value: 'sakit', label: 'Sakit' },
        { value: 'cuti', label: 'Cuti' },
        { value: 'izin_khusus', label: 'Izin Khusus' },
        { value: 'lainnya', label: 'Lainnya' },
    ];

    const submit = (e) => {
        e.preventDefault();

        // Buat salinan data form untuk dimodifikasi sebelum dikirim
        let payload = { ...data };

        // Logika untuk mengisi end_date jika kosong, sama dengan start_date
        if (!payload.end_date) {
            payload.end_date = payload.start_date;
        }

        console.log('Mengirim data izin:', payload);
        // PENTING: Untuk mengirim file, Inertia secara otomatis akan mengirim sebagai FormData
        // Anda mungkin perlu menambahkan `forceFormData: true` jika menghadapi masalah,
        // tetapi biasanya Inertia menanganinya secara otomatis ketika ada objek File di data.
        post(route('permits.store'), {
            data: payload, // Kirim payload yang telah dimodifikasi
            forceFormData: true, // Pastikan ini true untuk upload file
            onSuccess: () => {
                console.log('Izin berhasil diajukan!');
                router.visit(route('employee.permits.index')); // Redirect ke daftar izin (gunakan 'employee.permits.index' sesuai diskusi sebelumnya)
            },
            onError: (err) => {
                console.error('Ada kesalahan saat mengajukan izin:', err);
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
                            {/* PENTING: Tambahkan encType="multipart/form-data" pada form */}
                            <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
                                {/* Employee Select */}
                                <div>
                                    <InputLabel htmlFor="employee_id" value="Karyawan" />
                                    <select
                                        id="employee_id"
                                        name="employee_id"
                                        value={data.employee_id}
                                        className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                        onChange={(e) => setData('employee_id', e.target.value)}
                                        disabled={!!authenticatedEmployee} // Nonaktifkan jika ada authenticatedEmployee
                                        required
                                    >
                                        {!authenticatedEmployee && <option value="">Pilih Karyawan</option>}
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.name} ({employee.nik})
                                            </option>
                                        ))}
                                    </select>
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

                                {/* Input File untuk Foto Surat Dokter (Kondisional) */}
                                {isSickPermit && ( // Hanya tampilkan jika permit_type adalah 'sakit'
                                    <div>
                                        <InputLabel htmlFor="photo" value="Ambil Foto Surat Dokter (Wajib untuk tipe Sakit)" />
                                        <input
                                            id="photo"
                                            type="file"
                                            name="photo"
                                            // Membatasi tipe file yang diterima ke gambar
                                            accept="image/*"
                                            // Menambahkan atribut capture agar browser memberikan opsi kamera/galeri
                                            capture="user" // 'user' untuk kamera depan, 'environment' untuk kamera belakang, atau kosong untuk default
                                            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                                            onChange={(e) => setData('photo', e.target.files[0])} // Mengambil file pertama
                                            required={isSickPermit} // Wajib jika isSickPermit true
                                        />
                                        <p className="mt-1 text-sm text-gray-500">
                                            Tekan untuk membuka opsi kamera atau memilih dari galeri Anda.
                                        </p>
                                        {/* Menampilkan pesan error khusus untuk foto, jika ada */}
                                        {errors.photo && <InputError message={errors.photo} className="mt-2" />}
                                    </div>
                                )}

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
