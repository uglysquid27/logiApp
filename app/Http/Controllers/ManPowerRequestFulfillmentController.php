<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon; // Import Carbon for date manipulation
use Illuminate\Support\Facades\DB; // Import DB for transactions

class ManPowerRequestFulfillmentController extends Controller
{
    public function create($id)
    {
        $request = ManPowerRequest::with('subSection.section', 'shift')->findOrFail($id);

        // If the request is already fulfilled, redirect or show a message
        if ($request->status === 'fulfilled') {
            return Inertia::render('Fullfill/Index', [
                'request' => $request,
                'employees' => [], // No employees to fulfill if already fulfilled
                'message' => 'This request has already been fulfilled.',
            ]);
        }

        // Define the start and end of the last 7 days for schedule count and rating calculation
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // 1. Get IDs of employees already scheduled on the request date
        $scheduledEmployeeIdsOnRequestDate = Schedule::whereDate('date', $request->date)
                                                     ->pluck('employee_id')
                                                     ->toArray();

        // 2. Fetch all active employees relevant to the request's sub-section,
        //    and who are NOT already scheduled on the request date.
        // FIX: Changed status check from 'aktif' to 'available' and added 'cuti' check
        $eligibleEmployees = Employee::where('status', 'available')
            ->where('cuti', 'no') // Ensure employee is not on leave
            ->whereHas('subSections', function ($query) use ($request) {
                $query->where('sub_sections.id', $request->sub_section_id);
            })
            ->whereNotIn('id', $scheduledEmployeeIdsOnRequestDate) // Exclude already scheduled employees
            // Eager load relationships needed for display/calculations
            ->withCount(['schedules' => function ($query) use ($startDate, $endDate) {
                // Count schedules only for the last 7 days for 'schedules_count_weekly'
                $query->whereBetween('date', [$startDate, $endDate]);
            }])
            // Eager load ALL schedules and their shifts for 'total_assigned_hours' (cumulative)
            ->with(['schedules.manPowerRequest.shift'])
            ->get()
            ->map(function ($employee) {
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
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                return $employee;
            });

        // 3. Separate employees into 'bulanan' and 'harian'
        $monthlyEmployees = $eligibleEmployees->filter(fn($employee) => $employee->type === 'bulanan');
        $dailyEmployees = $eligibleEmployees->filter(fn($employee) => $employee->type === 'harian');

        // 4. Sort 'harian' employees by working_day_weight (descending)
        //    Lower working_day_weight means higher priority for daily employees.
        $sortedDailyEmployees = $dailyEmployees->sortByDesc('working_day_weight')->values();

        // 5. Combine: monthly employees first, then sorted daily employees
        //    The ->values() call is important to re-index the collection after filtering/sorting
        //    so that merge works correctly and the frontend receives a clean array.
        $prioritizedEmployees = $monthlyEmployees->values()->merge($sortedDailyEmployees);

        return Inertia::render('Fullfill/Index', [
            'request' => $request,
            'employees' => $prioritizedEmployees, // This now includes the calculated properties and is prioritized
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);
    
        $req = ManPowerRequest::findOrFail($id);

        // Prevent fulfillment if the request is already fulfilled
        if ($req->status === 'fulfilled') {
            return back()->withErrors(['request_status' => 'This request has already been fulfilled.']);
        }
    
        try {
            DB::transaction(function () use ($validated, $req) {
                foreach ($validated['employee_ids'] as $employeeId) {
                    // Re-check employee availability and status before creating schedule
                    // FIX: Changed status check from 'aktif' to 'available' and added 'cuti' check
                    $employee = Employee::where('id', $employeeId)
                        ->where('status', 'available') // Only assign if available
                        ->where('cuti', 'no') // Only assign if not on cuti
                        ->whereDoesntHave('schedules', function ($query) use ($req) {
                            $query->where('date', $req->date);
                        })
                        ->first();
            
                    if (!$employee) {
                        // FIX: Updated error message to reflect new status/cuti checks
                        throw new \Exception("Karyawan ID {$employeeId} tidak tersedia, sedang cuti, atau sudah dijadwalkan pada {$req->date->format('d M Y')}.");
                    }
            
                    Schedule::create([
                        'employee_id' => $employeeId,
                        'sub_section_id' => $req->sub_section_id,
                        'man_power_request_id' => $req->id,
                        'date' => $req->date,
                    ]);

                    // NEW LOGIC: Update employee status to 'assigned'
                    $employee->status = 'assigned';
                    $employee->save();
                }
            
                $req->status = 'fulfilled';
                $req->save();
            });
        } catch (\Exception $e) {
            // Catch the exception and return a back response with errors
            return back()->withErrors(['fulfillment_error' => $e->getMessage()]);
        }
    
        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
}
