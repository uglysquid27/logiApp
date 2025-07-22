// resources/js/Components/EmbeddedLicenseCheck.jsx
import React from 'react';

export default function EmbeddedLicenseCheck({ nama_peserta, tgl_lahir }) {
    const iframeUrl = `https://temank3.kemnaker.go.id/page/cari_personel?nama_peserta=${encodeURIComponent(nama_peserta)}&tgl_lahir=${tgl_lahir}`;
    
    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Kemnaker License Verification Results
                </h3>
                <a 
                    href={iframeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                    Open in new tab
                </a>
            </div>
            
            <div className="relative pt-[75%] rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                <iframe
                    src={iframeUrl}
                    className="absolute inset-0 w-full h-full"
                    title="TemanK3 License Verification"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />
            </div>
            
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Note: This embedded view shows the official Kemnaker verification portal.
            </p>
        </div>
    );
}