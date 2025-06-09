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
    public function index(Request $request): Response
    {
        
        $query = Schedule::with([
            'employee',
            'subSection.section',
            'manPowerRequest.shift',
            'manPowerRequest.subSection.section'
        ]);

        // Get start and end dates from request
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Apply date filtering only if both start and end dates are provided
        if ($startDate && $endDate) {
            $query->whereBetween('date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }
        // If no dates are provided, or only one, no date filter is applied.
        // This effectively shows ALL schedules if no dates are set.
        // If you want a default range when no filters are set, consider:
        // $query->whereBetween('date', [Carbon::today()->subMonths(1), Carbon::today()->addMonths(6)]);
        // For now, removing the default 'today/tomorrow' logic to allow "all" when cleared.

        $schedules = $query->orderBy('date')->get();

        // dd($schedules->toArray()); // Uncomment for debugging Laravel side

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