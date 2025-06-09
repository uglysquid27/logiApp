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
use Illuminate\Support\Facades\Log; // Import the Log facade
use Illuminate\Support\Facades\Validator; // Import the Validator facade
use Illuminate\Validation\ValidationException;
use App\Rules\ShiftTimeOrder;

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
        try {
            // Consolidated Validation Block
            $request->validate([
                'sub_section_id' => ['required', 'exists:sub_sections,id'],
                'date' => ['required', 'date', 'after_or_equal:today'],
                'time_slots' => ['nullable', 'array'], // Ensure time_slots is an array

                // Validation rules for each item within the time_slots array
                // The keys (like '1', '2', '3') are the shift_ids.
                'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'], // Can be 0 or null if not requested
                'time_slots.*.start_time' => ['nullable', 'date_format:H:i:s', 'required_if:time_slots.*.requested_amount,>0'],
                'time_slots.*.end_time' => [
                    'nullable',
                    'date_format:H:i:s',
                    'required_if:time_slots.*.requested_amount,>0',
                    new ShiftTimeOrder('start_time', 'time_slots.*.end_time'),
                ],
            ], [
                // Custom validation messages
                'sub_section_id.required' => 'Sub Section harus dipilih.',
                'sub_section_id.exists' => 'Sub Section yang dipilih tidak valid.',
                'date.required' => 'Tanggal dibutuhkan harus diisi.',
                'date.date' => 'Format tanggal tidak valid.',
                'date.after_or_equal' => 'Tanggal tidak boleh kurang dari hari ini.',
                'time_slots.array' => 'Data slot waktu tidak valid.',

                'time_slots.*.requested_amount.integer' => 'Jumlah yang diminta harus berupa angka.',
                'time_slots.*.requested_amount.min' => 'Jumlah yang diminta minimal 0.',
                'time_slots.*.start_time.date_format' => 'Format waktu mulai tidak valid (HH:mm atau HH:mm:ss).',
                'time_slots.*.start_time.required_if' => 'Waktu mulai wajib diisi jika jumlah diminta lebih dari 0.',
                'time_slots.*.end_time.date_format' => 'Format waktu selesai tidak valid (HH:mm atau HH:mm:ss).',
                'time_slots.*.end_time.required_if' => 'Waktu selesai wajib diisi jika jumlah diminta lebih dari 0.',
            ]);

            DB::transaction(function () use ($request) {
                $subSectionId = $request->input('sub_section_id');
                $date = $request->input('date');
                $timeSlots = $request->input('time_slots', []);

                // Filter out time slots where requested_amount is 0 or null.
                // This ensures only relevant requests are created.
                $validTimeSlots = array_filter($timeSlots, function ($slot) {
                    // Check if 'requested_amount' is set and greater than 0
                    return isset($slot['requested_amount']) && (int) $slot['requested_amount'] > 0;
                });

                if (empty($validTimeSlots)) {
                    // If no valid time slots are submitted (all amounts are 0 or null), throw an error.
                    throw ValidationException::withMessages([
                        'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                    ]);
                }

                foreach ($validTimeSlots as $shiftId => $slot) {
                    ManPowerRequest::create([
                        'sub_section_id' => $subSectionId,
                        'date' => $date,
                        'shift_id' => $shiftId, // <-- Correctly get shiftId from the array key
                        'requested_amount' => $slot['requested_amount'],
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'status' => 'pending', // Default status
                    ]);
                }
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Manpower request created successfully!');

        } catch (ValidationException $e) {
            // If validation fails, return back with validation errors and old input
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            // Catch any other unexpected errors during the process (e.g., database errors)
            Log::error('Error creating manpower request: ' . $e->getMessage(), ['exception' => $e]);
            return back()->with('error', 'An unexpected error occurred. Please try again.')->withInput();
        }
    }
    public function edit(ManPowerRequest $manPowerRequest): Response
    {
        // Fetch all ManPowerRequests for the same date and sub_section_id
        // Eager load 'shift' for display in the edit form
        $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
            ->where('sub_section_id', $manPowerRequest->sub_section_id)
            ->with('shift')
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

     /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ManpowerRequest $manpowerRequest) // Assuming $manpowerRequest is the main request being updated (e.g., by ID)
    {
        try {
            // Consolidated Validation Block (same as store for relevant fields)
            $request->validate([
                'sub_section_id' => ['required', 'exists:sub_sections,id'],
                'date' => ['required', 'date', 'after_or_equal:today'],
                'time_slots' => ['nullable', 'array'], // Ensure time_slots is an array

                'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'],
                'time_slots.*.start_time' => ['nullable', 'date_format:H:i:s', 'required_if:time_slots.*.requested_amount,>0'],
                'time_slots.*.end_time' => [
                    'nullable',
                    'date_format:H:i:s',
                    'required_if:time_slots.*.requested_amount,>0',
                    new ShiftTimeOrder('start_time', 'time_slots.*.end_time'),
                ],
            ], [
                // Custom validation messages (can be reused from store)
                'sub_section_id.required' => 'Sub Section harus dipilih.',
                'sub_section_id.exists' => 'Sub Section yang dipilih tidak valid.',
                'date.required' => 'Tanggal dibutuhkan harus diisi.',
                'date.date' => 'Format tanggal tidak valid.',
                'date.after_or_equal' => 'Tanggal tidak boleh kurang dari hari ini.',
                'time_slots.array' => 'Data slot waktu tidak valid.',

                'time_slots.*.requested_amount.integer' => 'Jumlah yang diminta harus berupa angka.',
                'time_slots.*.requested_amount.min' => 'Jumlah yang diminta minimal 0.',
                'time_slots.*.start_time.date_format' => 'Format waktu mulai tidak valid (HH:mm atau HH:mm:ss).',
                'time_slots.*.start_time.required_if' => 'Waktu mulai wajib diisi jika jumlah diminta lebih dari 0.',
                'time_slots.*.end_time.date_format' => 'Format waktu selesai tidak valid (HH:mm atau HH:mm:ss).',
                'time_slots.*.end_time.required_if' => 'Waktu selesai wajib diisi jika jumlah diminta lebih dari 0.',
            ]);

            DB::transaction(function () use ($request, $manpowerRequest) {
                $subSectionId = $request->input('sub_section_id');
                $date = $request->input('date');
                $timeSlots = $request->input('time_slots', []); // All time slots, including those with 0 amount

                // Get current related ManpowerRequest entries for this specific request ID and date
                // IMPORTANT: If your `manpowerRequest` model represents ONE request (sub_section, date)
                // and `time_slots_details` are its children (e.g., using a hasMany relationship to a pivot table),
                // then you need to load the *children* related to `$manpowerRequest`.
                // However, based on your `store` method, it seems each 'manpower_request' record
                // itself represents a specific shift's request for a sub_section and date.
                // So, we'll query for all related manpower requests for the *same sub_section and date*
                // as the one currently being edited.
                // Assuming `manpowerRequest` being passed is the one being edited,
                // we need to update all records that match its sub_section_id and date.
                // This means the `manpowerRequest` variable passed to `update` isn't the primary key
                // of the overall request, but perhaps the ID of *one* of the shift requests.
                // This is a crucial distinction.

                // Let's assume the `update` method receives `manpowerRequest` as ONE of the ManpowerRequest records
                // that we need to base our update logic on (e.g., to identify the sub_section_id and date).
                // Or, if `manpowerRequest` is the *primary* ID of the overall request.
                // Given your `store` creates multiple ManpowerRequest records, it's more likely
                // `manpowerRequestData` in frontend represents the common parent attributes (sub_section_id, date)
                // and the backend needs to operate on *all* ManpowerRequest records matching these.

                // Let's refine the update logic based on the assumption that
                // `manpowerRequest` (the route model bound parameter) represents
                // *one of the records* associated with the group of shifts for a given sub_section_id and date.
                // We need to query for all records for *that specific sub_section_id and date*.

                $currentRequests = ManpowerRequest::where('sub_section_id', $subSectionId)
                                                ->where('date', $date)
                                                ->get()
                                                ->keyBy('shift_id'); // Key by shift_id for easy lookup

                $newOrUpdatedShiftIds = [];

                foreach ($timeSlots as $shiftId => $slot) {
                    $requestedAmount = $slot['requested_amount'] === '' ? 0 : (int) $slot['requested_amount'];
                    $startTime = $slot['start_time'];
                    $endTime = $slot['end_time'];

                    // Check if a request for this shift_id already exists for this sub_section_id and date
                    if ($existingRequest = $currentRequests->get($shiftId)) {
                        if ($requestedAmount > 0) {
                            // Update existing request
                            $existingRequest->update([
                                'requested_amount' => $requestedAmount,
                                'start_time' => $startTime,
                                'end_time' => $endTime,
                                'status' => 'pending', // Or maintain current status if not 'pending'
                            ]);
                            $newOrUpdatedShiftIds[] = $shiftId;
                        } else {
                            // Amount is 0 or null, delete the existing request
                            $existingRequest->delete();
                        }
                    } elseif ($requestedAmount > 0) {
                        // Create new request if it doesn't exist and amount is > 0
                        ManpowerRequest::create([
                            'sub_section_id' => $subSectionId,
                            'date' => $date,
                            'shift_id' => $shiftId,
                            'requested_amount' => $requestedAmount,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'status' => 'pending',
                        ]);
                        $newOrUpdatedShiftIds[] = $shiftId;
                    }
                    // If existingRequest is null and requestedAmount is 0, do nothing (no request to update/create)
                }

                // Final check: if after processing, no shifts have requested_amount > 0,
                // it implies the user submitted an empty or all-zero request.
                // This scenario should result in a validation error.
                if (empty($newOrUpdatedShiftIds)) {
                     throw ValidationException::withMessages([
                        'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                    ]);
                }
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Manpower request updated successfully!');

        } catch (ValidationException $e) {
            Log::error('Manpower Request Validation Error:', $e->errors());
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating Manpower Request:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Failed to update manpower request: ' . $e->getMessage());
        }
    }

    public function destroy(ManPowerRequest $manPowerRequest)
    {
        return back()->with('error', 'Delete functionality not yet implemented.');
    }
}
