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
        // Kelas border untuk garis atas kartu
        'border-indigo-500',
        'border-yellow-500',
        'border-green-500',
        'border-blue-500',
        'border-purple-500',
        'border-pink-500',

        // Kelas warna teks untuk angka
        'text-indigo-600',
        'text-yellow-600',
        'text-green-600',
        'text-blue-600',
        'text-purple-600',
        'text-pink-600',

        // Kelas warna teks untuk dark mode
        'dark:text-indigo-400',
        'dark:text-yellow-400',
        'dark:text-green-400',
        'dark:text-blue-400',
        'dark:text-purple-400',
        'dark:text-pink-400',
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
