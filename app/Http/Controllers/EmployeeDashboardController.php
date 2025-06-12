<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Schedule;
use App\Models\Employee; // Import model Employee
use App\Models\ManPowerRequest; // Import model ManPowerRequest
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Import DB facade for transactions

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $employee = Auth::guard('employee')->user();

        // Eager load relationships for display in the frontend
        $mySchedules = Schedule::with([
                'manPowerRequest.shift',
                'subSection.section',
                'employee' // Load employee data if needed, though often available from auth
            ])
            ->where('employee_id', $employee->id)
            ->whereDate('date', '>=', Carbon::today()) // Only schedules from today onwards
            ->orderBy('date', 'asc') // Order by date ascending
            ->get();

        return Inertia::render('EmployeeDashboard', [
            'auth' => [
                'user' => $employee,
            ],
            'mySchedules' => $mySchedules,
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
                
                // === Perubahan Baru: Update status karyawan dan cuti ===
                // Temukan karyawan yang terkait dengan jadwal ini
                $employeeToUpdate = Employee::find($schedule->employee_id);
                if ($employeeToUpdate) {
                    $employeeToUpdate->status = 'available'; // Ubah status karyawan menjadi 'available'
                    $employeeToUpdate->cuti = 'yes';      // Ubah status cuti menjadi 'yes'
                    $employeeToUpdate->save();
                }

                // === Perubahan Baru: Update status manpower request ===
                // Temukan manpower request yang terkait dengan jadwal ini
                $manPowerRequest = ManPowerRequest::find($schedule->man_power_request_id);
                if ($manPowerRequest) {
                    $manPowerRequest->status = 'pending'; // Ubah status manpower request menjadi 'pending'
                    $manPowerRequest->save();
                }

            } else {
                $data['rejection_reason'] = null; // Reset rejection reason if accepted
                // Jika status diubah menjadi 'accepted', pastikan status karyawan dan cuti juga diatur ulang
                // sesuai dengan logika bisnis Anda saat ini.
                // Contoh:
                // $employeeToUpdate = Employee::find($schedule->employee_id);
                // if ($employeeToUpdate) {
                //     $employeeToUpdate->status = 'busy'; // Atau status lain yang sesuai
                //     $employeeToUpdate->cuti = 'no';
                //     $employeeToUpdate->save();
                // }
            }
        
            // Update the schedule status and rejection reason
            $schedule->update($data);
        });
    
        // Redirect back with a success message
        return back()->with('success', 'Status berhasil diperbarui.');
    }
}
