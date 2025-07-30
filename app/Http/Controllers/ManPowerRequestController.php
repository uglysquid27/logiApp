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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Rules\ShiftTimeOrder;
use App\Models\Employee; // Pastikan ini sudah ada

class ManPowerRequestController extends Controller
{
    public function index(): Response
    {
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
        $shifts = Shift::all();

        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    public function checkDuplicates(Request $request)
    {
        $validated = $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'shift_ids' => 'required|array',
            'shift_ids.*' => 'exists:shifts,id',
        ]);
    
        $duplicates = ManPowerRequest::where('sub_section_id', $validated['sub_section_id'])
            ->whereDate('date', $validated['date'])
            ->whereIn('shift_id', $validated['shift_ids'])
            ->where('status', '!=', 'rejected')
            ->with('shift')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'shift_id' => $request->shift_id,
                    'shift_name' => $request->shift->name,
                    'requested_amount' => $request->requested_amount,
                    'status' => $request->status,
                    'is_additional' => $request->is_additional,
                ];
            });
    
        return response()->json([
            'duplicates' => $duplicates,
            'has_duplicates' => $duplicates->isNotEmpty(),
        ]);
    }

    public function store(Request $request)
{
    Log::info('Manpower request submission started', ['request_data' => $request->all()]);

    try {
        $validated = $request->validate([
            'sub_section_id' => ['required', 'exists:sub_sections,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'time_slots' => ['nullable', 'array'],
            'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.male_count' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.female_count' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.start_time' => [
                'nullable',
                'date_format:H:i:s',
                'required_with:time_slots.*.requested_amount'
            ],
            'time_slots.*.end_time' => [
                'nullable',
                'date_format:H:i:s',
                'required_with:time_slots.*.requested_amount',
                new ShiftTimeOrder('time_slots.*.start_time', 'time_slots.*.end_time'),
            ],
            'time_slots.*.reason' => [
                'nullable',
                'string',
                'min:10',
                'required_if:time_slots.*.is_additional,true'
            ],
            'time_slots.*.is_additional' => ['nullable', 'boolean'],
        ], [
            'sub_section_id.required' => 'Sub Section harus dipilih.',
            'date.required' => 'Tanggal dibutuhkan harus diisi.',
            'time_slots.*.requested_amount.min' => 'Jumlah yang diminta harus lebih dari 0.',
            'time_slots.*.male_count.min' => 'Jumlah laki-laki tidak boleh negatif.',
            'time_slots.*.female_count.min' => 'Jumlah perempuan tidak boleh negatif.',
            'time_slots.*.reason.required_if' => 'Alasan harus diisi untuk permintaan tambahan.',
            'time_slots.*.reason.min' => 'Alasan harus minimal 10 karakter.',
        ]);

        Log::info('Validation passed', ['validated_data' => $validated]);

        // Check if at least one time slot has requested_amount > 0
        $hasValidRequest = collect($validated['time_slots'] ?? [])
            ->contains(fn ($slot) => ($slot['requested_amount'] ?? 0) > 0);

        if (!$hasValidRequest) {
            Log::warning('No valid time slots found');
            throw ValidationException::withMessages([
                'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
            ]);
        }

        Log::info('Starting database transaction');
        DB::transaction(function () use ($validated) {
            foreach ($validated['time_slots'] as $shiftId => $slot) {
                $requestedAmount = (int) ($slot['requested_amount'] ?? 0);
                Log::debug('Processing shift', ['shift_id' => $shiftId, 'slot_data' => $slot]);
                
                if ($requestedAmount > 0) {
                    $isAdditional = $slot['is_additional'] ?? false;
                    
                    if (!$isAdditional && ManPowerRequest::hasExistingRequest(
                        $validated['sub_section_id'],
                        $shiftId,
                        $validated['date']
                    )) {
                        $isAdditional = true;
                        Log::debug('Marking as additional due to existing request', ['shift_id' => $shiftId]);
                    }
    
                    Log::info('Creating manpower request', [
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $requestedAmount,
                        'is_additional' => $isAdditional
                    ]);
                    
                    ManPowerRequest::create([
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $requestedAmount,
                        'male_count' => (int) ($slot['male_count'] ?? 0),
                        'female_count' => (int) ($slot['female_count'] ?? 0),
                        'start_time' => $slot['start_time'] ?? null,
                        'end_time' => $slot['end_time'] ?? null,
                        'reason' => $isAdditional ? ($slot['reason'] ?? 'Duplicate request') : null,
                        'is_additional' => $isAdditional,
                        'status' => 'pending',
                    ]);
                }
            }
        });

        Log::info('Manpower request created successfully');
        return redirect()->route('manpower-requests.index')
            ->with('success', 'Permintaan tenaga kerja berhasil dibuat!');

    } catch (ValidationException $e) {
        Log::error('Validation failed', ['errors' => $e->errors()]);
        return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
        Log::error('Error creating manpower request: ' . $e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString()
        ]);
        return back()->with('error', 'Terjadi kesalahan. Silakan coba lagi.')->withInput();
    }
}

public function update(Request $request, ManPowerRequest $manpowerRequest)
{
    try {
        if (!in_array($manpowerRequest->status, ['pending', 'revision_requested'])) {
            abort(403, 'Permintaan ini tidak dapat diperbarui karena statusnya ' . $manpowerRequest->status);
        }

        $validated = $request->validate([
            'sub_section_id' => ['required', 'exists:sub_sections,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'time_slots' => ['nullable', 'array'],
            'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.male_count' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.female_count' => ['nullable', 'integer', 'min:0'],
            'time_slots.*.start_time' => ['nullable', 'date_format:H:i:s', 'required_if:time_slots.*.requested_amount,>0'],
            'time_slots.*.end_time' => [
                'nullable',
                'date_format:H:i:s',
                'required_if:time_slots.*.requested_amount,>0',
                new ShiftTimeOrder('start_time', 'time_slots.*.end_time'),
            ],
        ]);

        DB::transaction(function () use ($validated, $manpowerRequest) {
            $existingRequests = ManPowerRequest::where('date', $manpowerRequest->date)
                ->where('sub_section_id', $manpowerRequest->sub_section_id)
                ->get()
                ->keyBy('shift_id');

            $hasValidSlots = false;
            $processedShifts = [];

            foreach ($validated['time_slots'] as $shiftId => $slot) {
                $requestedAmount = (int) $slot['requested_amount'];
                // Convert string numbers to integers for gender counts
                $maleCount = is_numeric($slot['male_count']) ? (int)$slot['male_count'] : 0;
                $femaleCount = is_numeric($slot['female_count']) ? (int)$slot['female_count'] : 0;

                if ($requestedAmount > 0) {
                    $hasValidSlots = true;
                    $existing = $existingRequests->get($shiftId);

                    if ($existing) {
                        $existing->update([
                            'sub_section_id' => $validated['sub_section_id'],
                            'date' => $validated['date'],
                            'requested_amount' => $requestedAmount,
                            'male_count' => $maleCount,
                            'female_count' => $femaleCount,
                            'start_time' => $slot['start_time'],
                            'end_time' => $slot['end_time'],
                            'status' => 'pending',
                        ]);
                    } else {
                        ManPowerRequest::create([
                            'sub_section_id' => $validated['sub_section_id'],
                            'date' => $validated['date'],
                            'shift_id' => $shiftId,
                            'requested_amount' => $requestedAmount,
                            'male_count' => $maleCount,
                            'female_count' => $femaleCount,
                            'start_time' => $slot['start_time'],
                            'end_time' => $slot['end_time'],
                            'status' => 'pending',
                        ]);
                    }
                    $processedShifts[] = $shiftId;
                }
            }

            foreach ($existingRequests as $shiftId => $request) {
                if (!in_array($shiftId, $processedShifts)) {
                    $request->delete();
                }
            }

            if (!$hasValidSlots) {
                throw ValidationException::withMessages([
                    'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                ]);
            }
        });

        return redirect()->route('manpower-requests.index')->with('success', 'Permintaan tenaga kerja berhasil diperbarui!');

    } catch (ValidationException $e) {
        return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
        Log::error('Error updating manpower request: ' . $e->getMessage());
        return back()->with('error', 'Terjadi kesalahan. Silakan coba lagi.')->withInput();
    }
}

    public function edit(string $id): Response
{
    $manPowerRequest = ManPowerRequest::findOrFail($id);
    
    // Only allow editing if status is pending or revision_requested
    if (!in_array($manPowerRequest->status, ['pending', 'revision_requested'])) {
        abort(403, 'Permintaan ini tidak dapat diedit karena statusnya ' . $manPowerRequest->status);
    }

    $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
        ->where('sub_section_id', $manPowerRequest->sub_section_id)
        ->with('shift')
        ->get();

    $timeSlots = [];
    foreach ($relatedRequests as $req) {
        $timeSlots[$req->shift_id] = [
            'id' => $req->id,
            'requested_amount' => $req->requested_amount,
            'male_count' => $req->male_count,
            'female_count' => $req->female_count,
            'start_time' => $req->start_time,
            'end_time' => $req->end_time,
        ];
    }

    // Parse the date safely
    try {
        $date = Carbon::parse((string) $manPowerRequest->date)->format('Y-m-d');
    } catch (\Exception $e) {
        $date = now()->format('Y-m-d'); // fallback to today if parsing fails
    }

    return Inertia::render('ManpowerRequests/Edit', [
        'manpowerRequestData' => [
            'id' => $manPowerRequest->id,
            'sub_section_id' => $manPowerRequest->sub_section_id,
            'date' => $date,
            'time_slots' => $timeSlots,
            'status' => $manPowerRequest->status,
        ],
        'subSections' => SubSection::with('section')->get(),
        'shifts' => Shift::all(),
    ]);
}

public function destroy($id)
{
    try {
        DB::beginTransaction();

        $manPowerRequest = ManPowerRequest::with('schedules.employee')->findOrFail($id); // Eager load schedules and employees

        Log::info('Attempting to delete manpower request', [
            'request_id' => $manPowerRequest->id,
            'user_id' => auth()->id(),
            'status' => $manPowerRequest->status
        ]);

        // Logic to update employee status from 'assigned' to 'available'
        if ($manPowerRequest->schedules->isNotEmpty()) {
            Log::info('Updating employee statuses to available for schedules related to deleted request', [
                'request_id' => $manPowerRequest->id,
                'schedule_count' => $manPowerRequest->schedules->count()
            ]);
            foreach ($manPowerRequest->schedules as $schedule) {
                if ($schedule->employee) {
                    $employee = $schedule->employee;
                    // Only change status if it's currently 'assigned'
                    if ($employee->status === 'assigned') {
                        $employee->status = 'available';
                        $employee->save();
                        Log::debug("Employee ID {$employee->id} status changed to 'available'.");
                    }
                }
            }
        }

        // Allow deletion for fulfilled requests with confirmation
        if ($manPowerRequest->status === 'fulfilled') {
            // Additional check - maybe verify with another condition
            if ($manPowerRequest->created_at->diffInDays(now()) > 7) {
                Log::warning('Attempt to delete fulfilled request older than 7 days', [
                    'request_id' => $manPowerRequest->id,
                    'status' => $manPowerRequest->status,
                    'user_id' => auth()->id()
                ]);
                DB::rollBack(); // Rollback any changes if deletion is disallowed
                return back()->with('error', 'Cannot delete fulfilled requests older than 7 days');
            }
        }
        // Original status check
        elseif (!in_array($manPowerRequest->status, ['pending', 'revision_requested'])) {
            Log::warning('Invalid delete attempt', [
                'request_id' => $manPowerRequest->id,
                'status' => $manPowerRequest->status,
                'user_id' => auth()->id()
            ]);
            DB::rollBack(); // Rollback any changes if deletion is disallowed
            return back()->with('error', 'Cannot delete request in current status');
        }

        // Delete the manpower request, which will also cascade delete its schedules
        $manPowerRequest->delete();

        DB::commit();

        Log::info('Successfully deleted request', [
            'request_id' => $id,
            'user_id' => auth()->id()
        ]);

        return redirect()->route('manpower-requests.index')
            ->with('success', 'Request deleted successfully');

    } catch (\Exception $e) {
        DB::rollBack();
        
        Log::error('Delete failed', [
            'error' => $e->getMessage(),
            'request_id' => $id ?? 'unknown',
            'user_id' => auth()->id(),
            'trace' => $e->getTraceAsString()
        ]);

        return back()->with('error', 'Failed to delete request');
    }
}
    public function fulfill(ManPowerRequest $manPowerRequest)
    {
        try {
            $manPowerRequest->update(['status' => 'fulfilled']);
            return back()->with('success', 'Permintaan telah dipenuhi!');
        } catch (\Exception $e) {
            Log::error('Error fulfilling manpower request: ' . $e->getMessage());
            return back()->with('error', 'Gagal memenuhi permintaan. Silakan coba lagi.');
        }
    }

    public function requestRevision(ManPowerRequest $manPowerRequest)
    {
        try {
            DB::transaction(function () use ($manPowerRequest) {
                $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
                    ->where('sub_section_id', $manPowerRequest->sub_section_id)
                    ->get();

                if ($relatedRequests->isEmpty()) {
                    // This shouldn't happen if $manPowerRequest exists, but good for robustness
                    throw new \Exception("No related requests found for revision.");
                }

                foreach ($relatedRequests as $req) {
                    // Only process if it's currently fulfilled, or any other status you allow to initiate revision
                    if ($req->status === 'fulfilled') {
                        // Iterate through schedules and update employee status before deleting schedules
                        if ($req->schedules->isNotEmpty()) {
                            foreach ($req->schedules as $schedule) {
                                if ($schedule->employee) {
                                    $employee = $schedule->employee;
                                    // Change status only if it was 'assigned' due to this request
                                    // (assuming 'assigned' means assigned to a request)
                                    if ($employee->status === 'assigned') { 
                                        $employee->status = 'available';
                                        $employee->save();
                                        Log::debug("Employee ID {$employee->id} status changed to 'available' during revision.");
                                    }
                                }
                            }
                        }
                        // Delete related schedules
                        $req->schedules()->delete();
                        Log::info("Schedules for ManPowerRequest ID: {$req->id} deleted due to revision request.");

                        // Update the status
                        $req->update(['status' => 'revision_requested']);
                        Log::info("ManPowerRequest ID: {$req->id} status updated to 'revision_requested'.");
                    }
                    // If the request is already 'revision_requested', we don't need to do anything.
                    // If it's 'pending' or 'rejected', you might want to handle that logic here too,
                    // but for "Revisi" from 'fulfilled', this check is crucial.
                }
            });

            // After the transaction commits, return a response.
            // Inertia will then handle the client-side redirect in onSuccess.
            return response()->json(['message' => 'Revision initiated successfully. Status changed to revision_requested.']);

        } catch (\Exception $e) {
            Log::error('Error in requestRevision: ' . $e->getMessage(), ['manpower_request_id' => $manPowerRequest->id]);
            return response()->json(['message' => 'Failed to initiate revision.', 'error' => $e->getMessage()], 500);
        }
    }
}