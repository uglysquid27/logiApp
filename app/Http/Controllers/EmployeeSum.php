<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon; // Import Carbon for date manipulation

class EmployeeSum extends Controller
{
    public function index(): Response
    {
        // Define the start and end of the last 7 days for weekly schedule count
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $employees = Employee::withCount('schedules') // This will be the TOTAL historical count
                             ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                                // Count schedules only for the last 7 days for this specific count
                                $query->whereBetween('date', [$startDate, $endDate]);
                            }])
                             ->with(['schedules.manPowerRequest.shift']) // Eager load schedules and their shifts
                             ->orderBy('name')
                             ->get()
                             ->map(function ($employee) {
                                 // Calculate total working hours from ALL assigned shifts (cumulative)
                                 $totalWorkingHours = 0;
                                 foreach ($employee->schedules as $schedule) {
                                     // Ensure manPowerRequest and shift exist before accessing hours
                                     if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                         $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                                     }
                                 }

                                 // --- Derive 'rating' based on weekly schedules_count ---
                                 $rating = 0; // Default rating
                                 $weeklyScheduleCount = $employee->schedules_count_weekly; // Use the new weekly count for rating

                                 // Apply the Excel formula logic directly to weeklyScheduleCount
                                 if ($weeklyScheduleCount === 5) {
                                     $rating = 5;
                                 } elseif ($weeklyScheduleCount === 4) {
                                     $rating = 4;
                                 } elseif ($weeklyScheduleCount === 3) {
                                     $rating = 3;
                                 } elseif ($weeklyScheduleCount === 2) {
                                     $rating = 2;
                                 } elseif ($weeklyScheduleCount === 1) {
                                     $rating = 1;
                                 } elseif ($weeklyScheduleCount === 0) {
                                     $rating = 0;
                                 } else {
                                     // If weeklyScheduleCount is > 5 (e.g., 6, 7, etc.), it falls into this else block.
                                     $rating = 0;
                                 }

                                 // --- Add the calculated rating to the employee object ---
                                 $employee->setAttribute('calculated_rating', $rating);

                                 // --- Apply the Excel weighting formula using the derived 'rating' ---
                                 $workingDayWeight = 0;
                                 if ($rating === 5) {
                                     $workingDayWeight = 15;
                                 } elseif ($rating === 4) {
                                     $workingDayWeight = 45;
                                 } elseif ($rating === 3) {
                                     $workingDayWeight = 75;
                                 } elseif ($rating === 2) {
                                     $workingDayWeight = 105;
                                 } elseif ($rating === 1) {
                                     $workingDayWeight = 135;
                                 } elseif ($rating === 0) {
                                     $workingDayWeight = 165;
                                 } else {
                                     $workingDayWeight = 0; // Fallback
                                 }

                                 $employee->setAttribute('working_day_weight', $workingDayWeight);
                                 $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                                 return $employee;
                             });

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
        ]);
    }
}
