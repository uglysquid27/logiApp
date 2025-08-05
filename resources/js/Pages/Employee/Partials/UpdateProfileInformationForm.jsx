import { useForm } from '@inertiajs/react';
import { useState } from 'react';

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
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Name */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Gender */}
                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Gender
                    </label>
                    <select
                        id="gender"
                        value={data.gender}
                        onChange={(e) => setData('gender', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        required
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* Birth Date */}
                <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                        Birth Date
                    </label>
                    <input
                        id="birth_date"
                        type="date"
                        value={data.birth_date}
                        onChange={(e) => setData('birth_date', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.birth_date && <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>}
                </div>

                {/* Birth Place */}
                <div>
                    <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700">
                        Birth Place
                    </label>
                    <input
                        id="birth_place"
                        type="text"
                        value={data.birth_place}
                        onChange={(e) => setData('birth_place', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.birth_place && <p className="mt-1 text-sm text-red-600">{errors.birth_place}</p>}
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                    </label>
                    <textarea
                        id="address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        rows={3}
                    />
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                {/* City */}
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
                    </label>
                    <input
                        id="city"
                        type="text"
                        value={data.city}
                        onChange={(e) => setData('city', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                {/* Religion */}
                <div>
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Religion
                    </label>
                    <input
                        id="religion"
                        type="text"
                        value={data.religion}
                        onChange={(e) => setData('religion', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                    </label>
                    <input
                        id="phone"
                        type="text"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>

                {/* Marital Status */}
                <div>
                    <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                        Marital Status
                    </label>
                    <select
                        id="marital_status"
                        value={data.marital_status}
                        onChange={(e) => setData('marital_status', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                        <option value="">Select Status</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                    </select>
                    {errors.marital_status && <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        disabled={processing}
                    >
                        Save
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-gray-600">Saved.</p>
                    )}
                </div>
            </form>
        </section>
    );
}