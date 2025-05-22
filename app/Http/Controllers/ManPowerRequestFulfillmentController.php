<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManPowerRequestFulfillmentController extends Controller
{
    public function create($id)
    {
        $request = ManPowerRequest::with('subSection.section')->findOrFail($id);
        $employees = Employee::where('status', 'aktif')->get();

        return Inertia::render('Fullfill/Index', [
            'request' => $request,
            'employees' => $employees,
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);
    
        $req = ManPowerRequest::findOrFail($id);
    
        foreach ($validated['employee_ids'] as $employeeId) {
            $employee = Employee::where('id', $employeeId)
                ->where('status', 'aktif') // sesuaikan dengan status di DB
                ->whereDoesntHave('schedules', function ($query) use ($req) {
                    $query->where('date', $req->date);
                })
                ->first();
    
            if (!$employee) {
                return back()->withErrors(['employee_ids' => 'Salah satu karyawan sudah tidak tersedia.']);
            }
    
            Schedule::create([
                'employee_id' => $employeeId,
                'sub_section_id' => $req->sub_section_id,
                'man_power_request_id' => $req->id,
                'date' => $req->date,
            ]);
    
            $employee->update(['status' => 'assigned']); // update status jika memang dibutuhkan
        }
    
        $req->status = 'fulfilled';
        $req->save();
    
        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
    
}
