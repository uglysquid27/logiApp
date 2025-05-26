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
    public function index(): Response
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();

        // --- CRITICAL: Ensure all necessary relationships are eager loaded ---
        // Now eager-loading:
        // - employee
        // - subSection (for schedule's direct sub_section) AND its nested section
        // - manPowerRequest (for schedule's linked request) AND its nested shift
        // - manPowerRequest's nested subSection AND its nested section
        $schedules = Schedule::with([
            'employee',
            'subSection.section', // For direct subSection on schedule
            'manPowerRequest.shift', // For shift details from the request
            'manPowerRequest.subSection.section' // For subSection and Section details from the request
        ])
                             ->whereIn('date', [$today->toDateString(), $tomorrow->toDateString()])
                             ->orderBy('date')
                             ->get();

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
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
