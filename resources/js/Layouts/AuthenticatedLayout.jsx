import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                <div className="flex h-20 items-center justify-center border-b border-gray-200 px-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <ApplicationLogo className="h-10 w-auto fill-current text-indigo-600" />
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="flex flex-col flex-grow p-3 space-y-3">
                    <NavLink
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        className="block py-2 px-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Dashboard
                    </NavLink>
                    <NavLink
                        href={route('profile.edit')}
                        active={route().current('profile.edit')}
                        className="block py-2 px-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors"
                    >
                        Profile
                    </NavLink>

                    {/* Spacer to push logout to the bottom */}
                    <div className="flex-grow"></div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full text-left py-2 px-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                    >
                        Log Out
                    </Link>
                </nav>

                {/* Log Out and User Info Section */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col space-y-3">

                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col">
                {header && (
                    <header className="bg-white shadow-sm px-8 py-4 border-b border-gray-200">
                        <header className="bg-white shadow-sm px-8 py-4 border-b border-gray-200">
                            {header} {/* Tidak dibungkus lagi */}
                        </header>
                    </header>
                )}
                <main className="flex-1 p-8 bg-gray-100 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}