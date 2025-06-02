<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\Request; // Import Request

class EmployeeSum extends Controller
{
    public function index(Request $request): Response
    {
        // Define the start and end of the last 7 days for weekly schedule count
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // Start building the query
        $query = Employee::withCount('schedules') // Total historical count
                         ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                             $query->whereBetween('date', [$startDate, $endDate]);
                         }])
                         ->with(['schedules.manPowerRequest.shift'])
                         ->with(['subSections.section']);

        // --- Apply Filters from Request ---
        if ($request->has('status') && $request->input('status') !== 'All') {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('section') && $request->input('section') !== 'All') {
            $sectionName = $request->input('section');
            $query->whereHas('subSections.section', function ($q) use ($sectionName) {
                $q->where('name', $sectionName);
            });
        }

        if ($request->has('sub_section') && $request->input('sub_section') !== 'All') {
            $subSectionName = $request->input('sub_section');
            $query->whereHas('subSections', function ($q) use ($subSectionName) {
                $q->where('name', $subSectionName);
            });
        }
        // --- End Apply Filters ---

        $employees = $query->orderBy('name')
                           ->paginate(10) // Paginate the filtered results
                           ->through(function ($employee) {
                               $totalWorkingHours = 0;
                               foreach ($employee->schedules as $schedule) {
                                   if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                       $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                                   }
                               }

                               $rating = 0;
                               $weeklyScheduleCount = $employee->schedules_count_weekly;

                               if ($weeklyScheduleCount === 5) {
                                   $rating = 5;
                               } elseif ($weeklyScheduleCount === 4) {
                                   $rating = 4;
                               } elseif ($weeklyScheduleCount === 3) {
                                   $rating = 3;
                               } elseif ($weeklyScheduleCount === 2) {
                                   $rating = 1; // Corrected from 2 to 1 for consistency with Excel formula
                               } elseif ($weeklyScheduleCount === 1) {
                                   $rating = 1;
                               } elseif ($weeklyScheduleCount === 0) {
                                   $rating = 0;
                               } else {
                                   $rating = 0;
                               }

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
                                   $workingDayWeight = 0;
                               }

                               $employee->setAttribute('calculated_rating', $rating);
                               $employee->setAttribute('working_day_weight', $workingDayWeight);
                               $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                               return $employee;
                           });

        // Fetch unique statuses, sections, and sub-sections from the ENTIRE dataset
        // (or at least a sufficiently large subset) to populate filter dropdowns.
        // For simplicity, we'll fetch all unique values for dropdowns.
        $allStatuses = Employee::select('status')->distinct()->pluck('status')->toArray();
        $allSections = \App\Models\Section::select('name')->distinct()->pluck('name')->toArray();
        $allSubSections = \App\Models\SubSection::select('name')->distinct()->pluck('name')->toArray();


        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees, // Paginated and filtered data
            'filters' => $request->only(['status', 'section', 'sub_section']), // Pass current filter values back
            'uniqueStatuses' => array_merge(['All'], $allStatuses),
            'uniqueSections' => array_merge(['All'], $allSections),
            'uniqueSubSections' => array_merge(['All'], $allSubSections),
        ]);
    }
}
