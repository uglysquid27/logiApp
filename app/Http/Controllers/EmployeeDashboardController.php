<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EmployeeDashboardController extends Controller
{
    public function index()
    {
        $employee = Auth::guard('employee')->user();

        $mySchedules = Schedule::with([
                'manPowerRequest.shift',
                'subSection.section',
            ])
            ->where('employee_id', $employee->id)
            ->whereDate('date', '>=', Carbon::today()) // Hanya jadwal hari ini dan seterusnya
            ->orderBy('date', 'asc') // Urutkan dari yang paling dekat
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
    $req->validate([
        'status' => 'required|in:accepted,rejected',
        'rejection_reason' => 'required_if:status,rejected|string|max:1000',
    ]);

    // Pastikan schedule milik employee
    $employee = Auth::guard('employee')->user();
    abort_unless($schedule->employee_id === $employee->id, 403);

    $schedule->update($req->only('status', 'rejection_reason'));

    return back()->with('success', 'Status berhasil diperbarui.');
}

}

