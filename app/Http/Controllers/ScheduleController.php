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
    // ScheduleController.php

  
    public function index()
    {
        $today = Carbon::today();
        $tomorrow = Carbon::tomorrow();
    
        $schedules = Schedule::with(['employee', 'subSection'])
            ->whereIn('date', [$today->toDateString(), $tomorrow->toDateString()])
            ->orderBy('date')
            ->get();
    
        return inertia('Schedules/Index', [
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
