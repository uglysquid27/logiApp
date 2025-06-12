<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Added for logging

class ManPowerRequestFulfillmentController extends Controller
{
    public function create($id)
    {
        $request = ManPowerRequest::with('subSection.section', 'shift')->findOrFail($id);

        if ($request->status === 'fulfilled') {
            return Inertia::render('Fullfill/Index', [
                'request' => $request,
                'sameSubSectionEmployees' => [], // Ubah nama prop
                'otherSubSectionEmployees' => [], // Tambahkan prop baru
                'message' => 'This request has already been fulfilled.',
            ]);
        }

        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        // 1. Get IDs of employees already scheduled on the request date and shift
        $scheduledEmployeeIdsOnRequestDate = Schedule::whereDate('date', $request->date)
                                                    ->where('man_power_request_id', '!=', $request->id)
                                                    ->pluck('employee_id')
                                                    ->toArray();

        // 2. Fetch all active employees that are available and not on cuti.
        $eligibleEmployees = Employee::where('status', 'available')
            ->where('cuti', 'no')
            ->whereNotIn('id', $scheduledEmployeeIdsOnRequestDate)
            ->with(['subSections']) // Removed 'position' from eager loading
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

                $rating = 0;
                $weeklyScheduleCount = $employee->schedules_count; // Gunakan schedules_count dari withCount jika itu adalah total

                // Asumsi: weeklyScheduleCount seharusnya merujuk ke schedules_count dari kueri whereBetween
                // yang sudah didefinisikan sebelumnya, yaitu $employee->schedules_count_weekly
                // Jika total assignments for the week, harusnya $employee->schedules_count
                // Mari kita gunakan $employee->schedules_count_weekly untuk yang dihitung per minggu
                $weeklyScheduleCount = $employee->schedules_count_weekly;


                if ($weeklyScheduleCount === 5) { $rating = 5; }
                elseif ($weeklyScheduleCount === 4) { $rating = 4; }
                elseif ($weeklyScheduleCount === 3) { $rating = 3; }
                elseif ($weeklyScheduleCount === 2) { $rating = 2; }
                elseif ($weeklyScheduleCount === 1) { $rating = 1; }
                elseif ($weeklyScheduleCount === 0) { $rating = 0; }
                else { $rating = 0; } // Default if not in ranges


                $workingDayWeight = 0;
                if ($rating === 5) { $workingDayWeight = 15; }
                elseif ($rating === 4) { $workingDayWeight = 45; }
                elseif ($rating === 3) { $workingDayWeight = 75; }
                elseif ($rating === 2) { $workingDayWeight = 105; }
                elseif ($rating === 1) { $workingDayWeight = 135; }
                elseif ($rating === 0) { $workingDayWeight = 165; }
                else { $workingDayWeight = 0; } // Default if not in ranges

                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                return $employee;
            });

        // Define a common sorting function for eligible employees
        $sortEmployees = function ($employees) {
            return $employees->sortBy(function($employee) {
                // Prioritize 'bulanan' (monthly) over 'harian' (daily)
                return $employee->type === 'bulanan' ? 0 : 1;
            })->sortBy('working_day_weight') // Sort by working day weight ascending (lower weight is higher priority)
            ->values(); // Reset keys after sorting
        };

        // 3. Separate employees into 'same sub-section' and 'other sub-sections'
        $sameSubSectionEligible = $eligibleEmployees->filter(fn($employee) => $employee->sub_section_id === $request->sub_section_id);
        $otherSubSectionEligible = $eligibleEmployees->filter(fn($employee) => $employee->sub_section_id !== $request->sub_section_id);

        // Sort both groups independently
        $sortedSameSubSectionEmployees = $sortEmployees($sameSubSectionEligible);
        $sortedOtherSubSectionEmployees = $sortEmployees($otherSubSectionEligible);

        return Inertia::render('Fullfill/Index', [
            'request' => $request,
            'sameSubSectionEmployees' => $sortedSameSubSectionEmployees, // Kirim ini
            'otherSubSectionEmployees' => $sortedOtherSubSectionEmployees, // Kirim ini
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);
    
        $req = ManPowerRequest::findOrFail($id);

        if ($req->status === 'fulfilled') {
            return back()->withErrors(['request_status' => 'This request has already been fulfilled.']);
        }
    
        try {
            DB::transaction(function () use ($validated, $req) {
                foreach ($validated['employee_ids'] as $employeeId) {
                    $employee = Employee::where('id', $employeeId)
                        ->where('status', 'available') // Karyawan harus available saat dijadwalkan
                        ->where('cuti', 'no') // Karyawan tidak boleh cuti saat dijadwalkan
                        ->whereDoesntHave('schedules', function ($query) use ($req) {
                            // Pastikan karyawan tidak dijadwalkan pada tanggal yang sama
                            $query->where('date', $req->date);
                        })
                        ->first();
            
                    if (!$employee) {
                        // Ini akan menangkap jika karyawan yang dipilih tidak lagi memenuhi syarat
                        throw new \Exception("Karyawan ID {$employeeId} tidak tersedia, sedang cuti, atau sudah dijadwalkan pada {$req->date->format('d M Y')}.");
                    }
            
                    Schedule::create([
                        'employee_id' => $employeeId,
                        'sub_section_id' => $req->sub_section_id,
                        'man_power_request_id' => $req->id,
                        'date' => $req->date,
                    ]);

                    $employee->status = 'assigned'; // Ubah status karyawan menjadi 'assigned'
                    $employee->save();
                }
            
                $req->status = 'fulfilled'; // Set status manpower request menjadi 'fulfilled'
                $req->save();
            });
        } catch (\Exception $e) {
            // Tangkap exception dan kembalikan error ke frontend
            Log::error('Fulfillment Error: ' . $e->getMessage(), ['exception' => $e, 'request_id' => $id]);
            return back()->withErrors(['fulfillment_error' => $e->getMessage()]);
        }
    
        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
}
