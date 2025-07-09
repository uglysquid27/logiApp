<?php

use Illuminate\Support\Str;

return [

  'driver' => env('SESSION_DRIVER', 'database'),
'connection' => env('DB_CONNECTION', 'mysql'), // Explicitly set connection
'table' => 'sessions',
'lifetime' => env('SESSION_LIFETIME', 120),
'expire_on_close' => true, // Changed to true
'encrypt' => false, // Set to true in production with HTTPS
];
