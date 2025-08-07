<?php

use App\Http\Controllers\AdminPermitController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PermitController;
use App\Http\Controllers\EmployeeSum;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ManPowerRequestController;
use App\Http\Controllers\ManPowerRequestFulfillmentController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeBlindTestController;
use App\Http\Controllers\EmployeeDashboardController;
use App\Http\Controllers\LunchCouponController;
use App\Http\Controllers\RatingController;
use App\Http\Middleware\PreventBackAfterLogout;
use App\Http\Controllers\EmployeeProfileController;
// app/Http/Controllers/LicenseVerificationController.php
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

// routes/web.php
use App\Http\Controllers\LicenseVerificationController;

Route::middleware(['auth', 'verified'])->group(function () {
    // GET route - shows the form
    Route::get('/license-check', [LicenseVerificationController::class, 'showForm'])
        ->name('license.check');

    // POST route - handles form submission
    Route::post('/verify-license', [LicenseVerificationController::class, 'verify'])
        ->name('license.verify');
});

// API-style endpoint
Route::middleware(['auth:sanctum'])->post(
    '/api/verify-license',
    [LicenseVerificationController::class, 'verify']
);
// Authentication routes
Route::middleware(['prevent.back'])->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);
    Route::post('/employee/login', [AuthenticatedSessionController::class, 'store'])->name('employee.login');

    // Unified Logout Route with session cleanup
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->middleware(['auth:web,employee'])
        ->name('logout');
});

// Public routes that need cache prevention
Route::middleware(['prevent.back'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware(['auth', 'verified'])
        ->name('dashboard');

    // Dashboard summary detail routes
    Route::get('/dashboard/employees/active', [DashboardController::class, 'getActiveEmployees'])
        ->name('dashboard.employees.active');
    Route::get('/dashboard/requests/pending', [DashboardController::class, 'getPendingRequests'])
        ->name('dashboard.requests.pending');
    Route::get('/dashboard/requests/fulfilled', [DashboardController::class, 'getFulfilledRequests'])
        ->name('dashboard.requests.fulfilled');
    Route::get('/dashboard/schedules/upcoming', [DashboardController::class, 'getUpcomingSchedules'])
        ->name('dashboard.schedules.upcoming');
    Route::get('/dashboard/lunch-coupons/{date}', [DashboardController::class, 'getLunchCouponsByDate'])
        ->name('dashboard.lunch-coupons.by-date');

    Route::get('/permits', [PermitController::class, 'index'])->name('permits.index');
    Route::post('/permits', [PermitController::class, 'store'])->name('permits.store');
});

// Employee routes with proper session handling
Route::middleware(['auth:employee', 'prevent.back'])
    ->prefix('employee')
    ->as('employee.')
    ->group(function () {
        Route::get('/dashboard', [EmployeeDashboardController::class, 'index'])->name('dashboard');
        Route::get('/license', [LicenseVerificationController::class, 'showForm'])->name('license');

        // Schedule routes
        Route::post('/schedule/{schedule}/respond', [EmployeeDashboardController::class, 'respond'])->name('schedule.respond');
        Route::get('/schedule/{schedule}/same-day', [EmployeeDashboardController::class, 'sameDayEmployees'])
            ->name('schedule.same-day'); // Changed from 'employee.schedule.same-day'
    
        // Old same-shift route (you can remove this if not used anymore)
        // Route::get('/schedule/{schedule}/same-shift', [EmployeeDashboardController::class, 'sameShiftEmployees'])
        //     ->name('schedule.same-shift');
    
        // Other routes
        Route::resource('permits', PermitController::class);
        Route::post('/operator-license', [LicenseVerificationController::class, 'store']);
        Route::get('/employees/{employee}/edit', [EmployeeProfileController::class, 'edit'])
            ->name('employees.edit');
        Route::put('/employees/{employee}', [EmployeeProfileController::class, 'update'])
            ->name('employees.update');
        Route::put('/employees/{employee}/password', [EmployeeProfileController::class, 'updatePassword'])
            ->name('employees.password.update');
    });

// Admin routes with session protection
Route::middleware(['auth:web', 'prevent.back'])->group(function () {
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/inactive', [EmployeeSum::class, 'inactive'])->name('employee-attendance.inactive');

    // Employee Attendance routes
    Route::prefix('employee-attendance')->group(function () {
        Route::get('/', [EmployeeSum::class, 'index'])->name('employee-attendance.index');
        Route::get('/create', [EmployeeSum::class, 'create'])->name('employee-attendance.create');
        Route::post('/', [EmployeeSum::class, 'store'])->name('employee-attendance.store');
        Route::post('/reset-all-statuses', [EmployeeSum::class, 'resetAllStatuses'])
            ->name('employee-attendance.reset-all-statuses');
        Route::post('/employee-attendance/update-workloads', [EmployeeSum::class, 'updateWorkloads'])
            ->name('employee-attendance.update-workloads')
            ->middleware(['auth', 'verified']);

        // Individual employee routes
        Route::prefix('/{employee}')->group(function () {
            Route::get('/', [EmployeeSum::class, 'show'])->name('employee-attendance.show');
            Route::get('/edit', [EmployeeSum::class, 'edit'])->name('employee-attendance.edit');

            // Add the license route within the same prefix group
            // Route::get('employee-license/{employee}', [LicenseVerificationController::class, 'showForm'])->name('employee-license.show');

            Route::put('/', [EmployeeSum::class, 'update'])->name('employee-attendance.update');
            Route::get('/deactivate', [EmployeeSum::class, 'deactivate'])->name('employee-attendance.deactivate');
            Route::post('/activate', [EmployeeSum::class, 'activate'])
                ->name('employee-attendance.activate');
            Route::post('/process-deactivation', [EmployeeSum::class, 'processDeactivation'])
                ->name('employee-attendance.process-deactivation');
        });
    });

    Route::get('/employees/{employee}/license', [LicenseVerificationController::class, 'showEmployeeLicense'])
        ->name('employees.license.show');
    Route::get('/employees/{employee}/rate', [RatingController::class, 'create'])->name('ratings.create');
    Route::post('/ratings', [RatingController::class, 'store'])->name('ratings.store');
    Route::put('/ratings/{rating}', [RatingController::class, 'update'])->name('ratings.update');

    // Manpower routes
    Route::resource('manpower-requests', ManPowerRequestController::class);
    Route::get('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'create'])
        ->name('manpower-requests.fulfill');
        Route::get('/manpower-requests/create', [ManPowerRequestController::class, 'create'])
    ->name('manpower-requests.create');
    Route::post('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'store'])
        ->name('manpower-requests.fulfill.store');
    Route::post('/manpower-requests/{manpower_request}/request-revision', [ManPowerRequestController::class, 'requestRevision'])
        ->name('manpower-requests.request-revision');
    Route::get('/manpower-requests/{manpower_request}/revision', [ManPowerRequestController::class, 'edit'])
        ->name('manpower-requests.revision.edit');
    Route::post('/manpower-requests/check-dulicates', [ManPowerRequestController::class, 'checkDuplicates'])
        ->name('manpower-requests.check-duplicates');

    // Additional dashboard routes
    Route::get('/dashboard/requests/{month}/{status}', [DashboardController::class, 'getManpowerRequestsByMonth'])
        ->name('dashboard.requests.byMonth');
    Route::get('/dashboard/schedules/by-subsection/{subSectionId}', [DashboardController::class, 'getSchedulesBySubSection'])
        ->name('dashboard.schedules.bySubSection');
    Route::get('/dashboard/manpower-requests/filtered', [DashboardController::class, 'getFilteredManpowerRequests'])
        ->name('dashboard.manpower.requests.filtered');

    Route::get('/dashboard/employee-assignments/filtered', [DashboardController::class, 'getFilteredEmployeeAssignments'])
        ->name('dashboard.employee.assignments.filtered');

 

    Route::get('/dashboard/requests/{periodType}/{period}/{status}', [DashboardController::class, 'getManpowerRequestsByPeriod'])
        ->name('dashboard.requests.byPeriod');

    // Schedule routes
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');

    // Lunch routes

    // routes/web.php
    Route::resource('lunch-coupons', LunchCouponController::class)->only(['index', 'store']);
    Route::get('/lunch-coupons/by-date/{date}', [LunchCouponController::class, 'getByDate'])
        ->name('lunch-coupons.by-date');

    // Blind Test Routes
    Route::get('/employee-blind-test', [EmployeeBlindTestController::class, 'index'])
        ->name('employee-blind-test.index');

    Route::get('/employee-blind-test/create/{employee}', [EmployeeBlindTestController::class, 'create'])
        ->name('employee-blind-test.create');

    Route::post('/employee-blind-test/store/{employee}', [EmployeeBlindTestController::class, 'store'])
        ->name('employee-blind-test.store');

    Route::get('/employee-blind-test/{employee}', [EmployeeBlindTestController::class, 'show'])
        ->name('employee-blind-test.show');

    Route::delete('/employee-blind-test/{blindTest}', [EmployeeBlindTestController::class, 'destroy'])
        ->name('employee-blind-test.destroy');

    // Shift routes
    Route::resource('shifts', ShiftController::class);
    // Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');

    // Admin permit routes
    Route::get('/admin/permits', [AdminPermitController::class, 'index'])->name('admin.permits.index');
    Route::post('/admin/permits/{permit}/respond', [AdminPermitController::class, 'respond'])
        ->name('admin.permits.respond');
});