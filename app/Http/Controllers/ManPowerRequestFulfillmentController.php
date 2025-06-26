<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ManPowerRequestFulfillmentController extends Controller
{
    public function create($id)
    {
        $request = ManPowerRequest::with([
            'subSection.section', 
            'shift', 
            'fulfilledBy'
        ])->findOrFail($id);

        if ($request->status === 'fulfilled') {
            return Inertia::render('Fullfill/Index', [
                'request' => $request,
                'sameSubSectionEmployees' => [],
                'otherSubSectionEmployees' => [],
                'message' => 'Permintaan ini sudah terpenuhi.',
                'auth' => [
                    'user' => auth()->user()
                ]
            ]);
        }

        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $scheduledEmployeeIdsOnRequestDate = Schedule::whereDate('date', $request->date)
            ->pluck('employee_id')
            ->toArray();

        $eligibleEmployees = Employee::where('status', 'available')
            ->where('cuti', 'no')
            ->whereNotIn('id', $scheduledEmployeeIdsOnRequestDate)
            ->with(['subSections.section'])
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

                $subSectionsData = $employee->subSections->map(function($subSection) {
                    return [
                        'id' => $subSection->id,
                        'name' => $subSection->name,
                        'section_id' => $subSection->section_id,
                        'section' => $subSection->section ? $subSection->section->toArray() : null,
                    ];
                })->toArray();

                return [
                    'id' => $employee->id,
                    'nik' => $employee->nik,
                    'name' => $employee->name,
                    'type' => $employee->type,
                    'status' => $employee->status,
                    'cuti' => $employee->cuti,
                    'gender' => $employee->gender,
                    'created_at' => $employee->created_at,
                    'updated_at' => $employee->updated_at,
                    'schedules_count' => $employee->schedules_count,
                    'calculated_rating' => $rating,
                    'working_day_weight' => $workingDayWeight,
                    'total_assigned_hours' => $totalWorkingHours,
                    'sub_sections_data' => $subSectionsData,
                ];
            });

        $sortEmployees = function ($employees) {
            return $employees->sortBy(function($employee) {
                return $employee['type'] === 'bulanan' ? 0 : 1;
            })->sortBy('working_day_weight')
            ->values();
        };

        $sameSubSectionEligible = $eligibleEmployees->filter(fn($employee) =>
            collect($employee['sub_sections_data'])->contains('id', $request->sub_section_id)
        );
        $otherSubSectionEligible = $eligibleEmployees->filter(fn($employee) =>
            !collect($employee['sub_sections_data'])->contains('id', $request->sub_section_id)
        );

        $sortedSameSubSectionEmployees = $sortEmployees($sameSubSectionEligible);
        $sortedOtherSubSectionEmployees = $sortEmployees($otherSubSectionEligible);

        return Inertia::render('Fullfill/Index', [
            'request' => $request,
            'sameSubSectionEmployees' => $sortedSameSubSectionEmployees,
            'otherSubSectionEmployees' => $sortedOtherSubSectionEmployees,
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    }

    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:employees,id',
            'fulfilled_by' => 'required|exists:users,id'
        ]);

        $req = ManPowerRequest::with('fulfilledBy')->findOrFail($id);

        if ($req->status === 'fulfilled') {
            return back()->withErrors([
                'fulfillment_error' => 'Permintaan ini sudah terpenuhi sebelumnya.'
            ]);
        }

        try {
            DB::transaction(function () use ($validated, $req) {
                $selectedEmployees = [];
                
                foreach ($validated['employee_ids'] as $employeeId) {
                    $employee = Employee::where('id', $employeeId)
                        ->where('status', 'available')
                        ->where('cuti', 'no')
                        ->whereDoesntHave('schedules', function ($query) use ($req) {
                            $query->where('date', $req->date);
                        })
                        ->first();
                
                    if (!$employee) {
                        throw new \Exception("Karyawan ID {$employeeId} tidak tersedia, sedang cuti, atau sudah dijadwalkan pada tanggal ini.");
                    }
                
                    Schedule::create([
                        'employee_id' => $employeeId,
                        'sub_section_id' => $req->sub_section_id,
                        'man_power_request_id' => $req->id,
                        'date' => $req->date,
                    ]);

                    $employee->status = 'assigned';
                    $employee->save();
                    
                    $selectedEmployees[] = $employee->name;
                }
            
                $req->status = 'fulfilled';
                $req->fulfilled_by = $validated['fulfilled_by'];
                $req->save();
                $req->date = Carbon::parse($req->date); // Ensure it's a Carbon instance

                Log::info('Manpower request fulfilled', [
                    'request_id' => $req->id,
                    'fulfilled_by' => $validated['fulfilled_by'],
                    'employees' => $selectedEmployees,
                    'date' => $req->date->format('Y-m-d')
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Fulfillment Error: ' . $e->getMessage(), [
                'exception' => $e, 
                'request_id' => $id,
                'user_id' => auth()->id()
            ]);
            
            return back()->withErrors([
                'fulfillment_error' => $e->getMessage()
            ]);
        }

        return redirect()
            ->route('manpower-requests.index')
            ->with('success', 'Permintaan berhasil dipenuhi');
    }
}