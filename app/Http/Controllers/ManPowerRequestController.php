<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ManPowerRequestController extends Controller
{
    public function index(): Response
    {
        // Now eager load 'shift' as it's back in ManPowerRequest
        $requests = ManPowerRequest::with(['subSection.section', 'shift'])
                                   ->orderBy('date', 'desc')
                                   ->orderBy('created_at', 'desc')
                                   ->paginate(10);

        return Inertia::render('ManpowerRequests/Index', [
            'requests' => $requests,
        ]);
    }

    public function create(): Response
    {
        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all(); // Shifts are now explicitly needed for the form

        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'time_slots' => 'required|array|min:1', // Expect an array of time slots
            'time_slots.*.shift_id' => 'required|exists:shifts,id', // NEW: Validate shift_id
            'time_slots.*.requested_amount' => 'required|integer|min:1', // Each slot must have amount > 0
            'time_slots.*.start_time' => 'required|date_format:H:i', // Each slot must have start_time
            'time_slots.*.end_time' => 'required|date_format:H:i|after:time_slots.*.start_time', // Each slot must have end_time and be after start_time
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['time_slots'] as $slot) {
                ManPowerRequest::create([
                    'sub_section_id' => $validated['sub_section_id'],
                    'date' => $validated['date'],
                    'shift_id' => $slot['shift_id'], // NEW: Include shift_id
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'requested_amount' => $slot['requested_amount'],
                    'status' => 'pending',
                ]);
            }
        });

        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil dibuat.');
    }

    public function edit(ManPowerRequest $manPowerRequest): Response
    {
        // Fetch all ManPowerRequests for the same date and sub_section_id
        // Eager load 'shift' for display in the edit form
        $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
                                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                                           ->with('shift') // Re-added eager loading for shift
                                           ->get();

        // Reconstruct time_slots for the form, keyed by shift_id
        $timeSlots = [];
        foreach ($relatedRequests as $req) {
            $timeSlots[$req->shift_id] = [ // Key by shift_id
                'id' => $req->id,
                'requested_amount' => $req->requested_amount,
                'start_time' => $req->start_time,
                'end_time' => $req->end_time,
            ];
        }

        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all(); // Shifts are needed to build the form structure

        $formData = [
            'id' => $manPowerRequest->id,
            'sub_section_id' => $manPowerRequest->sub_section_id,
            'date' => Carbon::parse($manPowerRequest->date)->format('Y-m-d'),
            'time_slots' => $timeSlots, // Array of time slot objects, keyed by shift_id
        ];

        return Inertia::render('ManpowerRequests/Edit', [
            'manpowerRequestData' => $formData,
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    public function update(Request $request, ManPowerRequest $manPowerRequest)
    {
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'time_slots' => 'required|array', // Can be empty if all amounts are 0
            'time_slots.*.shift_id' => 'required|exists:shifts,id',
            'time_slots.*.requested_amount' => 'required|integer|min:0', // Allow 0 for update
            'time_slots.*.start_time' => 'required_if:time_slots.*.requested_amount,>,0|date_format:H:i', // Required only if amount > 0
            'time_slots.*.end_time' => 'required_if:time_slots.*.requested_amount,>,0|date_format:H:i|after:time_slots.*.start_time', // Required only if amount > 0 and after start
        ]);

        if ($manPowerRequest->status === 'fulfilled') {
            return back()->withErrors(['status' => 'Request yang sudah terpenuhi tidak dapat diubah.']);
        }

        // Ensure at least one request has amount > 0 if time_slots is not empty
        $hasValidRequest = false;
        foreach ($validated['time_slots'] as $slot) {
            if ($slot['requested_amount'] > 0) {
                $hasValidRequest = true;
                break;
            }
        }

        if (!$hasValidRequest && !empty($validated['time_slots'])) {
            return back()->withErrors(['time_slots' => 'Setidaknya satu slot shift harus memiliki jumlah yang diminta lebih dari 0.']);
        }


        DB::transaction(function () use ($validated, $manPowerRequest) {
            // Delete all existing ManPowerRequests for this specific date and sub_section
            ManPowerRequest::where('date', $manPowerRequest->date)
                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                           ->delete();

            // Recreate ManPowerRequest records based on the submitted data
            foreach ($validated['time_slots'] as $slot) {
                if ($slot['requested_amount'] > 0) { // Only create if amount is positive
                    ManPowerRequest::create([
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $slot['shift_id'], // Include shift_id
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'requested_amount' => $slot['requested_amount'],
                        'status' => 'pending',
                    ]);
                }
            }
        });

        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil diperbarui.');
    }

    public function destroy(ManPowerRequest $manPowerRequest)
    {
        return back()->with('error', 'Delete functionality not yet implemented.');
    }
}
