<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Section;
use App\Models\SubSection;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EmployeeSum extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $query = Employee::withCount('schedules') // Total historical count
                         ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                             $query->whereBetween('date', [$startDate, $endDate]);
                         }])
                         // --- NEW: Add counts for future/current and past schedules for status logic ---
                         ->withCount(['schedules as current_or_future_schedules_count' => function ($query) {
                             $query->where('date', '>=', Carbon::today());
                         }])
                         ->withCount(['schedules as past_only_schedules_count' => function ($query) {
                             $query->where('date', '<', Carbon::today());
                         }])
                         // --- End NEW ---
                         ->with(['schedules.manPowerRequest.shift', 'subSections.section']);

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

        // --- Apply Search by Name or NIK ---
        if ($request->has('search') && $request->input('search') !== null) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('nik', 'like', '%' . $searchTerm . '%');
            });
        }

        $employees = $query->orderBy('name')
                           ->paginate(10)
                           ->through(function ($employee) {
                               $totalWorkingHours = 0;
                               foreach ($employee->schedules as $schedule) {
                                   if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                       $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                                   }
                               }

                               $rating = 0;
                               $weeklyScheduleCount = $employee->schedules_count_weekly;

                               if ($weeklyScheduleCount === 5) { $rating = 5; }
                               elseif ($weeklyScheduleCount === 4) { $rating = 4; }
                               elseif ($weeklyScheduleCount === 3) { $rating = 3; }
                               elseif ($weeklyScheduleCount === 2) { $rating = 1; }
                               elseif ($weeklyScheduleCount === 1) { $rating = 1; }
                               elseif ($weeklyScheduleCount === 0) { $rating = 0; }

                               $workingDayWeight = 0;
                               if ($rating === 5) { $workingDayWeight = 15; }
                               elseif ($rating === 4) { $workingDayWeight = 45; }
                               elseif ($rating === 3) { $workingDayWeight = 75; }
                               elseif ($rating === 2) { $workingDayWeight = 105; }
                               elseif ($rating === 1) { $workingDayWeight = 135; }
                               elseif ($rating === 0) { $workingDayWeight = 165; }

                               $employee->setAttribute('calculated_rating', $rating);
                               $employee->setAttribute('working_day_weight', $workingDayWeight);
                               $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                               // --- NEW: Calculate Employee Status ---
                               if ($employee->current_or_future_schedules_count > 0) {
                                   $employee->status = 'assigned';
                               } else if ($employee->past_only_schedules_count > 0) {
                                   $employee->status = 'aktif';
                               } else {
                                   $employee->status = 'unassigned'; // Default for employees with no schedules at all
                               }
                               // --- End NEW ---

                               // Remove the temporary count attributes from the model
                               unset($employee->schedules);
                               unset($employee->current_or_future_schedules_count);
                               unset($employee->past_only_schedules_count);

                               return $employee;
                           });
        $allStatuses = ['All', 'assigned', 'aktif', 'unassigned']; // Define all possible statuses
        $allSections = Section::select('name')->distinct()->pluck('name')->toArray();
        $allSubSections = SubSection::select('name')->distinct()->pluck('name')->toArray();

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
            'filters' => $request->only(['status', 'section', 'sub_section', 'search']),
            'uniqueStatuses' => $allStatuses, // Use the defined list for the dropdown
            'uniqueSections' => array_merge(['All'], $allSections),
            'uniqueSubSections' => array_merge(['All'], $allSubSections),
        ]);
    }
}