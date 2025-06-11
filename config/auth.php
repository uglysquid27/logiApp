<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | You may define every authentication guard for your application.
    |
    */

    'guards' => [
        'web' => [ // Your default web guard (for 'users' table)
            'driver' => 'session',
            'provider' => 'users',
        ],
        'employee' => [ // <<< ENSURE THIS 'employee' GUARD EXISTS
            'driver' => 'session',
            'provider' => 'employees', // It should point to the 'employees' provider
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    |
    | All authentication providers are registered here.
    |
    */

    'providers' => [
        'users' => [ // Your default 'users' provider (for 'users' table)
            'driver' => 'eloquent',
            'model' => App\Models\User::class,
        ],

        'employees' => [ // <<< ENSURE THIS 'employees' PROVIDER EXISTS
            'driver' => 'eloquent',
            'model' => App\Models\Employee::class, // It should point to your Employee model
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Passwords
    |--------------------------------------------------------------------------
    |
    | Here you may specify how your passwords are reset.
    |
    */

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
        // You might add a 'employees' entry here if you need password reset for employees
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    |
    | Here you may specify the number of seconds before a password confirmation
    | times out and the user is prompted to re-enter their password via the
    | confirmation screen. By default, the timeout lasts for three hours.
    |
    */

    'password_timeout' => 10800,

];
