<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSum extends Controller
{
    public function index(): Response
    {
        // Eager load schedules and their nested manPowerRequest.shift to get shift hours
        $employees = Employee::withCount('schedules') // Counts direct schedules
                             ->with(['schedules.manPowerRequest.shift']) // Eager load schedules and their shifts
                             ->orderBy('name')
                             ->get()
                             ->map(function ($employee) {
                                 // Calculate working_day_weight by summing hours from all assigned shifts
                                 $totalWorkingHours = 0;
                                 foreach ($employee->schedules as $schedule) {
                                     // Ensure manPowerRequest and shift exist before accessing hours
                                     if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                         $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                                     }
                                 }
                                 $employee->working_day_weight = $totalWorkingHours;

                                 // You can also keep schedules_count if you want to display both
                                 // $employee->schedules_count = $employee->schedules_count; // This is already available from withCount

                                 return $employee;
                             });

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
        ]);
    }
}
