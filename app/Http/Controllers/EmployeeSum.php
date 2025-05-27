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
        // Define the start and end of the last 7 days
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $employees = Employee::withCount(['schedules' => function ($query) use ($startDate, $endDate) {
                                // Count schedules only for the last 7 days
                                $query->whereBetween('date', [$startDate, $endDate]);
                            }])
                             // Eager load ALL schedules and their shifts for 'total_assigned_hours' if it's still meant to be cumulative
                             // If 'total_assigned_hours' should also be weekly, this 'with' clause needs to be filtered as well,
                             // or a separate relationship/accessor is needed.
                             ->with(['schedules.manPowerRequest.shift'])
                             ->orderBy('name')
                             ->get()
                             ->map(function ($employee) {
                                 // Calculate total working hours from ALL assigned shifts (as per previous implementation)
                                 // If this should also be weekly, you'd need to filter $employee->schedules here too.
                                 $totalWorkingHours = 0;
                                 foreach ($employee->schedules as $schedule) {
                                     if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                         $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                                     }
                                 }

                                 // --- Derive 'rating' based on weekly schedules_count (as requested) ---
                                 // The schedules_count from withCount will now be the count for the last week.
                                 $rating = 0; // Default rating
                                 $weeklyScheduleCount = $employee->schedules_count; // This is now the count for the last week

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
                                     // Based on your Excel formula's structure (exact matches for 0-5),
                                     // any other value would result in a final '0' from the Excel formula's outer 'IF'.
                                     // So, setting rating to 0 here aligns with that.
                                     $rating = 0;
                                 }

                                 // --- Add the calculated rating to the employee object ---
                                 $employee->calculated_rating = $rating;

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
                                     $workingDayWeight = 0; // Fallback for unexpected rating, though should be covered by above
                                 }

                                 $employee->working_day_weight = $workingDayWeight;

                                 // total_assigned_hours is still cumulative (total for all time)
                                 $employee->total_assigned_hours = $totalWorkingHours;

                                 return $employee;
                             });

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
        ]);
    }
}
