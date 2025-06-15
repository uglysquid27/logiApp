<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmployeeLoginController;
use App\Http\Controllers\EmployeeSum;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ManPowerRequestController; // Make sure this is imported
use App\Http\Controllers\ManPowerRequestFulfillmentController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeDashboardController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Redirect root URL to login page
Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');

Route::post('/login', [AuthenticatedSessionController::class, 'store']);

Route::post('/employee/login', [AuthenticatedSessionController::class, 'store'])->name('employee.login');


// Unified Logout Route
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// Dashboard for standard users/admins
Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

// Dashboard summary detail routes (for standard users/admins)
Route::get('/dashboard/employees/active', [DashboardController::class, 'getActiveEmployees'])->name('dashboard.employees.active');
Route::get('/dashboard/requests/pending', [DashboardController::class, 'getPendingRequests'])->name('dashboard.requests.pending');
Route::get('/dashboard/requests/fulfilled', [DashboardController::class, 'getFulfilledRequests'])->name('dashboard.requests.fulfilled');
Route::get('/dashboard/schedules/upcoming', [DashboardController::class, 'getUpcomingSchedules'])->name('dashboard.schedules.upcoming');


Route::middleware(['auth:employee'])->get('/employee/dashboard', [EmployeeDashboardController::class, 'index'])->name('employee.dashboard');

Route::middleware('auth:employee')->post('/employee/schedule/{schedule}/respond', [EmployeeDashboardController::class, 'respond'])->name('employee.schedule.respond');


// Routes protected by the 'web' guard (for standard users/admins)
Route::middleware('auth:web')->group(function () {
    // Profile management routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Manpower Request Management - This line correctly registers all RESTful routes
    Route::resource('manpower-requests', ManpowerRequestController::class); // <-- This is the crucial line for update

    Route::get('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'create'])->name('manpower-requests.fulfill');
    Route::post('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'store'])->name('manpower-requests.fulfill.store');

    // Schedule Management
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');

    // Shift Management
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');

    // Employee Summary/Attendance
    Route::get('/employee-attendance', [EmployeeSum::class, 'index'])->name('employee-attendance.index');
    Route::post('/employee-attendance/reset-all-statuses', [App\Http\Controllers\EmployeeSum::class, 'resetAllStatuses'])
        ->name('employee-attendance.reset-all-statuses');
});


// Include default authentication routes from Breeze/Jetstream if you're using it
require __DIR__.'/auth.php';
