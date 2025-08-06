import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-indigo-50 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    {/* Anda bisa mengubah logo atau style logo di sini jika perlu */}
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-700" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-xl sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}