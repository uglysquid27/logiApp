import { useForm } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import ToastNotification from '../Components/ToastNotification';

export default function UpdateProfileInformationForm({ employee, className }) {
    const formattedBirthDate = employee.birth_date
        ? format(parseISO(employee.birth_date), 'yyyy-MM-dd')
        : '';

    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        name: employee.name,
        ktp: employee.ktp,
        email: employee.email,
        type: employee.type,
        gender: employee.gender,
        group: employee.group,
        marital: employee.marital,
        birth_date: formattedBirthDate,
        religion: employee.religion,
        phone: employee.phone,
        street: employee.street,
        rt: employee.rt,
        rw: employee.rw,
        kelurahan: employee.kelurahan,
        kecamatan: employee.kecamatan,
        kabupaten_kota: employee.kabupaten_kota,
        provinsi: employee.provinsi || 'Jawa Timur',
        kode_pos: employee.kode_pos,
    });

    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        put(route('employee.employees.update', employee.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccessToast(true);
            },
        });
    };

    return (
        <section className={className}>
            <ToastNotification
                message="Berhasil Memperbarui Profil"
                show={showSuccessToast}
                onClose={() => setShowSuccessToast(false)}
                type="success"
            />

            <header>
                <h2 className="text-lg font-semibold text-gray-800">Profil Karyawan</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Perbarui informasi pribadi dan detail kontak karyawan.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* NIK */}
                <div className="sm:col-span-3">
                    <label htmlFor="nik" className="block text-sm font-medium text-gray-700">
                        NIK <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            id="nik"
                            type="text"
                            value={employee.nik}
                            readOnly
                            className="block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 sm:text-sm py-2 px-3"
                        />
                    </div>
                </div>

                {/* KTP */}
                <div className="sm:col-span-3">
                    <label htmlFor="ktp" className="block text-sm font-medium text-gray-700">
                        Nomor KTP <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                        <input
                            id="ktp"
                            type="text"
                            value={data.ktp}
                            onChange={(e) => {
                                // Only allow numbers and limit to 16 digits
                                const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                setData('ktp', value);
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 pr-12"
                            required
                            maxLength={16}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-xs">
                                {data.ktp ? data.ktp.length : 0}/16
                            </span>
                        </div>
                    </div>
                    {errors.ktp && <p className="mt-1 text-sm text-red-600">{errors.ktp}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                        Masukkan 16 digit nomor KTP
                    </p>
                </div>

                {/* Name */}
                <div className="sm:col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        />
                    </div>
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="sm:col-span-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        />
                    </div>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Type */}
                <div className="sm:col-span-3">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Tipe Karyawan <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <select
                            id="type"
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                            disabled
                        >
                            <option value="harian">Harian</option>
                            <option value="bulanan">Bulanan</option>
                        </select>
                    </div>
                    {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
                </div>

                {/* Gender */}
                <div className="sm:col-span-3">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <select
                            id="gender"
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        >
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                        </select>
                    </div>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* Marital Status */}
                <div className="sm:col-span-3">
                    <label htmlFor="marital" className="block text-sm font-medium text-gray-700">
                        Status Perkawinan
                    </label>
                    <div className="mt-1">
                        <select
                            id="marital"
                            value={data.marital}
                            onChange={(e) => setData('marital', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                            <option value="">Pilih Status</option>
                            <option value="K0">K/O - Nikah, Tanpa Anak</option>
                            <option value="K1">K/1 - Nikah, Anak 1</option>
                            <option value="K2">K/2 - Nikah, Anak 2</option>
                            <option value="K3">K/3 - Nikah, Anak 3</option>
                            <option value="BM">Belum Menikah</option>
                            <option value="TK1">TK/1 - Tidak Nikah, 1 Tanggungan</option>
                            <option value="TK2">TK/2 - Tidak Nikah, 2 Tanggungan</option>
                            <option value="TK3">TK/3 - Tidak Nikah, 3 Tanggungan</option>
                        </select>
                    </div>
                    {errors.marital && <p className="mt-1 text-sm text-red-600">{errors.marital}</p>}
                </div>

                {/* Birth Date */}
                <div className="sm:col-span-3">
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                        Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            id="birth_date"
                            type="date"
                            value={data.birth_date || ''}
                            onChange={(e) => setData('birth_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        />
                    </div>
                    {errors.birth_date && <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>}
                </div>

                {/* Religion */}
                <div className="sm:col-span-3">
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Agama <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <select
                            id="religion"
                            value={data.religion}
                            onChange={(e) => setData('religion', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        >
                            <option value="">Pilih Agama</option>
                            <option value="Islam">Islam</option>
                            <option value="Protestan">Protestan</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                        </select>
                    </div>
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion}</p>}
                </div>

                {/* Phone */}
                <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        />
                    </div>
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Address Fields */}
                <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">
                        Alamat Lengkap
                    </label>
                    <div className="mt-1 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                        {/* Street */}
                        <div className="sm:col-span-6">
                            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                                Jalan/Dusun <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="street"
                                type="text"
                                value={data.street}
                                onChange={(e) => setData('street', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
                        </div>

                        {/* RT/RW */}
                        <div className="sm:col-span-1">
                            <label htmlFor="rt" className="block text-sm font-medium text-gray-700">
                                RT <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="rt"
                                type="text"
                                value={data.rt}
                                onChange={(e) => setData('rt', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.rt && <p className="mt-1 text-sm text-red-600">{errors.rt}</p>}
                        </div>

                        <div className="sm:col-span-1">
                            <label htmlFor="rw" className="block text-sm font-medium text-gray-700">
                                RW <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="rw"
                                type="text"
                                value={data.rw}
                                onChange={(e) => setData('rw', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.rw && <p className="mt-1 text-sm text-red-600">{errors.rw}</p>}
                        </div>

                        {/* Kelurahan/Kecamatan */}
                        <div className="sm:col-span-2">
                            <label htmlFor="kelurahan" className="block text-sm font-medium text-gray-700">
                                Kelurahan/Desa <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="kelurahan"
                                type="text"
                                value={data.kelurahan}
                                onChange={(e) => setData('kelurahan', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.kelurahan && <p className="mt-1 text-sm text-red-600">{errors.kelurahan}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="kecamatan" className="block text-sm font-medium text-gray-700">
                                Kecamatan <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="kecamatan"
                                type="text"
                                value={data.kecamatan}
                                onChange={(e) => setData('kecamatan', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.kecamatan && <p className="mt-1 text-sm text-red-600">{errors.kecamatan}</p>}
                        </div>

                        {/* Kabupaten/Kota */}
                        <div className="sm:col-span-3">
                            <label htmlFor="kabupaten_kota" className="block text-sm font-medium text-gray-700">
                                Kabupaten/Kota <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="kabupaten_kota"
                                type="text"
                                value={data.kabupaten_kota}
                                onChange={(e) => setData('kabupaten_kota', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.kabupaten_kota && <p className="mt-1 text-sm text-red-600">{errors.kabupaten_kota}</p>}
                        </div>

                        {/* Provinsi */}
                        <div className="sm:col-span-2">
                            <label htmlFor="provinsi" className="block text-sm font-medium text-gray-700">
                                Provinsi <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="provinsi"
                                type="text"
                                value={data.provinsi}
                                onChange={(e) => setData('provinsi', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.provinsi && <p className="mt-1 text-sm text-red-600">{errors.provinsi}</p>}
                        </div>

                        {/* Kode Pos */}
                        <div className="sm:col-span-1">
                            <label htmlFor="kode_pos" className="block text-sm font-medium text-gray-700">
                                Kode Pos <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="kode_pos"
                                type="text"
                                value={data.kode_pos}
                                onChange={(e) => setData('kode_pos', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                required
                            />
                            {errors.kode_pos && <p className="mt-1 text-sm text-red-600">{errors.kode_pos}</p>}
                        </div>
                    </div>
                </div>

                <div className="sm:col-span-6 flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                        {recentlySuccessful && (
                            <div className="flex items-center text-sm text-green-600">
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Profil berhasil diperbarui
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-sm text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm"
                        disabled={processing}
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </section>
    );
}