<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Section;
use App\Models\SubSection;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EmployeeSum extends Controller
{
    public function index(Request $request): Response
    {
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $query = Employee::withCount('schedules')
            ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }])
            ->with(['schedules' => function ($query) {
                $query->whereDate('date', Carbon::today())
                    ->with('manPowerRequest.shift');
            }, 'subSections.section']);

        // Apply Filters
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

        // Search by Name or NIK
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
                // Override status based on today's schedule
                $employee->status = $employee->isAssignedToday() ? 'assigned' : 'available';

                // Calculate total assigned hours (for today's schedules only)
                $totalWorkingHours = $employee->schedules
                    ->sum(function ($schedule) {
                        return $schedule->manPowerRequest->shift->hours ?? 0;
                    });

                // Rating logic (unchanged)
                $weeklyScheduleCount = $employee->schedules_count_weekly;
                $rating = match (true) {
                    $weeklyScheduleCount >= 5 => 5,
                    $weeklyScheduleCount == 4 => 4,
                    $weeklyScheduleCount == 3 => 3,
                    $weeklyScheduleCount == 2 => 1,
                    $weeklyScheduleCount == 1 => 1,
                    default => 0,
                };

                $workingDayWeight = match ($rating) {
                    5 => 15,
                    4 => 45,
                    3 => 75,
                    2 => 105,
                    1 => 135,
                    default => 165,
                };

                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                // Remove schedules from response to reduce payload
                unset($employee->schedules);

                return $employee;
            });

        // Fetch filter dropdown options
        $allStatuses = ['All', 'available', 'assigned']; // Hardcoded since we override DB status
        $allSections = Section::select('name')->distinct()->pluck('name')->toArray();
        $allSubSections = SubSection::select('name')->distinct()->pluck('name')->toArray();

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
            'filters' => $request->only(['status', 'section', 'sub_section', 'search']),
            'uniqueStatuses' => $allStatuses,
            'uniqueSections' => array_merge(['All'], $allSections),
            'uniqueSubSections' => array_merge(['All'], $allSubSections),
        ]);
    }

    public function resetAllStatuses(Request $request)
    {
        try {
            DB::transaction(function () {
                Employee::query()->update([
                    'status' => 'available',
                    'cuti' => 'no',
                ]);
            });

            return redirect()->back()->with('success', 'All employee statuses reset successfully.');
        } catch (\Exception $e) {
            Log::error('Error resetting employee statuses: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to reset statuses. Please try again.');
        }
    }
}