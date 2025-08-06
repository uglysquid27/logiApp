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
                <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Update your personal details and contact information.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Name */}
                <div className="sm:col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name <span className="text-red-500">*</span>
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

                {/* Gender */}
                <div className="sm:col-span-3">
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                        <select
                            id="gender"
                            value={data.gender}
                            onChange={(e) => setData('gender', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                </div>

                {/* Birth Date */}
                <div className="sm:col-span-3">
                    <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                        Birth Date
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

                {/* Birth Place */}
                <div className="sm:col-span-3">
                    <label htmlFor="birth_place" className="block text-sm font-medium text-gray-700">
                        Birth Place
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

                {/* Religion */}
                <div className="sm:col-span-3">
                    <label htmlFor="religion" className="block text-sm font-medium text-gray-700">
                        Religion
                    </label>
                    <div className="mt-1">
                        <select
                            id="religion"
                            value={data.religion}
                            onChange={(e) => setData('religion', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                            <option value="">Select Religion</option>
                            <option value="islam">Islam</option>
                            <option value="christianity">Christianity</option>
                            <option value="hinduism">Hinduism</option>
                            <option value="buddhism">Buddhism</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{errors.religion}</p>}
                </div>

                {/* Marital Status */}
                <div className="sm:col-span-3">
                    <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                        Marital Status
                    </label>
                    <div className="mt-1">
                        <select
                            id="marital_status"
                            value={data.marital_status}
                            onChange={(e) => setData('marital_status', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                        >
                            <option value="">Select Status</option>
                            <option value="single">Single</option>
                            <option value="married">Married</option>
                            <option value="divorced">Divorced</option>
                            <option value="widowed">Widowed</option>
                        </select>
                    </div>
                    {errors.marital_status && <p className="mt-1 text-sm text-red-600">{errors.marital_status}</p>}
                </div>

                {/* Phone */}
                <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
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

                {/* City */}
                <div className="sm:col-span-3">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City
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

                {/* Address */}
                <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
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
                                Profile updated successfully
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-medium text-sm text-white uppercase tracking-widest hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150 shadow-sm"
                        disabled={processing}
                    >
                        {processing ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </section>
    );
}