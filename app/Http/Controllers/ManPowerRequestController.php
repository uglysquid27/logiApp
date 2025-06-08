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

    public function update(Request $request, ManPowerRequest $manPowerRequest)
    {
        Log::info('Raw incoming ManPowerRequest update data: ', $request->all());

        // FIX: Validation rules for update mirror store method's new approach
        $validator = Validator::make($request->all(), [
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'time_slots' => 'required|array|min:1',
            'time_slots.*.shift_id' => 'required|exists:shifts,id',
            'time_slots.*.requested_amount' => 'required|integer|min:1',
            'time_slots.*.start_time' => 'required|date_format:H:i:s,H:i', // Allow H:i:s format for input
            'time_slots.*.end_time' => [
                'required',
                'date_format:H:i:s,H:i',
                function ($attribute, $value, $fail) use ($request) {
                    $parts = explode('.', $attribute);
                    $index = $parts[1];
                    $startTime = $request->input("time_slots.{$index}.start_time");

                    try {
                        $startCarbon = Carbon::parse($startTime);
                        $endCarbon = Carbon::parse($value);

                        if ($endCarbon->lt($startCarbon)) {
                            return;
                        }

                        if (!$endCarbon->greaterThan($startCarbon)) {
                            $fail('The ' . str_replace('_', ' ', $parts[2]) . ' field must be after its start time (or imply the next day if crossing midnight).');
                        }
                    } catch (\Exception $e) {
                        Log::error('Time parsing error in custom validation (update): ' . $e->getMessage(), ['attribute' => $attribute, 'value' => $value, 'start_time' => $startTime]);
                        $fail('The ' . str_replace('_', ' ', $parts[2]) . ' field has an invalid time format.');
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            Log::error('ManPowerRequest update validation errors:', $validator->errors()->toArray());
            return redirect()->back()->withErrors($validator->errors());
        }

        $validated = $validator->validated();

        if ($manPowerRequest->status === 'fulfilled') {
            return back()->withErrors(['status' => 'Request yang sudah terpenuhi tidak dapat diubah.']);
        }

        $slotsToProcess = $validated['time_slots'];

        DB::beginTransaction();
        try {
            // Delete all existing ManPowerRequests for this specific date and sub_section
            ManPowerRequest::where('date', $manPowerRequest->date)
                ->where('sub_section_id', $manPowerRequest->sub_section_id)
                ->delete();

            // Recreate ManPowerRequest records based on the submitted validated data
            foreach ($slotsToProcess as $slot) {
                ManPowerRequest::create([
                    'sub_section_id' => $validated['sub_section_id'],
                    'date' => $validated['date'],
                    'shift_id' => $slot['shift_id'],
                    'start_time' => Carbon::parse($slot['start_time'])->format('H:i'), // Store as H:i
                    'end_time' => Carbon::parse($slot['end_time'])->format('H:i'),     // Store as H:i
                    'requested_amount' => $slot['requested_amount'],
                    'status' => 'pending',
                ]);
            }
            DB::commit();
            Log::info('ManPowerRequest(s) successfully updated.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Database transaction failed for ManPowerRequest update: ' . $e->getMessage(), [
                'exception' => $e,
                'validated_data' => $validated,
            ]);
            return redirect()->back()->withErrors(['database_error' => 'Terjadi kesalahan saat menyimpan perubahan. Mohon coba lagi.']);
        }


        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil diperbarui.');
    }

    public function destroy(ManPowerRequest $manPowerRequest)
    {
        return back()->with('error', 'Delete functionality not yet implemented.');
    }
}
