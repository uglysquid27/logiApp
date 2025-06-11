<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Import Auth facade
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Schedule; // Import the Schedule model

class EmployeeDashboardController extends Controller
{
    /**
     * Display the employee dashboard.
     */
    public function index(): Response
    {
        // Get the currently authenticated employee
        // Auth::guard('employee')->user() will return an App\Models\Employee instance
        $employee = Auth::guard('employee')->user();

        // Fetch schedules for the authenticated employee
        // Eager load necessary relationships for display in the frontend
        $mySchedules = Schedule::where('employee_id', $employee->id)
                               ->with([
                                   'manPowerRequest.shift', // To get shift details (name, time)
                                   'subSection.section'     // To get sub-section and section name
                               ])
                               ->orderBy('date', 'asc')
                               ->get();

        return Inertia::render('EmployeeDashboard', [
            // Inertia automatically shares `auth.user` if it's set up in HandleInertiaRequests middleware,
            // but explicitly passing it ensures it's available.
            // We're already passing `auth.user` by default through Inertia.
            // 'user' => $employee, // You can pass the employee object explicitly if needed
            'mySchedules' => $mySchedules, // Pass the employee's schedules
        ]);
    }
}
