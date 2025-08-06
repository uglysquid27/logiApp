import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ employee }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Employee Profile
                    </h2>
                    <div className="text-sm text-gray-500">
                        Employee ID: {employee.nik || 'N/A'}
                    </div>
                </div>
            }
        >
            <Head title="Employee Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-8 sm:px-6 lg:px-8">
                    {/* Profile Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-indigo-600 text-xl font-medium">
                                        {employee.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{employee.name}</h3>
                                    <p className="text-sm text-gray-500">{employee.position || 'No position specified'}</p>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-lg">
                                <UpdateProfileInformationForm
                                    employee={employee}
                                    className="max-w-3xl"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
                            <div className="bg-white p-6 rounded-lg">
                                <UpdatePasswordForm 
                                    employee={employee} 
                                    className="max-w-3xl" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}