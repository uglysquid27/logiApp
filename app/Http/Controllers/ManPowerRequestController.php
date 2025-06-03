<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB; // Import DB for transactions
use Carbon\Carbon; // Import Carbon for date manipulation

class ManPowerRequestController extends Controller
{
    public function index(): Response
    {
        // This is the existing index method, unchanged for this request.
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
        // This is the existing create method, unchanged for this request.
        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all(); // Assuming shifts are always needed for creation

        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    public function store(Request $request)
    {
        // This is the existing store method, unchanged for this request.
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'requested_amounts_by_shift' => 'array',
            'requested_amounts_by_shift.*' => 'nullable|integer|min:0',
        ]);

        // Filter out empty or zero amounts and ensure at least one request is made
        $hasValidRequest = false;
        foreach ($validated['requested_amounts_by_shift'] as $shiftId => $amount) {
            if ($amount > 0) {
                $hasValidRequest = true;
                break;
            }
        }

        if (!$hasValidRequest) {
            return back()->withErrors(['requested_amounts_by_shift' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.']);
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['requested_amounts_by_shift'] as $shiftId => $amount) {
                if ($amount > 0) { // Only create requests for shifts with a positive amount
                    ManPowerRequest::create([
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $amount,
                        'status' => 'pending',
                    ]);
                }
            }
        });

        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil dibuat.');
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\ManPowerRequest  $manPowerRequest
     * @return \Inertia\Response
     */
    public function edit(ManPowerRequest $manPowerRequest): Response
    {
        // Fetch all ManPowerRequests for the same date and sub_section_id
        // This is crucial because a single logical "request" (date + sub_section)
        // can span multiple ManPowerRequest records (one per shift).
        $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
                                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                                           ->with('shift') // Eager load shift to get shift_id and name
                                           ->get();

        // Reconstruct requested_amounts_by_shift for the form
        $requestedAmountsByShift = [];
        foreach ($relatedRequests as $req) {
            $requestedAmountsByShift[$req->shift_id] = $req->requested_amount;
        }

        // Fetch all sub-sections and shifts for dropdowns
        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all();

        // Prepare the data structure for the frontend
        $formData = [
            'id' => $manPowerRequest->id, // Pass the ID of the original request for the update route
            'sub_section_id' => $manPowerRequest->sub_section_id,
            // FIX: Ensure date is a Carbon instance before formatting
            'date' => Carbon::parse($manPowerRequest->date)->format('Y-m-d'),
            'requested_amounts_by_shift' => $requestedAmountsByShift,
        ];

        return Inertia::render('ManpowerRequests/Edit', [
            'manpowerRequestData' => $formData,
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\ManPowerRequest  $manPowerRequest
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, ManPowerRequest $manPowerRequest)
    {
        // Validate incoming data
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'requested_amounts_by_shift' => 'array',
            'requested_amounts_by_shift.*' => 'nullable|integer|min:0',
        ]);

        // Prevent editing if the request is already fulfilled
        // This check is important as the status might have changed since the edit page was loaded.
        if ($manPowerRequest->status === 'fulfilled') {
            return back()->withErrors(['status' => 'Request yang sudah terpenuhi tidak dapat diubah.']);
        }

        // Filter out empty or zero amounts and ensure at least one request is made
        $hasValidRequest = false;
        foreach ($validated['requested_amounts_by_shift'] as $shiftId => $amount) {
            if ($amount > 0) {
                $hasValidRequest = true;
                break;
            }
        }

        if (!$hasValidRequest) {
            return back()->withErrors(['requested_amounts_by_shift' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.']);
        }

        DB::transaction(function () use ($validated, $manPowerRequest) {
            // Delete all existing ManPowerRequests for this specific date and sub_section
            // This ensures we replace all related requests with the new set.
            ManPowerRequest::where('date', $manPowerRequest->date)
                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                           ->delete();

            // Recreate ManPowerRequest records based on the submitted data
            foreach ($validated['requested_amounts_by_shift'] as $shiftId => $amount) {
                if ($amount > 0) {
                    ManPowerRequest::create([
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $amount,
                        'status' => 'pending', // Status remains pending after edit
                    ]);
                }
            }
        });

        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\ManPowerRequest  $manPowerRequest
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(ManPowerRequest $manPowerRequest)
    {
        // This is a placeholder for a destroy method if you wish to add it later.
        // For now, it's not implemented as per the request.
        return back()->with('error', 'Delete functionality not yet implemented.');
    }
}
