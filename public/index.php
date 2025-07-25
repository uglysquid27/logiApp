<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Create the application instance
$app = require_once __DIR__.'/../bootstrap/app.php';

// Get the HTTP kernel instance
$kernel = $app->make(Kernel::class);

// Handle the incoming request
$response = $kernel->handle(
    $request = Request::capture()
)->send();

// Terminate the request
$kernel->terminate($request, $response);