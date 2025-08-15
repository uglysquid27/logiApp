// components/ToastNotification.jsx
import { useEffect, useState } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ToastNotification({ message, show, onClose, type = 'success' }) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
        if (show) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!visible) return null;

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400';

    return (
        <div className={`fixed top-4 right-4 rounded-md p-4 ${bgColor} shadow-lg z-50`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <CheckCircleIcon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${textColor}`}>{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <button
                        type="button"
                        className="inline-flex rounded-md bg-green-50 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                        onClick={() => {
                            setVisible(false);
                            onClose();
                        }}
                    >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}