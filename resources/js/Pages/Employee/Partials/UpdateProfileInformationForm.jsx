import { useForm } from '@inertiajs/react';
import { useState } from 'react'; // useState tidak digunakan di sini, tapi saya biarkan karena mungkin ada logika lain yang membutuhkannya

export default function UpdateProfileInformationForm({ employee, className }) {
    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        name: employee.name,
        gender: employee.gender,
        birth_date: employee.birth_date,
        birth_place: employee.birth_place,
        address: employee.address,
        city: employee.city,
        religion: employee.religion,
        phone: employee.phone,
        marital_status: employee.marital_status,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('employee.employees.update', employee.id));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-semibold text-gray-800">Informasi Pribadi</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Perbarui detail pribadi dan informasi kontak Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Nama Lengkap */}
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

                {/* Jenis Kelamin */}
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
                            <option value="">Pilih Jenis Kelamin</option>
                            <option value="male">Laki-laki</option>
                            <option value="female">Perempuan</option>
                        </select>
                    </div>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* Tanggal Lahir */}
                <div className="sm:col-span-3">
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                        Tanggal Lahir
                    </label>
                    <div className="mt-1">
                        <input
                            id="birth_date"
                            type="date"
                            value={data.birth_date}
                            onChange={(e) => setData('birth_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        />
                    </div>
                    {errors.birth_date && <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>}
                </div>

                {/* Tempat Lahir */}
                <div className="sm:col-span-3">
                    <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700">
                        Alamat KTP
                    </label>
                    <div className="mt-1">
                        <input
                            id="birth_place"
                            type="text"
                            value={data.birth_place}
                            onChange={(e) => setData('birth_place', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        />
                    </div>
                    {errors.birth_place && <p className="mt-1 text-sm text-red-600">{errors.birth_place}</p>}
                </div>

                {/* Agama */}
                <div className="sm:col-span-3">
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Agama
                    </label>
                    <div className="mt-1">
                        <select
                            id="religion"
                            value={data.religion}
                            onChange={(e) => setData('religion', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                            <option value="">Pilih Agama</option>
                            <option value="islam">Islam</option>
                            <option value="christianity">Kristen</option>
                            <option value="hinduism">Hindu</option>
                            <option value="buddhism">Buddha</option>
                            <option value="other">Lainnya</option>
                        </select>
                    </div>
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion}</p>}
                </div>

                {/* Status Pernikahan */}
                <div className="sm:col-span-3">
                    <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                        Status Pernikahan
                    </label>
                    <div className="mt-1">
                        <select
                            id="marital_status"
                            value={data.marital_status}
                            onChange={(e) => setData('marital_status', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                            <option value="">Pilih Status</option>
                            <option value="single">Belum Menikah</option>
                            <option value="married">Menikah</option>
                            <option value="divorced">Bercerai</option>
                            <option value="widowed">Janda/Duda</option>
                        </select>
                    </div>
                    {errors.marital_status && <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>}
                </div>

                {/* Nomor Telepon */}
                <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Nomor Telepon
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

                {/* Kota */}
                <div className="sm:col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        Kota
                    </label>
                    <div className="mt-1">
                        <input
                            id="city"
                            type="text"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        />
                    </div>
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                {/* Alamat */}
                <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Alamat
                    </label>
                    <div className="mt-1">
                        <textarea
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            rows={3}
                        />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
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

