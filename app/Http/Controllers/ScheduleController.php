<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ManPowerRequest;
use App\Models\Employee;
use App\Models\Schedule;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    public function index(Request $request): Response // Added Request $request
    {
        $query = Schedule::with([
            'employee',
            'subSection.section',
            'manPowerRequest.shift',
            'manPowerRequest.subSection.section' // Ensure this is eager loaded for the modal
        ]);

        // Get start and end dates from request, default to today and tomorrow if not provided
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($startDate && $endDate) {
            // If dates are provided, filter schedules within the given range
            $query->whereBetween('date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        } else {
            // Default to today and tomorrow if no date range is specified
            $today = Carbon::today();
            $tomorrow = Carbon::tomorrow();
            $query->whereIn('date', [$today->toDateString(), $tomorrow->toDateString()]);
        }

        $schedules = $query->orderBy('date')->get();

        // --- DEBUGGING LINE: UNCOMMENT THIS TEMPORARILY TO INSPECT DATA ---
        // dd($schedules->toArray());

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'filters' => [ // Pass current filter values back to the frontend
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function edit($id): Response
    {
        $request = ManPowerRequest::with('subSection')->findOrFail($id);

        $employees = Employee::whereHas('subSections', fn($q) =>
            $q->where('id', $request->sub_section_id)
        )->get();

        return Inertia::render('Schedules/Assign', [
            'request' => $request,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'request_id' => 'required|exists:man_power_requests,id',
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        $manPowerRequest = ManPowerRequest::findOrFail($request->request_id);

        foreach ($request->employee_ids as $empId) {
            Schedule::create([
                'employee_id' => $empId,
                'sub_section_id' => $manPowerRequest->sub_section_id,
                'man_power_request_id' => $manPowerRequest->id,
                'date' => $manPowerRequest->date,
            ]);
        }

        $manPowerRequest->update(['status' => 'fulfilled']);

        return redirect()->route('schedules.index')->with('success', 'Employees scheduled');
    }
}
