<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Shift;
use App\Models\Employee; // Import Employee model
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

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
        Log::info('Raw incoming ManPowerRequest store data: ', $request->all());

        $validator = Validator::make($request->all(), [
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'time_slots' => 'required|array|min:1',
            'time_slots.*.shift_id' => 'required|exists:shifts,id',
            'time_slots.*.requested_amount' => 'required|integer|min:1',
            'time_slots.*.start_time' => 'required|date_format:H:i:s,H:i',
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
                            $fail('Bidang ' . str_replace('_', ' ', $parts[2]) . ' harus setelah waktu mulainya (atau menyiratkan hari berikutnya jika melewati tengah malam).');
                        }
                    } catch (\Exception $e) {
                         Log::error('Kesalahan parsing waktu dalam validasi kustom (store): ' . $e->getMessage(), ['attribute' => $attribute, 'value' => $value, 'start_time' => $startTime]);
                        $fail('Bidang ' . str_replace('_', ' ', $parts[2]) . ' memiliki format waktu yang tidak valid.');
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            Log::error('Kesalahan validasi penyimpanan ManPowerRequest:', $validator->errors()->toArray());
            return redirect()->back()->withErrors($validator->errors());
        }

        $validated = $validator->validated();

        $slotsToProcess = $validated['time_slots'];

        DB::beginTransaction();
        try {
            foreach ($slotsToProcess as $slot) {
                $createData = [
                    'sub_section_id' => $validated['sub_section_id'],
                    'date' => $validated['date'],
                    'shift_id' => $slot['shift_id'],
                    'start_time' => Carbon::parse($slot['start_time'])->format('H:i'),
                    'end_time' => Carbon::parse($slot['end_time'])->format('H:i'),
                    'requested_amount' => $slot['requested_amount'],
                    'status' => 'pending',
                ];
                Log::info('Data pembuatan ManPowerRequest:', $createData);
                ManPowerRequest::create($createData);
                Log::info('ManPowerRequest berhasil dibuat untuk slot:', $createData);
            }
            DB::commit();
            Log::info('ManPowerRequest(s) berhasil dibuat dan dikomit ke DB.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaksi database gagal untuk penyimpanan ManPowerRequest: ' . $e->getMessage(), [
                'exception' => $e,
                'validated_data' => $validated,
            ]);
            return redirect()->back()->withErrors(['database_error' => 'Terjadi kesalahan saat menyimpan data. Mohon coba lagi.']);
        }

        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil dibuat.');
    }

    public function fulfill(ManPowerRequest $request): Response
    {
        // Pastikan relasi subSection dan shift dimuat untuk request itu sendiri
        $request->load('subSection.section', 'shift');

        // Dapatkan tanggal dan ID shift dari request yang akan dipenuhi
        $requestDate = $request->date;
        $requestShiftId = $request->shift_id;

        // Ambil semua karyawan aktif yang TIDAK dijadwalkan pada tanggal dan shift yang sama
        // diurutkan berdasarkan prioritas (bulanan terlebih dahulu, lalu harian berdasarkan working_day_weight).
        $employees = Employee::where('is_active', true)
            ->with(['subSection', 'position']) // Eager load subSection dan position untuk tampilan
            ->withCount([
                'schedules as schedules_count', // Total penugasan
                'schedules as schedules_count_weekly' => function ($query) { // Penugasan dalam 7 hari terakhir
                    $query->whereBetween('date', [Carbon::now()->subDays(7), Carbon::now()]);
                }
            ])
            ->whereDoesntHave('schedules', function ($query) use ($requestDate, $requestShiftId) {
                // Pastikan karyawan tidak dijadwalkan untuk TANGGAL dan SHIFT yang SAMA
                $query->where('date', $requestDate)
                      ->where('shift_id', $requestShiftId);
            })
            // Prioritaskan 'bulanan' terlebih dahulu, lalu 'harian'
            ->orderByRaw("CASE WHEN type = 'bulanan' THEN 0 ELSE 1 END")
            // Prioritaskan karyawan 'harian' dengan bobot kerja terendah (paling sering tidak bekerja)
            ->orderBy('working_day_weight', 'asc')
            ->select('id', 'name', 'nik', 'type', 'working_day_weight', 'calculated_rating')
            ->get();

        return Inertia::render('ManpowerRequests/Fulfill', [
            'request' => $request,
            'employees' => $employees,
            'message' => session('message'),
        ]);
    }

    public function storeFulfillment(Request $request, ManPowerRequest $manPowerRequest)
    {
        Log::info('Incoming fulfillment request data:', $request->all());

        $validator = Validator::make($request->all(), [
            'employee_ids' => ['required', 'array', 'min:1'],
            'employee_ids.*' => [
                'required',
                'exists:employees,id',
                // Pastikan karyawan tidak dijadwalkan untuk tanggal dan shift ini
                function ($attribute, $value, $fail) use ($manPowerRequest) {
                    $employee = Employee::find($value);
                    if (!$employee) {
                        $fail("Karyawan dengan ID {$value} tidak ditemukan.");
                        return;
                    }

                    // Periksa apakah karyawan sudah dijadwalkan untuk tanggal & shift ini
                    $isScheduled = $employee->schedules()
                                            ->where('date', $manPowerRequest->date)
                                            ->where('shift_id', $manPowerRequest->shift_id)
                                            ->exists();

                    if ($isScheduled) {
                        $fail("Karyawan {$employee->name} sudah dijadwalkan pada tanggal " . Carbon::parse($manPowerRequest->date)->format('d M Y') . " untuk shift " . $manPowerRequest->shift->name . ".");
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            Log::error('Fulfillment validation errors:', $validator->errors()->toArray());
            return redirect()->back()->withErrors($validator->errors());
        }

        $validated = $validator->validated();

        if ($manPowerRequest->status === 'fulfilled') {
            return redirect()->back()->withErrors(['fulfillment_error' => 'Permintaan ini sudah terpenuhi.'])->withInput();
        }

        // Check if the number of assigned employees matches the requested amount
        if (count($validated['employee_ids']) !== $manPowerRequest->requested_amount) {
            return redirect()->back()->withErrors(['fulfillment_error' => 'Jumlah karyawan yang ditugaskan harus sama dengan jumlah yang diminta (' . $manPowerRequest->requested_amount . ').'])->withInput();
        }

        DB::beginTransaction();
        try {
            // Ubah status request menjadi 'fulfilled'
            $manPowerRequest->update(['status' => 'fulfilled']);

            // Buat entri jadwal untuk setiap karyawan yang ditugaskan
            foreach ($validated['employee_ids'] as $employeeId) {
                $employee = Employee::find($employeeId); // Re-fetch to ensure relations are available if needed

                // Check again to prevent race conditions or stale data
                if ($employee->schedules()->where('date', $manPowerRequest->date)->where('shift_id', $manPowerRequest->shift_id)->exists()) {
                    DB::rollBack();
                    return redirect()->back()->withErrors(['fulfillment_error' => "Karyawan {$employee->name} sudah dijadwalkan untuk tanggal dan shift ini. Harap segarkan halaman dan coba lagi."])->withInput();
                }

                $employee->schedules()->create([
                    'date' => $manPowerRequest->date,
                    'shift_id' => $manPowerRequest->shift_id,
                    'sub_section_id' => $manPowerRequest->sub_section_id, // Assign to the request's sub_section
                    'man_power_request_id' => $manPowerRequest->id,
                ]);

                // Update working_day_weight for 'harian' employees
                if ($employee->type === 'harian') {
                    $employee->update(['working_day_weight' => $employee->working_day_weight + 1]);
                }
            }

            DB::commit();
            Log::info('ManPowerRequest berhasil dipenuhi: ' . $manPowerRequest->id);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Kesalahan saat memenuhi ManPowerRequest: ' . $e->getMessage(), ['request_id' => $manPowerRequest->id, 'exception' => $e]);
            return redirect()->back()->withErrors(['fulfillment_error' => 'Terjadi kesalahan saat memproses pemenuhan. Mohon coba lagi.']);
        }

        return redirect()->route('manpower-requests.index')->with('success', 'Permintaan Man Power berhasil dipenuhi.');
    }


    public function edit(ManPowerRequest $manPowerRequest): Response
    {
        $relatedRequests = ManPowerRequest::where('date', $manPowerRequest->date)
                                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                                           ->with('shift')
                                           ->get();

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

    public function update(Request $request, ManPowerRequest $manPowerRequest)
    {
        Log::info('Data pembaruan ManPowerRequest yang masuk mentah:', $request->all());

        $validator = Validator::make($request->all(), [
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date|after_or_equal:today',
            'time_slots' => 'required|array|min:1',
            'time_slots.*.shift_id' => 'required|exists:shifts,id',
            'time_slots.*.requested_amount' => 'required|integer|min:1',
            'time_slots.*.start_time' => 'required|date_format:H:i:s,H:i',
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
                            $fail('Bidang ' . str_replace('_', ' ', $parts[2]) . ' harus setelah waktu mulainya (atau menyiratkan hari berikutnya jika melewati tengah malam).');
                        }
                    } catch (\Exception $e) {
                         Log::error('Kesalahan parsing waktu dalam validasi kustom (pembaruan): ' . $e->getMessage(), ['attribute' => $attribute, 'value' => $value, 'start_time' => $startTime]);
                        $fail('Bidang ' . str_replace('_', ' ', $parts[2]) . ' memiliki format waktu yang tidak valid.');
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            Log::error('Kesalahan validasi pembaruan ManPowerRequest:', $validator->errors()->toArray());
            return redirect()->back()->withErrors($validator->errors());
        }

        $validated = $validator->validated();

        if ($manPowerRequest->status === 'fulfilled') {
            return back()->withErrors(['status' => 'Request yang sudah terpenuhi tidak dapat diubah.']);
        }

        $slotsToProcess = $validated['time_slots'];

        DB::beginTransaction();
        try {
            ManPowerRequest::where('date', $manPowerRequest->date)
                           ->where('sub_section_id', $manPowerRequest->sub_section_id)
                           ->delete();

            foreach ($slotsToProcess as $slot) {
                ManPowerRequest::create([
                    'sub_section_id' => $validated['sub_section_id'],
                    'date' => $validated['date'],
                    'shift_id' => $slot['shift_id'],
                    'start_time' => Carbon::parse($slot['start_time'])->format('H:i'),
                    'end_time' => Carbon::parse($slot['end_time'])->format('H:i'),
                    'requested_amount' => $slot['requested_amount'],
                    'status' => 'pending',
                ]);
            }
            DB::commit();
            Log::info('ManPowerRequest(s) berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaksi database gagal untuk pembaruan ManPowerRequest: ' . $e->getMessage(), [
                'exception' => $e,
                'validated_data' => $validated,
            ]);
            return redirect()->back()->withErrors(['database_error' => 'Terjadi kesalahan saat menyimpan perubahan. Mohon coba lagi.']);
        }


        return redirect()->route('manpower-requests.index')->with('success', 'Request man power berhasil diperbarui.');
    }

    public function destroy(ManPowerRequest $manPowerRequest)
    {
        return back()->with('error', 'Fungsi hapus belum diimplementasikan.');
    }
}
