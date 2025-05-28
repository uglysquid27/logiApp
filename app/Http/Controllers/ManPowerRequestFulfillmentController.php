<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon; // Import Carbon for date manipulation

class ManPowerRequestFulfillmentController extends Controller
{
    public function create($id)
    {
        $request = ManPowerRequest::with('subSection.section')->findOrFail($id);

        // Define the start and end of the last 7 days for schedule count and rating calculation
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // Fetch ALL active employees, and eager load their subSections
        $employees = Employee::where('status', 'aktif')
            ->with('subSections') // Eager load subSections to filter in frontend
            // 'schedules_count' will now be the TOTAL historical count for each employee
            ->withCount('schedules') // Total historical count
            // 'schedules_count_weekly' will be the count for the last 7 days for rating calculation
            ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }])
            // Eager load ALL schedules and their shifts for total_assigned_hours (cumulative)
            ->with(['schedules.manPowerRequest.shift'])
            ->orderBy('name')
            ->get()
            ->map(function ($employee) use ($request) {
                // Calculate total working hours from ALL assigned schedules (cumulative)
                $totalWorkingHours = 0;
                foreach ($employee->schedules as $schedule) {
                    if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                        $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                    }
                }

                // --- Derive 'rating' based on 'schedules_count_weekly' ---
                $rating = 0;
                $weeklyScheduleCount = $employee->schedules_count_weekly; // Use the weekly count for rating

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
                    $rating = 0; // Default for counts > 5
                }

                // Apply the Excel weighting formula using the derived 'rating'
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

                // Explicitly set the attributes on the employee model for serialization
                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours); // Still cumulative

                // This flag can be used for frontend filtering if needed
                $employee->setAttribute(
                    'is_in_request_subsection',
                    $employee->subSections->contains('id', $request->sub_section_id)
                );

                return $employee;
            });

        return Inertia::render('Fullfill/Index', [ // Assuming your frontend path is 'Fullfill/Index'
            'request' => $request,
            'employees' => $employees, // This now includes the calculated properties
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);
    
        $req = ManPowerRequest::findOrFail($id);
    
        foreach ($validated['employee_ids'] as $employeeId) {
            $employee = Employee::where('id', $employeeId)
                ->where('status', 'aktif') // sesuaikan dengan status di DB
                ->whereDoesntHave('schedules', function ($query) use ($req) {
                    $query->where('date', $req->date);
                })
                ->first();
    
            if (!$employee) {
                return back()->withErrors(['employee_ids' => 'Salah satu karyawan sudah tidak tersedia.']);
            }
    
            Schedule::create([
                'employee_id' => $employeeId,
                'sub_section_id' => $req->sub_section_id,
                'man_power_request_id' => $req->id,
                'date' => $req->date,
            ]);
    
            // $employee->update(['status' => 'assigned']); // Consider if this status update is desired here
        }
    
        $req->status = 'fulfilled';
        $req->save();
    
        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
}
