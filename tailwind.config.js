import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    // Pastikan properti safelist ditambahkan di sini
    safelist: [
    'border-indigo-500',
    'text-indigo-600',
    'border-yellow-500',
    'text-yellow-600',
    'border-green-500',
    'text-green-600',
    'border-blue-500',
    'text-blue-600',
    'border-purple-500',
    'text-purple-600',
    'border-pink-500',
    'text-pink-600',
  ],

    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
