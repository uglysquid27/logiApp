<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Schedule;
use App\Models\Employee;
use App\Models\ManPowerRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $employee = Auth::guard('employee')->user();

        // Eager load relationships for display in the frontend
        $mySchedules = Schedule::with([
                'manPowerRequest.shift',
                'subSection.section',
                'employee'
            ])
            ->where('employee_id', $employee->id)
            ->whereDate('date', '>=', Carbon::today())
            ->orderBy('date', 'asc')
            ->get();

        return Inertia::render('EmployeeDashboard', [
            'auth' => [
                'user' => $employee,
            ],
            'mySchedules' => $mySchedules,
        ]);
    }

    public function sameShiftEmployees(Schedule $schedule)
    {
        $employee = Auth::guard('employee')->user();
        
        // Verify schedule ownership
        abort_unless($schedule->employee_id === $employee->id, 403);
    
        // Get the current sub-section
        $currentSubSection = $schedule->subSection;
    
        // Determine if we should include both Penandaan and Putway
        $includeBoth = in_array($currentSubSection->name, ['Penandaan', 'Putway']);
    
        return response()->json([
            'current_schedule' => [
                'id' => $schedule->id,
                'status' => $schedule->status,
                'sub_section' => $currentSubSection->name
            ],
            'coworkers' => Schedule::with(['employee', 'subSection'])
                ->whereHas('manPowerRequest', function($q) use ($schedule) {
                    $q->where('shift_id', $schedule->manPowerRequest->shift_id);
                })
                ->whereDate('date', $schedule->date)
                ->where(function($query) use ($schedule, $includeBoth, $currentSubSection) {
                    $query->where('sub_section_id', $schedule->sub_section_id);
                    
                    if ($includeBoth) {
                        $query->orWhereHas('subSection', function($q) use ($currentSubSection) {
                            $q->where('section_id', $currentSubSection->section_id)
                              ->whereIn('name', ['Penandaan', 'Putway']);
                        });
                    }
                })
                ->where('employee_id', '!=', $employee->id)
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'employee' => $s->employee,
                    'sub_section' => $s->subSection->name, // Include sub-section name
                    'status' => $s->status,
                    'rejection_reason' => $s->rejection_reason
                ])
        ]);
    }

    public function respond(Request $req, Schedule $schedule)
    {
        // Validate the incoming request data
        $req->validate([
            'status' => 'required|in:accepted,rejected',
            'rejection_reason' => 'nullable|required_if:status,rejected|string|max:1000',
        ]);
    
        // Ensure the schedule belongs to the authenticated employee
        $employee = Auth::guard('employee')->user();
        abort_unless($schedule->employee_id === $employee->id, 403, 'Unauthorized action.');
    
        // Start a database transaction to ensure atomicity for multiple updates
        DB::transaction(function () use ($req, $schedule, $employee) {
            $data = ['status' => $req->status];
        
            // Add rejection reason if status is rejected, otherwise set to null
            if ($req->status === 'rejected') {
                $data['rejection_reason'] = $req->rejection_reason;
                
                // Update employee status and cuti
                $employeeToUpdate = Employee::find($schedule->employee_id);
                if ($employeeToUpdate) {
                    $employeeToUpdate->status = 'available';
                    $employeeToUpdate->cuti = 'yes';
                    $employeeToUpdate->save();
                }

                // Update manpower request status
                $manPowerRequest = ManPowerRequest::find($schedule->man_power_request_id);
                if ($manPowerRequest) {
                    $manPowerRequest->status = 'pending';
                    $manPowerRequest->save();
                }
            } else {
                $data['rejection_reason'] = null;
            }
        
            // Update the schedule status and rejection reason
            $schedule->update($data);
        });
    
        // Redirect back with a success message
        return back()->with('success', 'Status berhasil diperbarui.');
    }
}