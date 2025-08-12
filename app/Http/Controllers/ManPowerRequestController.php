<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\Section;
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
use App\Models\Employee;

class ManPowerRequestController extends Controller
{
    public function index(): Response
    {
        $requests = ManPowerRequest::with(['subSection.section', 'shift'])
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $sections = Section::with('subSections')->get();

        return Inertia::render('ManpowerRequests/Index', [
            'requests' => $requests,
            'sections' => $sections,
        ]);
    }

    public function create(): Response
    {
        $sections = Section::with('subSections')->get();
        $shifts = Shift::all();

        return Inertia::render('ManpowerRequests/Create', [
            'sections' => $sections,
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
        Log::info('ManPowerRequest submission initiated', [
            'user_id' => auth()->id(),
            'request_data' => $request->all(),
            'ip_address' => $request->ip(),
        ]);

        try {
            $validated = $request->validate([
                'requests' => ['required', 'array', 'min:1'],
                'requests.*.sub_section_id' => ['required', 'exists:sub_sections,id'],
                'requests.*.date' => ['required', 'date', 'after_or_equal:today'],
                'requests.*.time_slots' => ['required', 'array', 'min:1'],
                'requests.*.time_slots.*.requested_amount' => ['required', 'integer', 'min:1'],
                'requests.*.time_slots.*.male_count' => ['required', 'integer', 'min:0'],
                'requests.*.time_slots.*.female_count' => ['required', 'integer', 'min:0'],
                'requests.*.time_slots.*.start_time' => ['nullable', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
                'requests.*.time_slots.*.end_time' => ['nullable', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/'],
                'requests.*.time_slots.*.reason' => ['nullable', 'string', 'min:10'],
                'requests.*.time_slots.*.is_additional' => ['nullable', 'boolean'],
            ]);

            // Additional validation for time order and format conversion
            foreach ($validated['requests'] as $requestIndex => $requestData) {
                foreach ($requestData['time_slots'] as $shiftId => $slot) {
                    // Convert times to H:i:s format
                    if (!empty($slot['start_time'])) {
                        $validated['requests'][$requestIndex]['time_slots'][$shiftId]['start_time'] = 
                            $this->convertToHisFormat($slot['start_time']);
                    }
                    if (!empty($slot['end_time'])) {
                        $validated['requests'][$requestIndex]['time_slots'][$shiftId]['end_time'] = 
                            $this->convertToHisFormat($slot['end_time']);
                    }

                    // Validate time order if both times are provided
                    if (!empty($validated['requests'][$requestIndex]['time_slots'][$shiftId]['start_time']) && 
                        !empty($validated['requests'][$requestIndex]['time_slots'][$shiftId]['end_time'])) {
                        
                        $startTime = $validated['requests'][$requestIndex]['time_slots'][$shiftId]['start_time'];
                        $endTime = $validated['requests'][$requestIndex]['time_slots'][$shiftId]['end_time'];
                        
                        // Skip validation if start and end times are the same (like 00:00:00 to 00:00:00)
                        if ($startTime === $endTime) {
                            continue;
                        }
                        
                        $startCarbon = Carbon::createFromFormat('H:i:s', $startTime);
                        $endCarbon = Carbon::createFromFormat('H:i:s', $endTime);
                        
                        // Handle night shifts - if end time is earlier than start time, assume it's next day
                        if ($endCarbon->lt($startCarbon)) {
                            $endCarbon->addDay();
                        }
                        
                        // Only validate if end time is not significantly later (more than 24 hours)
                        if ($endCarbon->lte($startCarbon) && $endCarbon->diffInHours($startCarbon) < 24) {
                            throw ValidationException::withMessages([
                                "requests.{$requestIndex}.time_slots.{$shiftId}.end_time" => 'End time must be after start time.'
                            ]);
                        }
                    }
                }
            }

            Log::info('Validation passed', [
                'validated_data' => $validated,
                'user_id' => auth()->id(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all(),
                'user_id' => auth()->id(),
            ]);
            throw $e;
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['requests'] as $requestData) {
                foreach ($requestData['time_slots'] as $shiftId => $slot) {
                    ManPowerRequest::create([
                        'sub_section_id' => $requestData['sub_section_id'],
                        'date' => $requestData['date'],
                        'shift_id' => $shiftId,
                        'requested_amount' => $slot['requested_amount'],
                        'male_count' => $slot['male_count'],
                        'female_count' => $slot['female_count'],
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'reason' => $slot['reason'],
                        'is_additional' => $slot['is_additional'] ?? false,
                        'status' => 'pending',
                    ]);
                }
            }
        });

        return redirect()->route('manpower-requests.index')
            ->with('success', 'Request submitted successfully!');
    }

    private function convertToHisFormat($timeString)
    {
        if (empty($timeString)) {
            return null;
        }

        if (preg_match('/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/', $timeString)) {
            return $timeString;
        }

        if (preg_match('/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', $timeString)) {
            return $timeString . ':00';
        }

        try {
            $carbon = Carbon::createFromFormat('H:i', $timeString);
            return $carbon->format('H:i:s');
        } catch (\Exception $e) {
            try {
                $carbon = Carbon::createFromFormat('H:i:s', $timeString);
                return $carbon->format('H:i:s');
            } catch (\Exception $e2) {
                return null;
            }
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
                'time_slots.*.start_time' => ['nullable', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', 'required_if:time_slots.*.requested_amount,>0'],
                'time_slots.*.end_time' => ['nullable', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', 'required_if:time_slots.*.requested_amount,>0'],
            ]);

            foreach ($validated['time_slots'] as $shiftId => $slot) {
                if (!empty($slot['start_time'])) {
                    $validated['time_slots'][$shiftId]['start_time'] = $this->convertToHisFormat($slot['start_time']);
                }
                if (!empty($slot['end_time'])) {
                    $validated['time_slots'][$shiftId]['end_time'] = $this->convertToHisFormat($slot['end_time']);
                }

                if (!empty($validated['time_slots'][$shiftId]['start_time']) && 
                    !empty($validated['time_slots'][$shiftId]['end_time'])) {
                    
                    $startTime = $validated['time_slots'][$shiftId]['start_time'];
                    $endTime = $validated['time_slots'][$shiftId]['end_time'];
                    
                    // Skip validation if start and end times are the same
                    if ($startTime === $endTime) {
                        continue;
                    }
                    
                    $startCarbon = Carbon::createFromFormat('H:i:s', $startTime);
                    $endCarbon = Carbon::createFromFormat('H:i:s', $endTime);
                    
                    // Handle night shifts
                    if ($endCarbon->lt($startCarbon)) {
                        $endCarbon->addDay();
                    }
                    
                    if ($endCarbon->lte($startCarbon) && $endCarbon->diffInHours($startCarbon) < 24) {
                        throw ValidationException::withMessages([
                            "time_slots.{$shiftId}.end_time" => 'End time must be after start time.'
                        ]);
                    }
                }
            }

            DB::transaction(function () use ($validated, $manpowerRequest) {
                $existingRequests = ManPowerRequest::where('date', $manpowerRequest->date)
                    ->where('sub_section_id', $manpowerRequest->sub_section_id)
                    ->get()
                    ->keyBy('shift_id');

                $hasValidSlots = false;
                $processedShifts = [];

                foreach ($validated['time_slots'] as $shiftId => $slot) {
                    $requestedAmount = (int) $slot['requested_amount'];
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

        try {
            $date = Carbon::parse((string) $manPowerRequest->date)->format('Y-m-d');
        } catch (\Exception $e) {
            $date = now()->format('Y-m-d');
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

            $manPowerRequest = ManPowerRequest::with('schedules.employee')->findOrFail($id);

            Log::info('Attempting to delete manpower request', [
                'request_id' => $manPowerRequest->id,
                'user_id' => auth()->id(),
                'status' => $manPowerRequest->status
            ]);

            if ($manPowerRequest->schedules->isNotEmpty()) {
                Log::info('Updating employee statuses to available for schedules related to deleted request', [
                    'request_id' => $manPowerRequest->id,
                    'schedule_count' => $manPowerRequest->schedules->count()
                ]);
                foreach ($manPowerRequest->schedules as $schedule) {
                    if ($schedule->employee) {
                        $employee = $schedule->employee;
                        if ($employee->status === 'assigned') {
                            $employee->status = 'available';
                            $employee->save();
                            Log::debug("Employee ID {$employee->id} status changed to 'available'.");
                        }
                    }
                }
            }

            if ($manPowerRequest->status === 'fulfilled') {
                if ($manPowerRequest->created_at->diffInDays(now()) > 7) {
                    Log::warning('Attempt to delete fulfilled request older than 7 days', [
                        'request_id' => $manPowerRequest->id,
                        'status' => $manPowerRequest->status,
                        'user_id' => auth()->id()
                    ]);
                    DB::rollBack();
                    return back()->with('error', 'Cannot delete fulfilled requests older than 7 days');
                }
            }
            elseif (!in_array($manPowerRequest->status, ['pending', 'revision_requested'])) {
                Log::warning('Invalid delete attempt', [
                    'request_id' => $manPowerRequest->id,
                    'status' => $manPowerRequest->status,
                    'user_id' => auth()->id()
                ]);
                DB::rollBack();
                return back()->with('error', 'Cannot delete request in current status');
            }

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
                    throw new \Exception("No related requests found for revision.");
                }

                foreach ($relatedRequests as $req) {
                    if ($req->status === 'fulfilled') {
                        if ($req->schedules->isNotEmpty()) {
                            foreach ($req->schedules as $schedule) {
                                if ($schedule->employee) {
                                    $employee = $schedule->employee;
                                    if ($employee->status === 'assigned') { 
                                        $employee->status = 'available';
                                        $employee->save();
                                        Log::debug("Employee ID {$employee->id} status changed to 'available' during revision.");
                                    }
                                }
                            }
                        }
                        $req->schedules()->delete();
                        Log::info("Schedules for ManPowerRequest ID: {$req->id} deleted due to revision request.");

                        $req->update(['status' => 'revision_requested']);
                        Log::info("ManPowerRequest ID: {$req->id} status updated to 'revision_requested'.");
                    }
                }
            });

            return response()->json(['message' => 'Revision initiated successfully. Status changed to revision_requested.']);

        } catch (\Exception $e) {
            Log::error('Error in requestRevision: ' . $e->getMessage(), ['manpower_request_id' => $manPowerRequest->id]);
            return response()->json(['message' => 'Failed to initiate revision.', 'error' => $e->getMessage()], 500);
        }
    }
}