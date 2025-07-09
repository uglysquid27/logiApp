<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ManPowerRequest;
use App\Models\Employee;
use App\Models\Schedule;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Pastikan Log diimport
use Illuminate\Validation\ValidationException; // Import untuk validasi kustom

class ScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Schedule::with([
            'employee',
            'subSection.section',
            'manPowerRequest.shift',
            'manPowerRequest.subSection.section'
        ]);

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if ($startDate && $endDate) {
            $query->whereBetween('date', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }

        $schedules = $query->orderBy('date')->get();

        return Inertia::render('Schedules/Index', [
            'schedules' => $schedules,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]
        ]);
    }

    public function edit($id): Response
    {
        $request = ManPowerRequest::with('subSection')->findOrFail($id);

        // Fetch all active employees that are available and not on cuti.
        $startDate = Carbon::now()->subDays(6)->startOfDay(); // Define for schedule count
        $endDate = Carbon::now()->endOfDay(); // Define for schedule count

        $scheduledEmployeeIdsOnRequestDate = Schedule::where(DB::raw('DATE(date)'), $request->date)
            ->pluck('employee_id')
            ->toArray();

        $employees = Employee::where('status', 'available')
            ->where('cuti', 'no')
            ->whereNotIn('id', $scheduledEmployeeIdsOnRequestDate)
            ->whereHas('subSections', fn($q) =>
                $q->where('id', $request->sub_section_id)
            ) // Filter by sub-section directly for the edit page
            ->with(['subSections'])
            ->withCount(['schedules' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }])
            ->with(['schedules.manPowerRequest.shift'])
            ->get()
            ->map(function ($employee) {
                $totalWorkingHours = 0;
                foreach ($employee->schedules as $schedule) {
                    if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                        $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                    }
                }

                $weeklyScheduleCount = $employee->schedules_count;

                $rating = 0;
                if ($weeklyScheduleCount === 5) { $rating = 5; }
                elseif ($weeklyScheduleCount === 4) { $rating = 4; }
                elseif ($weeklyScheduleCount === 3) { $rating = 3; }
                elseif ($weeklyScheduleCount === 2) { $rating = 2; }
                elseif ($weeklyScheduleCount === 1) { $rating = 1; }
                elseif ($weeklyScheduleCount === 0) { $rating = 0; }
                else { $rating = 0; }

                $workingDayWeight = 0;
                if ($rating === 5) { $workingDayWeight = 15; }
                elseif ($rating === 4) { $workingDayWeight = 45; }
                elseif ($rating === 3) { $workingDayWeight = 75; }
                elseif ($rating === 2) { $workingDayWeight = 105; }
                elseif ($rating === 1) { $workingDayWeight = 135; }
                elseif ($rating === 0) { $workingDayWeight = 165; }
                else { $workingDayWeight = 0; }

                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                return $employee;
            })
            ->sortBy(function($employee) {
                return $employee->type === 'bulanan' ? 0 : 1;
            })->sortBy('working_day_weight')
            ->values();

        return Inertia::render('Schedules/Assign', [
            'request' => $request,
            'employees' => $employees, // Kirim hanya karyawan yang cocok dengan sub-section
        ]);
    }


    /**
     * Store a newly created resource in storage (Automatic Assignment).
     */
    public function store(Request $request)
    {
        // Validasi input: hanya butuh request_id
        $request->validate([
            'request_id' => 'required|exists:man_power_requests,id',
        ]);

        $manPowerRequest = ManPowerRequest::findOrFail($request->request_id);

        // Mencegah pemenuhan ganda
        if ($manPowerRequest->status === 'fulfilled') {
            return back()->withErrors(['request_status' => 'Permintaan ini sudah dipenuhi.']);
        }

        try {
            DB::transaction(function () use ($manPowerRequest) {
                $requestedAmount = $manPowerRequest->requested_amount;
                $assignedEmployeeCount = 0;
                $assignedEmployeeIds = [];

                // 1. Dapatkan ID karyawan yang sudah dijadwalkan pada tanggal permintaan
                $scheduledEmployeeIdsOnRequestDate = Schedule::where('date', $manPowerRequest->date)
                    ->pluck('employee_id')
                    ->toArray();

                $startDate = Carbon::now()->subDays(6)->startOfDay();
                $endDate = Carbon::now()->endOfDay();

                // 2. Fetch semua karyawan aktif yang tersedia dan tidak cuti, serta belum dijadwalkan pada tanggal permintaan
                $eligibleEmployees = Employee::where('status', 'available')
                    ->where('cuti', 'no')
                    ->whereNotIn('id', $scheduledEmployeeIdsOnRequestDate)
                    ->with(['subSections'])
                    ->withCount(['schedules' => function ($query) use ($startDate, $endDate) {
                        $query->whereBetween('date', [$startDate, $endDate]);
                    }])
                    ->with(['schedules.manPowerRequest.shift'])
                    ->get()
                    ->map(function ($employee) {
                        $totalWorkingHours = 0;
                        foreach ($employee->schedules as $schedule) {
                            if ($schedule->manPowerRequest && $schedule->manPowerRequest->shift) {
                                $totalWorkingHours += $schedule->manPowerRequest->shift->hours;
                            }
                        }

                        $weeklyScheduleCount = $employee->schedules_count;

                        $rating = 0;
                        if ($weeklyScheduleCount === 5) { $rating = 5; }
                        elseif ($weeklyScheduleCount === 4) { $rating = 4; }
                        elseif ($weeklyScheduleCount === 3) { $rating = 3; }
                        elseif ($weeklyScheduleCount === 2) { $rating = 2; }
                        elseif ($weeklyScheduleCount === 1) { $rating = 1; }
                        elseif ($weeklyScheduleCount === 0) { $rating = 0; }
                        else { $rating = 0; }

                        $workingDayWeight = 0;
                        if ($rating === 5) { $workingDayWeight = 15; }
                        elseif ($rating === 4) { $workingDayWeight = 45; }
                        elseif ($rating === 3) { $workingDayWeight = 75; }
                        elseif ($rating === 2) { $workingDayWeight = 105; }
                        elseif ($rating === 1) { $workingDayWeight = 135; }
                        elseif ($rating === 0) { $workingDayWeight = 165; }
                        else { $workingDayWeight = 0; }

                        $employee->setAttribute('calculated_rating', $rating);
                        $employee->setAttribute('working_day_weight', $workingDayWeight);
                        $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                        return $employee;
                    });

                // Define fungsi penyortiran
                $sortEmployees = function ($employees) {
                    return $employees->sortBy(function($employee) {
                        return $employee->type === 'bulanan' ? 0 : 1; // Prioritaskan bulanan
                    })->sortBy('working_day_weight') // Lalu urutkan berdasarkan working day weight
                    ->values();
                };

                // 3. Pisahkan karyawan berdasarkan sub-bagian yang sama dan sub-bagian lain
                $sameSubSectionEligible = $eligibleEmployees->filter(fn($employee) => $employee->sub_section_id === $manPowerRequest->sub_section_id);
                $otherSubSectionEligible = $eligibleEmployees->filter(fn($employee) => $employee->sub_section_id !== $manPowerRequest->sub_section_id);

                $sortedSameSubSectionEmployees = $sortEmployees($sameSubSectionEligible);
                $sortedOtherSubSectionEmployees = $sortEmployees($otherSubSectionEligible);

                // 4. Proses penugasan karyawan
                // Prioritaskan karyawan dari sub-bagian yang sama
                foreach ($sortedSameSubSectionEmployees as $employee) {
                    if ($assignedEmployeeCount < $requestedAmount) {
                        Schedule::create([
                            'employee_id' => $employee->id,
                            'sub_section_id' => $manPowerRequest->sub_section_id,
                            'man_power_request_id' => $manPowerRequest->id,
                            'date' => $manPowerRequest->date,
                            'status' => 'pending' // Default status for new schedules
                        ]);
                        $employee->status = 'assigned';
                        $employee->save();
                        $assignedEmployeeIds[] = $employee->id;
                        $assignedEmployeeCount++;
                    } else {
                        break;
                    }
                }

                // Jika masih ada kekurangan, ambil dari sub-bagian lain
                if ($assignedEmployeeCount < $requestedAmount) {
                    foreach ($sortedOtherSubSectionEmployees as $employee) {
                        if ($assignedEmployeeCount < $requestedAmount) {
                            // Pastikan karyawan ini belum dijadwalkan dari sub bagian yang sama sebelumnya
                            if (!in_array($employee->id, $assignedEmployeeIds)) {
                                Schedule::create([
                                    'employee_id' => $employee->id,
                                    'sub_section_id' => $manPowerRequest->sub_section_id, // Tetap gunakan sub_section_id permintaan
                                    'man_power_request_id' => $manPowerRequest->id,
                                    'date' => $manPowerRequest->date,
                                    'status' => 'pending'
                                ]);
                                $employee->status = 'assigned';
                                $employee->save();
                                $assignedEmployeeCount++;
                            }
                        } else {
                            break;
                        }
                    }
                }

                // Jika jumlah karyawan yang ditugaskan kurang dari yang diminta, log peringatan
                if ($assignedEmployeeCount < $requestedAmount) {
                    Log::warning('Tidak cukup karyawan yang tersedia untuk memenuhi permintaan ID ' . $manPowerRequest->id . '. Ditugaskan: ' . $assignedEmployeeCount . ', Diminta: ' . $requestedAmount);
                    // Anda bisa melempar exception di sini jika Anda ingin membatalkan transaksi
                    // throw new \Exception('Tidak cukup karyawan yang tersedia untuk memenuhi permintaan.');
                }

                // Perbarui status permintaan man power menjadi fulfilled jika berhasil ditugaskan setidaknya satu
                if ($assignedEmployeeCount > 0) {
                    $manPowerRequest->status = 'fulfilled';
                    $manPowerRequest->save();
                } else {
                    // Jika tidak ada karyawan yang ditugaskan sama sekali, mungkin tidak perlu mengubah status
                    // atau mungkin perlu diatur ke status 'unfulfilled' atau sejenisnya
                    Log::info('Tidak ada karyawan yang berhasil ditugaskan untuk permintaan ID ' . $manPowerRequest->id);
                    throw ValidationException::withMessages([
                        'assignment_error' => 'Tidak ada karyawan yang tersedia yang cocok dengan kriteria untuk permintaan ini.'
                    ]);
                }
            });
        } catch (\Exception $e) {
            Log::error('Schedule Auto-Assignment Error: ' . $e->getMessage(), ['exception' => $e, 'request_id' => $manPowerRequest->id]);
            return back()->withErrors(['assignment_error' => $e->getMessage()])->withInput();
        }

        return redirect()->route('schedules.index')->with('success', 'Karyawan berhasil dijadwalkan secara otomatis!');
    }
}
