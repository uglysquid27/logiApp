import { useForm } from '@inertiajs/react';

export default function UpdateProfileInformationForm({ employee, className }) {
    const { data, setData, put, errors, processing, recentlySuccessful } = useForm({
        name: employee.name,
        email: employee.email,
        type: employee.type,
        gender: employee.gender,
        group: employee.group,
        birth_date: employee.birth_date,
        address: employee.address,
        religion: employee.religion,
        phone: employee.phone,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('employee.employees.update', employee.id));
    };

    return (
        <section className={className}>
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
                        Email
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
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
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
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

                {/* Birth Date */}
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

                {/* Address */}
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

                {/* Religion */}
                <div className="sm:col-span-3">
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Agama
                    </label>
                    <div className="mt-1">
                        <input
                            id="religion"
                            type="text"
                            value={data.religion}
                            onChange={(e) => setData('religion', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        />
                    </div>
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion}</p>}
                </div>

                {/* Phone */}
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