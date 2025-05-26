<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Schedule;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator; // Added Validator
use Inertia\Inertia;

class ManPowerRequestController extends Controller
{
    public function index()
    {
        $requests = ManPowerRequest::with(['subSection', 'shift'])
            ->latest()
            ->paginate(10); // <= hanya 10 data per halaman
    
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
        $validatedData = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date',
            'requested_amounts_by_shift' => 'required|array',
            // Individual amounts will be validated inside the loop
        ]);

        $createdCount = 0;
        $errors = [];

        foreach ($validatedData['requested_amounts_by_shift'] as $shift_id => $amount) {
            // Skip if amount is not provided or is zero
            if (empty($amount) || $amount == 0) {
                continue;
            }

            $shiftSpecificValidator = Validator::make(
                ['shift_id' => $shift_id, 'requested_amount' => $amount],
                [
                    'shift_id' => 'required|exists:shifts,id',
                    'requested_amount' => 'required|integer|min:1',
                ],
                [
                    // Custom messages referencing the shift might be tricky here if shift names aren't easily available
                    // For simplicity, using generic messages or just field names for now.
                    // Example: "requested_amounts_by_shift.{$shift_id}.requested_amount.min" => "Amount for shift needs to be at least 1"
                    // For now, the default messages from Validator will be used, prefixed by the field name.
                ]
            );
            
            // If validation for this specific shift fails, collect errors and continue to check others
            // This allows displaying all errors at once if multiple shifts have issues.
            if ($shiftSpecificValidator->fails()) {
                // Prefix errors with the dynamic field name for better display in the view
                foreach ($shiftSpecificValidator->errors()->toArray() as $key => $messages) {
                    $errors["requested_amounts_by_shift.{$shift_id}.{$key}"] = $messages;
                }
                continue; // Continue to validate other shift amounts
            }
            
            // If there were errors from other iterations, but this one is valid, we still should not proceed to create
            // until all inputs are validated. The check for $errors below handles this.
        }

        // If any errors were collected from any of the shift validations, redirect back.
        if (!empty($errors)) {
            return redirect()->back()
                ->withErrors($errors)
                ->withInput();
        }

        // If all validations passed (initial and all iterated ones), proceed to create.
        foreach ($validatedData['requested_amounts_by_shift'] as $shift_id => $amount) {
            if (empty($amount) || $amount == 0) {
                continue;
            }
            // We've already validated, so we can safely use $amount and $shift_id
            ManPowerRequest::create([
                'sub_section_id' => $validatedData['sub_section_id'],
                'date' => $validatedData['date'],
                'shift_id' => $shift_id,
                'requested_amount' => $amount,
                'status' => 'pending',
            ]);
            $createdCount++;
        }

        if ($createdCount > 0) {
            return redirect()->route('manpower-requests.index')->with('success', $createdCount . ' manpower request(s) created successfully.');
        } else {
            return redirect()->route('manpower-requests.index')->with('info', 'No manpower amounts were specified for any shift.');
        }
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