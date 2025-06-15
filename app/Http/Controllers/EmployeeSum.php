<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Section;
use App\Models\SubSection;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Pastikan DB facade diimport
use Illuminate\Support\Facades\Log; // Pastikan Log facade diimport

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
                         ->with(['schedules.manPowerRequest.shift', 'subSections.section']);

        // --- Apply Filters from Request ---
        // This will now filter directly on the database 'status' column
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

                               // Remove the large 'schedules' relation from the final JSON response
                               unset($employee->schedules);

                               return $employee;
                           });

        // Fetch unique statuses, sections, and sub-sections for filter dropdowns.
        $allStatuses = Employee::select('status')->distinct()->pluck('status')->toArray();
        $allSections = Section::select('name')->distinct()->pluck('name')->toArray();
        $allSubSections = SubSection::select('name')->distinct()->pluck('name')->toArray();

        return Inertia::render('EmployeeAttendance/Index', [ // <--- JALUR TELAH DIKOREKSI DI SINI
            'employees' => $employees,
            'filters' => $request->only(['status', 'section', 'sub_section', 'search']),
            'uniqueStatuses' => array_merge(['All'], $allStatuses), // Include 'All'
            'uniqueSections' => array_merge(['All'], $allSections),
            'uniqueSubSections' => array_merge(['All'], $allSubSections),
        ]);
    }

    /**
     * Resets the status of all employees to 'available' and 'cuti' to 'no'.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function resetAllStatuses(Request $request)
    {
        try {
            DB::transaction(function () {
                Employee::query()->update([
                    'status' => 'available',
                    'cuti' => 'no',
                ]);
            });

            return redirect()->back()->with('success', 'Semua status karyawan berhasil direset.');
        } catch (\Exception $e) {
            Log::error('Error resetting all employee statuses: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->back()->with('error', 'Gagal mereset status karyawan. Silakan coba lagi.');
        }
    }
}
