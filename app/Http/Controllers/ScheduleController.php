<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ManPowerRequest;
use App\Models\Employee;
use App\Models\Schedule;

class ScheduleController extends Controller
{
    // ScheduleController.php

public function index()
{
    $requests = ManPowerRequest::with('subSection')->where('status', 'pending')->get();
    return view('schedules.index', compact('requests'));
}

public function edit($id)
{
    $request = ManPowerRequest::findOrFail($id);
    $employees = Employee::whereHas('subSections', fn($q) =>
        $q->where('id', $request->sub_section_id)
    )->get();

    return view('schedules.assign', compact('request', 'employees'));
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
            'date' => $manPowerRequest->date,
            'shift' => 'I', // atau input dari LO
        ]);
    }

    $manPowerRequest->update(['status' => 'fulfilled']);

    return redirect()->route('schedules.index')->with('success', 'Employees scheduled');
}

}
