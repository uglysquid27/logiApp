import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function EmployeeLicense({ employee, license, kemnakerVerifyUrl = 'https://temank3.kemnaker.go.id/page/cari_personel' }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not provided';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getExpiryBadgeClass = () => {
        if (!license?.expiry_status) return 'bg-gray-100 text-gray-800';
        
        switch(license.expiry_status) {
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'expiring_soon':
                return 'bg-yellow-100 text-yellow-800';
            case 'valid':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getExpiryStatusText = () => {
        if (!license?.expiry_status) return '';
        
        switch(license.expiry_status) {
            case 'expired':
                return 'Expired';
            case 'expiring_soon':
                return 'Expiring Soon (within 1 year)'; // Updated text
            case 'valid':
                return 'Valid';
            default:
                return 'Unknown';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`License - ${employee.name}`} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Operator License - {employee.name}
                                </h2>
                                <Link 
                                    href={route('employee-attendance.show', employee.id)}
                                    className="inline-flex items-center px-4 py-2 bg-gray-800 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-gray-700 focus:bg-gray-700 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150"
                                >
                                    Back to Employee
                                </Link>
                            </div>
                            
                            {license ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                        {/* License Details */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">License Information</h3>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">License Number</label>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {license.license_number || 'Not provided'}
                                                    </p>
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                                                        {formatDate(license.expiry_date)}
                                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getExpiryBadgeClass()}`}>
                                                            {getExpiryStatusText()}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* License Image */}
                                        <div>
                                            <h3 className="text-lg font-medium mb-4">License Image</h3>
                                            
                                            {license.image_path ? (
                                                <div className="border rounded-md p-4 flex justify-center bg-gray-50">
                                                    <img 
                                                        src={`/storage/${license.image_path}`}
                                                        alt="Operator License"
                                                        className="max-h-96 object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="border rounded-md p-8 text-center text-gray-500 bg-gray-50">
                                                    No license image uploaded
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Kemnaker Verification Section */}
                                    <div className="mt-8 border-t pt-8">
                                        <h3 className="text-lg font-medium mb-4">Official Verification</h3>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="mb-3 text-sm text-gray-600">
                                                Verify this license on the Indonesian Ministry of Manpower (Kemnaker) portal:
                                            </p>
                                            
                                            {/* Iframe Embed */}
                                            <div className="mb-4">
                                                <iframe
                                                    src={kemnakerVerifyUrl}
                                                    width="100%"
                                                    height="500"
                                                    className="border rounded-lg shadow-sm"
                                                    title="Kemnaker License Verification"
                                                ></iframe>
                                            </div>
                                            
                                            {/* Fallback Link */}
                                            <div className="text-center">
                                                <a
                                                    href={kemnakerVerifyUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                >
                                                    Open in New Tab
                                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No license information found for this employee.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}