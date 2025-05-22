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
            Schedule::create([
                'employee_id' => $employeeId,
                'sub_section_id' => $req->sub_section_id,
                'man_power_request_id' => $req->id,
                'date' => $req->date,
            ]);
        }

        // Update status request jadi 'fulfilled'
        $req->status = 'fulfilled';
        $req->save();

        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
}
