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

    public function store(Request $request)
    {
        try {
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
            ], [
                'sub_section_id.required' => 'Sub Section harus dipilih.',
                'date.required' => 'Tanggal dibutuhkan harus diisi.',
                'time_slots.*.male_count.min' => 'Jumlah laki-laki tidak boleh negatif.',
                'time_slots.*.female_count.min' => 'Jumlah perempuan tidak boleh negatif.',
            ]);

            DB::transaction(function () use ($validated) {
                $validTimeSlots = array_filter($validated['time_slots'], function ($slot) {
                    return isset($slot['requested_amount']) && (int) $slot['requested_amount'] > 0;
                });

                if (empty($validTimeSlots)) {
                    throw ValidationException::withMessages([
                        'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                    ]);
                }

                foreach ($validTimeSlots as $shiftId => $slot) {
                    ManPowerRequest::create([
                        'sub_section_id' => $validated['sub_section_id'],
                        'date' => $validated['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $slot['requested_amount'],
                        'male_count' => $slot['male_count'] ?? 0,
                        'female_count' => $slot['female_count'] ?? 0,
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'status' => 'pending',
                    ]);
                }
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Permintaan tenaga kerja berhasil dibuat!');

        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating manpower request: ' . $e->getMessage());
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

        return Inertia::render('ManpowerRequests/Edit', [
            'manpowerRequestData' => [
                'id' => $manPowerRequest->id,
                'sub_section_id' => $manPowerRequest->sub_section_id,
                'date' => $manPowerRequest->date->format('Y-m-d'),
                'time_slots' => $timeSlots,
                'status' => $manPowerRequest->status,
            ],
            'subSections' => SubSection::with('section')->get(),
            'shifts' => Shift::all(),
        ]);
    }

    public function update(Request $request, ManPowerRequest $manpowerRequest)
    {
        try {
            // Only allow updating if status is pending or revision_requested
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
                    $maleCount = (int) ($slot['male_count'] ?? 0);
                    $femaleCount = (int) ($slot['female_count'] ?? 0);

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
                                'status' => 'pending', // Reset status to pending when updated
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

                // Delete unprocessed shifts
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

    public function destroy(ManPowerRequest $manPowerRequest)
    {
        try {
            DB::transaction(function () use ($manPowerRequest) {
                ManPowerRequest::where('sub_section_id', $manPowerRequest->sub_section_id)
                    ->where('date', $manPowerRequest->date)
                    ->delete();
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Permintaan tenaga kerja berhasil dihapus!');
        } catch (\Exception $e) {
            Log::error('Error deleting manpower request: ' . $e->getMessage());
            return back()->with('error', 'Gagal menghapus permintaan. Silakan coba lagi.');
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
                // Find all related requests by date and sub_section_id
                // Assuming 'fulfilled' requests are grouped this way.
                // If each row in your table UI is a distinct ManPowerRequest model,
                // then you might just need to update $manPowerRequest directly.
                // However, based on your previous discussion, you group them.
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
                        // Delete related schedules (if they exist)
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