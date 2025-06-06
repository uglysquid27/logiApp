<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\EmployeeSum;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ManPowerRequestController;
use App\Http\Controllers\ManPowerRequestFulfillmentController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');


Route::middleware(['auth'])->group(function () {
    Route::get('/manpower-requests', [ManPowerRequestController::class, 'index'])->name('manpower-requests.index');
    Route::get('/manpower-requests/create', [ManPowerRequestController::class, 'create'])->name('manpower-requests.create');
    Route::post('/manpower-requests', [ManPowerRequestController::class, 'store'])->name('manpower-requests.store');
    Route::get('/manpower-requests/{manPowerRequest}/edit', [ManPowerRequestController::class, 'edit'])->name('manpower-requests.edit');
    Route::put('/manpower-requests/{manPowerRequest}', [ManPowerRequestController::class, 'update'])->name('manpower-requests.update');
    Route::get('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'create'])->name('manpower-requests.fulfill');
    Route::post('/manpower-requests/{id}/fulfill', [ManPowerRequestFulfillmentController::class, 'store'])->name('manpower-requests.fulfill.store');
    Route::get('/schedules', [ScheduleController::class, 'index'])->name('schedules.index');

    Route::get('/schedules/{id}/edit', [ScheduleController::class, 'edit'])->name('schedules.edit');
    Route::post('/schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::get('/shifts', [ShiftController::class, 'index'])->name('shifts.index');

    Route::get('/employee-attendance', [EmployeeSum::class, 'index'])->name('employee-attendance.index');


});


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
