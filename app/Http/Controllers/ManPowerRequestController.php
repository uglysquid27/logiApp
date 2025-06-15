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
    /**
     * Display a listing of the resource.
     */
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

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all();

        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections,
            'shifts' => $shifts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
     public function store(Request $request)
    {
        try {
            $request->validate([
                'sub_section_id' => ['required', 'exists:sub_sections,id'],
                'date' => ['required', 'date', 'after_or_equal:today'],
                'time_slots' => ['nullable', 'array'],

                'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'],
                'time_slots.*.start_time' => ['nullable', 'date_format:H:i:s', 'required_if:time_slots.*.requested_amount,>0'],
                'time_slots.*.end_time' => [
                    'nullable',
                    'date_format:H:i:s',
                    'required_if:time_slots.*.requested_amount,>0',
                    new ShiftTimeOrder('start_time', 'time_slots.*.end_time'),
                ],
            ], [
                'sub_section_id.required' => 'Sub Section harus dipilih.',
                'sub_section_id.exists' => 'Sub Section yang dipilih tidak valid.',
                'date.required' => 'Tanggal dibutuhkan harus diisi.',
                'date.date' => 'Format tanggal tidak valid.',
                'date.after_or_equal' => 'Tanggal tidak boleh kurang dari hari ini.',
                'time_slots.array' => 'Data slot waktu tidak valid.',
                'time_slots.*.requested_amount.integer' => 'Jumlah yang diminta harus berupa angka.',
                'time_slots.*.requested_amount.min' => 'Jumlah yang diminta minimal 0.',
                'time_slots.*.start_time.date_format' => 'Format waktu mulai tidak valid (HH:mm:ss).',
                'time_slots.*.start_time.required_if' => 'Waktu mulai wajib diisi jika jumlah diminta lebih dari 0.',
                'time_slots.*.end_time.date_format' => 'Format waktu selesai tidak valid (HH:mm:ss).',
                'time_slots.*.end_time.required_if' => 'Waktu selesai wajib diisi jika jumlah diminta lebih dari 0.',
            ]);

            DB::transaction(function () use ($request) {
                $subSectionId = $request->input('sub_section_id');
                $date = $request->input('date');
                $timeSlots = $request->input('time_slots', []);

                $validTimeSlots = array_filter($timeSlots, function ($slot) {
                    return isset($slot['requested_amount']) && (int) $slot['requested_amount'] > 0;
                });

                if (empty($validTimeSlots)) {
                    throw ValidationException::withMessages([
                        'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                    ]);
                }

                foreach ($validTimeSlots as $shiftId => $slot) {
                    ManPowerRequest::create([
                        'sub_section_id' => $subSectionId,
                        'date' => $date,
                        'shift_id' => $shiftId,
                        'requested_amount' => $slot['requested_amount'],
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                        'status' => 'pending',
                    ]);
                }
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Manpower request created successfully!');

        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating manpower request: ' . $e->getMessage(), ['exception' => $e]);
            return back()->with('error', 'An unexpected error occurred. Please try again.')->withInput();
        }
    }

    /**
     * Show the form for editing the specified resource.
     * Mengubah signature metode untuk menerima $id secara eksplisit
     * untuk debugging yang lebih mudah terkait Route Model Binding.
     */
    public function edit(string $id): Response
    {
        // PENTING: Coba cari record berdasarkan ID. Hapus withTrashed() karena kolom deleted_at tidak ada.
        $manPowerRequest = ManPowerRequest::find($id);

        // Jika model tidak ditemukan (null), maka abort dengan 404.
        if (!$manPowerRequest) {
            abort(404, 'ManPowerRequest with ID ' . $id . ' not found.');
        }

        // Fetch all ManPowerRequests that share the same date and sub_section_id as the one being edited.
        // Hapus withTrashed() di sini juga.
        $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
            ->where('sub_section_id', $manPowerRequest->sub_section_id)
            ->with('shift')
            ->get();

        // Reconstruct the time_slots data structure expected by the frontend.
        $timeSlots = [];
        foreach ($relatedRequests as $req) {
            $timeSlots[$req->shift_id] = [
                'id' => $req->id,
                'requested_amount' => $req->requested_amount,
                'start_time' => $req->start_time,
                'end_time' => $req->end_time,
            ];
        }

        $subSections = SubSection::with('section')->get();
        $shifts = Shift::all();

        $formData = [
            'id' => $manPowerRequest->id,
            'sub_section_id' => $manPowerRequest->sub_section_id,
            'date' => Carbon::parse($manPowerRequest->date)->format('Y-m-d'),
            'time_slots' => $timeSlots,
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
    public function update(Request $request, ManPowerRequest $manpowerRequest)
    {
        try {
            $request->validate([
                'sub_section_id' => ['required', 'exists:sub_sections,id'],
                'date' => ['required', 'date', 'after_or_equal:today'],
                'time_slots' => ['nullable', 'array'],

                'time_slots.*.requested_amount' => ['nullable', 'integer', 'min:0'],
                'time_slots.*.start_time' => [
                    'nullable',
                    'date_format:H:i:s',
                    'required_if:time_slots.*.requested_amount,>0'
                ],
                'time_slots.*.end_time' => [
                    'nullable',
                    'date_format:H:i:s',
                    'required_if:time_slots.*.requested_amount,>0',
                    new ShiftTimeOrder('start_time', 'time_slots.*.end_time'),
                ],
            ], [
                'sub_section_id.required' => 'Sub Section harus dipilih.',
                'sub_section_id.exists' => 'Sub Section yang dipilih tidak valid.',
                'date.required' => 'Tanggal dibutuhkan harus diisi.',
                'date.date' => 'Format tanggal tidak valid.',
                'date.after_or_equal' => 'Tanggal tidak boleh kurang dari hari ini.',
                'time_slots.array' => 'Data slot waktu tidak valid.',
                'time_slots.*.requested_amount.integer' => 'Jumlah yang diminta harus berupa angka.',
                'time_slots.*.requested_amount.min' => 'Jumlah yang diminta minimal 0.',
                'time_slots.*.start_time.date_format' => 'Format waktu mulai tidak valid (HH:mm:ss).',
                'time_slots.*.start_time.required_if' => 'Waktu mulai wajib diisi jika jumlah diminta lebih dari 0.',
                'time_slots.*.end_time.date_format' => 'Format waktu selesai tidak valid (HH:mm:ss).',
                'time_slots.*.end_time.required_if' => 'Waktu selesai wajib diisi jika jumlah diminta lebih dari 0.',
            ]);

            DB::transaction(function () use ($request, $manpowerRequest) {
                $newSubSectionId = $request->input('sub_section_id');
                $newDate = $request->input('date');
                $submittedTimeSlots = $request->input('time_slots', []);

                $originalSubSectionId = $manpowerRequest->sub_section_id;
                $originalDate = $manpowerRequest->date;

                // Ketika mengupdate, tidak perlu mempertimbangkan record yang dihapus secara lunak jika tidak ada kolom deleted_at
                $existingRequestsInGroup = ManPowerRequest::where('date', $originalDate) // <--- Perubahan di sini: Dihapus withTrashed()
                    ->where('sub_section_id', $originalSubSectionId)
                    ->get()
                    ->keyBy('shift_id');

                $hasAtLeastOneValidSlot = false;
                $processedShiftIds = [];

                foreach ($submittedTimeSlots as $shiftId => $slotData) {
                    $requestedAmount = (int) $slotData['requested_amount'];
                    $startTime = $slotData['start_time'];
                    $endTime = $slotData['end_time'];

                    $existingRecordForShift = $existingRequestsInGroup->get($shiftId);

                    if ($requestedAmount > 0) {
                        $hasAtLeastOneValidSlot = true;
                        if ($existingRecordForShift) {
                            // Hapus pengecekan trashed() dan restore() jika soft deletes tidak digunakan
                            $existingRecordForShift->update([
                                'sub_section_id' => $newSubSectionId,
                                'date' => $newDate,
                                'requested_amount' => $requestedAmount,
                                'start_time' => $startTime,
                                'end_time' => $endTime,
                            ]);
                        } else {
                            ManPowerRequest::create([
                                'sub_section_id' => $newSubSectionId,
                                'date' => $newDate,
                                'shift_id' => $shiftId,
                                'requested_amount' => $requestedAmount,
                                'start_time' => $startTime,
                                'end_time' => $endTime,
                                'status' => 'pending',
                            ]);
                        }
                    } else {
                        if ($existingRecordForShift) {
                            // Hapus record (ini akan menjadi hard delete jika soft deletes tidak digunakan)
                            $existingRecordForShift->delete();
                        }
                    }
                    $processedShiftIds[] = $shiftId;
                }

                // Hapus record yang tidak lagi dikirim dalam payload
                foreach ($existingRequestsInGroup as $shiftId => $existingRecord) {
                    if (!in_array($shiftId, $processedShiftIds)) {
                        $existingRecord->delete();
                    }
                }

                if (!$hasAtLeastOneValidSlot && count($submittedTimeSlots) > 0) {
                     throw ValidationException::withMessages([
                        'time_slots' => 'Setidaknya satu shift harus memiliki jumlah yang diminta lebih dari 0.',
                    ]);
                }
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Manpower request updated successfully!');

        } catch (ValidationException $e) {
            Log::error('Validation Error updating manpower request: ' . json_encode($e->errors()), ['exception' => $e]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating manpower request: ' . $e->getMessage(), ['exception' => $e]);
            return back()->with('error', 'An unexpected error occurred during update. Please try again.')->withInput();
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ManPowerRequest $manPowerRequest)
    {
        try {
            DB::transaction(function () use ($manPowerRequest) {
                // Ini akan melakukan hard delete jika SoftDeletes tidak digunakan
                ManPowerRequest::where('sub_section_id', $manPowerRequest->sub_section_id)
                               ->where('date', $manPowerRequest->date)
                               ->delete();
            });

            return redirect()->route('manpower-requests.index')->with('success', 'Manpower requests for the selected date and sub-section deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting manpower request: ' . $e->getMessage(), ['exception' => $e]);
            return back()->with('error', 'Failed to delete manpower request. Please try again.');
        }
    }
}
