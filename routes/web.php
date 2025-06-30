<?php

use App\Http\Controllers\AdminPermitController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\PermitController;
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

Route::get('/permits', [PermitController::class, 'index'])->name('permits.index');
Route::post('/permits', [PermitController::class, 'store'])->name('permits.store');

Route::get('/test-same-shift', function() {
    $schedule = App\Models\Schedule::first();
    return app()->make(App\Http\Controllers\EmployeeDashboardController::class)
        ->sameShiftEmployees($schedule);
});


Route::get('/debug-schedules', function() {
    $employee = auth()->guard('employee')->user();
    
    // Get first schedule of the employee
    $schedule = \App\Models\Schedule::with(['manPowerRequest.shift', 'subSection'])
        ->where('employee_id', $employee->id)
        ->whereDate('date', '>=', now())
        ->first();

    if (!$schedule) {
        return response()->json([
            'error' => 'No schedules found for this employee',
            'employee_id' => $employee->id
        ]);
    }

    // Check for same-shift employees
    $sameShiftCount = \App\Models\Schedule::whereHas('manPowerRequest', function($q) use ($schedule) {
            $q->where('shift_id', $schedule->manPowerRequest->shift_id);
        })
        ->whereDate('date', $schedule->date)
        ->where('sub_section_id', $schedule->sub_section_id)
        ->where('status', 'accepted')
        ->where('employee_id', '!=', $employee->id)
        ->count();

    return [
        'current_employee' => $employee->only('id', 'name', 'nik'),
        'current_schedule' => [
            'id' => $schedule->id,
            'date' => $schedule->date,
            'shift' => $schedule->manPowerRequest->shift->name,
            'sub_section' => $schedule->subSection->name,
            'status' => $schedule->status
        ],
        'same_shift_coworkers_count' => $sameShiftCount,
        'same_shift_condition' => [
            'shift_id' => $schedule->manPowerRequest->shift_id,
            'date' => $schedule->date->format('Y-m-d'),
            'sub_section_id' => $schedule->sub_section_id
        ]
    ];
})->middleware('auth:employee');


Route::middleware(['auth:employee'])
    ->prefix('employee')
    ->as('employee.')
    ->group(function () {
        Route::get('/dashboard', [EmployeeDashboardController::class, 'index'])->name('dashboard');
        Route::post('/schedule/{schedule}/respond', [EmployeeDashboardController::class, 'respond'])->name('schedule.respond');
        
        // Add this new route for same-shift employees
        Route::get('/schedule/{schedule}/same-shift', [EmployeeDashboardController::class, 'sameShiftEmployees'])
            ->name('schedule.same-shift');
            
        Route::resource('permits', PermitController::class);
    });

Route::middleware('auth:web')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('manpower-requests', ManpowerRequestController::class);

    Route::get('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'create'])->name('manpower-requests.fulfill');
    Route::post('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'store'])->name('manpower-requests.fulfill.store');

    Route::post('/manpower-requests/{manpower_request}/request-revision', [ManpowerRequestController::class, 'requestRevision'])
        ->name('manpower-requests.request-revision');

    Route::get('/manpower-requests/{manpower_request}/revision', [ManpowerRequestController::class, 'edit'])
        ->name('manpower-requests.revision.edit');

    Route::get('/dashboard/requests/{month}/{status}', [DashboardController::class, 'getManpowerRequestsByMonth'])
        ->name('dashboard.requests.byMonth');

    Route::get('/dashboard/schedules/by-subsection/{subSectionId}', [DashboardController::class, 'getSchedulesBySubSection'])
        ->name('dashboard.schedules.bySubSection');

    // Schedule Management
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');

    // Shift Management
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');

    // Employee Summary/Attendance
    Route::get('/employee-attendance', [EmployeeSum::class, 'index'])->name('employee-attendance.index');
    Route::post('/employee-attendance/reset-all-statuses', [App\Http\Controllers\EmployeeSum::class, 'resetAllStatuses'])->name('employee-attendance.reset-all-statuses');

    Route::get('/admin/permits', [AdminPermitController::class, 'index'])->name('admin.permits.index');
    Route::post('/admin/permits/{permit}/respond', [AdminPermitController::class, 'respond'])->name('admin.permits.respond');
});


require __DIR__ . '/auth.php';
