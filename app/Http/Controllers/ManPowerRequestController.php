<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ManPowerRequest;
use App\Models\Employee;
use App\Models\SubSection;
use App\Models\Shift;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ManPowerRequestController extends Controller
{
    public function index(): Response
    {
        // Use paginate() instead of get() to retrieve paginated results
        $requests = ManPowerRequest::with(['subSection', 'shift'])
                                    ->orderBy('date', 'desc')
                                    ->orderBy('created_at', 'desc')
                                    ->paginate(10); // Paginate with 10 items per page

        return Inertia::render('ManpowerRequests/Index', [
            'requests' => $requests, // Inertia automatically serializes pagination data
        ]);
    }

    public function create(): Response
    {
        $subSections = SubSection::all();
        $shifts = Shift::all(); // Fetch shifts to pass to the frontend

        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts, // Pass shifts to the create form
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            // 'shift_id' is no longer a single field, but part of requested_amounts_by_shift
            'requested_amounts_by_shift' => 'required|array',
            'requested_amounts_by_shift.*' => 'nullable|integer|min:0', // Allow null or 0 for optional amounts
        ]);

        // Process requested_amounts_by_shift to create individual ManPowerRequest entries
        foreach ($validated['requested_amounts_by_shift'] as $shiftId => $amount) {
            if ($amount > 0) { // Only create a request if the amount is greater than 0
                ManPowerRequest::create([
                    'sub_section_id' => $validated['sub_section_id'],
                    'date' => $validated['date'],
                    'shift_id' => $shiftId,
                    'requested_amount' => $amount,
                    'status' => 'pending', // Default status
                ]);
            }
        }

        return redirect()->route('manpower-requests.index')->with('success', 'Man power request created successfully.');
    }

    public function fulfill($id): Response
    {
        $manPowerRequest = ManPowerRequest::with(['subSection.section', 'shift'])->findOrFail($id);

        // Define the start and end of the last 7 days for schedule count and rating calculation
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // Fetch employees relevant to the sub_section of the request
        $employees = Employee::whereHas('subSections', fn($q) =>
            $q->where('id', $manPowerRequest->sub_section_id)
        )
        // Now, 'schedules_count' will directly represent the count for the last 7 days
        ->withCount(['schedules' => function ($query) use ($startDate, $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        }])
        // Eager load ALL schedules and their shifts for total_assigned_hours (if still needed as cumulative)
        // If total_assigned_hours should also be weekly, this 'with' clause needs to be filtered as well.
        ->with(['schedules.manPowerRequest.shift'])
        ->orderBy('name')
        ->get()
        ->map(function ($employee) {
            // Calculate total working hours from ALL assigned schedules (cumulative)
            // If this should also be weekly, you'd need to filter $employee->schedules here too.
            $totalWorkingHours = 0;
            foreach ($employee->schedules as $schedule) {
                if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                    $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                }
            }

            // --- Derive 'rating' based on schedules_count (which is now the weekly count) ---
            $rating = 0;
            $weeklyScheduleCount = $employee->schedules_count; // Use schedules_count directly for weekly count

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
            // schedules_count is already handled by withCount, no need to setAttribute for it

            return $employee;
        });

        return Inertia::render('ManpowerRequests/Fulfill', [
            'request' => $manPowerRequest,
            'employees' => $employees, // This now includes the calculated properties
        ]);
    }
}
