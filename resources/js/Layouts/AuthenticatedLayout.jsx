import { useState, useEffect } from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import { Link, usePage } from '@inertiajs/react';

// SVGs for Sun and Moon icons
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.464A1 1 0 106.465 13.05l-.707-.707a1 1 0 00-1.414 1.414l.707-.707zm-.707-10.607a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
);


export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    // State for dark mode
    const [isDark, setIsDark] = useState(false); // Initialize with a default

    // Effect to initialize theme based on localStorage or system preference
    useEffect(() => {
        if (typeof window !== 'undefined') { // Ensure window is defined (for SSR safety)
            const storedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
                setIsDark(true);
                // document.documentElement.classList.add('dark'); // Handled by the next useEffect
            } else {
                setIsDark(false);
                // document.documentElement.classList.remove('dark'); // Handled by the next useEffect
            }
        }
    }, []); // Empty dependency array: runs only once on mount

    // Effect to apply dark mode class to <html> and save preference
    useEffect(() => {
        if (typeof window !== 'undefined') { // Ensure window is defined
            const root = window.document.documentElement;
            if (isDark) {
                root.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                root.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDark]); // Runs whenever isDark changes

    // Function to toggle dark mode
    const toggleDarkMode = () => {
        setIsDark(!isDark);
    };

    return (
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-100 dark:bg-gray-800 flex flex-col shadow-lg pt-8">
                <div className="flex h-20 items-center justify-center px-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <ApplicationLogo className="h-10 w-auto fill-current text-indigo-600 dark:text-indigo-400" />
                    </Link>
                </div>

                {/* Main Navigation */}
                <nav className="flex flex-col flex-grow p-3 space-y-2">
                    <NavLink
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        className="block py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                        <span className="pt-4 block">Dashboard</span>
                    </NavLink>
                    <NavLink
                        href={route('manpower-requests.index')}
                        active={route().current('manpower-requests.index')}
                        className="block py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                        <span className="pt-4 block">Manpower Requests</span>
                    </NavLink>
                    <NavLink
                        href={route('schedules.index')}
                        active={route().current('schedules.index')}
                        className="block py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                        <span className="pt-4 block">Schedules</span>
                    </NavLink>
                    <NavLink
                        href={route('profile.edit')}
                        active={route().current('profile.edit')}
                        className="block py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center"
                    >
                        <span className="pt-4 block">Profile</span>
                    </NavLink>


                    <div className="flex-grow"></div>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full text-left py-6 px-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-700 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                    >
                        Log Out
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-col space-y-3">
                    <div className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col">
                {header && (
                    <header className="bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-16 pt-4 ">
                        <div className="p-4 shadow-md rounded-md bg-white dark:bg-gray-800 flex justify-between items-center">
                            <div className="flex-grow">
                                {header}
                            </div>

                            <label htmlFor="theme-toggle-checkbox" className="flex items-center cursor-pointer ml-4" title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="theme-toggle-checkbox"
                                        className="sr-only"
                                        checked={isDark} // Use isDark state
                                        onChange={toggleDarkMode} // Use the updated toggle function
                                    />
                                    <div className="block bg-gray-300 dark:bg-gray-700 w-12 h-7 sm:w-14 sm:h-8 rounded-full transition-colors duration-300 ease-in-out"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white dark:bg-gray-300 w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-transform duration-300 ease-in-out transform ${isDark ? 'translate-x-full sm:translate-x-6' : ''} flex items-center justify-center shadow-md`}>
                                        {isDark ? <MoonIcon /> : <SunIcon />}
                                    </div>
                                </div>
                            </label>
                        </div>
                    </header>
                )}
                <main className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}