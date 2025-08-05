import { useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function UpdatePasswordForm({ className, employee }) {
    const { data, setData, put, errors, processing, recentlySuccessful, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

   const submit = (e) => {
    e.preventDefault();
    put(route('employee.employees.password.update', { employee: employee.id }), {
        preserveScroll: true,
        onSuccess: () => reset(),
    });
};

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">Update Password</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay secure.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                {/* Current Password */}
                <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                        Current Password
                    </label>
                    <input
                        id="current_password"
                        type="password"
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        autoComplete="current-password"
                    />
                    {errors.current_password && <p className="mt-1 text-sm text-red-600">{errors.current_password}</p>}
                </div>

                {/* New Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        New Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        autoComplete="new-password"
                    />
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        autoComplete="new-password"
                    />
                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-600">{errors.password_confirmation}</p>}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        disabled={processing}
                    >
                        Update Password
                    </button>

                    {recentlySuccessful && (
                        <p className="text-sm text-gray-600">Password updated.</p>
                    )}
                </div>
            </form>
        </section>
    );
}