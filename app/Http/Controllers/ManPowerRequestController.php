<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Schedule;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManPowerRequestController extends Controller
{
    public function index()
    {
        $requests = ManPowerRequest::with(['subSection', 'shift'])->get();
    
        return Inertia::render('ManpowerRequests/Index', [
            'requests' => $requests,
        ]);
    }
    

    public function create()
    {
        $subSections = SubSection::all();
        $shifts = Shift::all();
        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'shift_id' => 'required|exists:shifts,id',
            'date' => 'required|date',
            'requested_amount' => 'required|integer|min:1',
        ]);

        ManPowerRequest::create([
            'sub_section_id' => $request->sub_section_id,
            'shift_id' => $request->shift_id,
            'date' => $request->date,
            'requested_amount' => $request->requested_amount,
            'status' => 'pending',
        ]);

        return redirect()->route('manpower-requests.index');
    }

    public function fulfill(Request $request, $id)
{
    $validated = $request->validate([
        'employee_ids' => 'required|array',
        'employee_ids.*' => 'exists:employees,id',
    ]);

    $manpowerRequest = ManPowerRequest::with('subSection')->findOrFail($id);
    $manpowerRequest->employees()->sync($validated['employee_ids']);
    $manpowerRequest->status = 'terpenuhi';
    $manpowerRequest->save();

    // Buat schedule untuk setiap employee
    foreach ($validated['employee_ids'] as $empId) {
        Schedule::create([
            'employee_id' => $empId,
            'sub_section_id' => $manpowerRequest->sub_section_id,
            'date' => $manpowerRequest->date,
            'man_power_request_id' => $manpowerRequest->id,
        ]);
    }

    return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dijadwalkan.');
}
}