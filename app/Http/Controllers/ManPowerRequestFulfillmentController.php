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
    $request = ManPowerRequest::with('subSection.section', 'shift')->findOrFail($id);

    if ($request->status === 'fulfilled') {
        return Inertia::render('Fullfill/Index', [
            'request' => $request,
            'sameSubSectionEmployees' => [],
            'otherSubSectionEmployees' => [],
            'message' => 'This request has already been fulfilled.',
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
                        ->where('status', 'available')
                        ->where('cuti', 'no')
                        ->whereDoesntHave('schedules', function ($query) use ($req) {
                            $query->where('date', $req->date);
                        })
                        ->first();
                
                    if (!$employee) {
                        throw new \Exception("Karyawan ID {$employeeId} tidak tersedia, sedang cuti, atau sudah dijadwalkan pada {$req->date->format('d M Y')}.");
                    }
                
                    Schedule::create([
                        'employee_id' => $employeeId,
                        'sub_section_id' => $req->sub_section_id,
                        'man_power_request_id' => $req->id,
                        'date' => $req->date,
                    ]);

                    $employee->status = 'assigned';
                    $employee->save();
                }
            
                $req->status = 'fulfilled';
                $req->save();
            });
        } catch (\Exception $e) {
            Log::error('Fulfillment Error: ' . $e->getMessage(), ['exception' => $e, 'request_id' => $id]);
            return back()->withErrors(['fulfillment_error' => $e->getMessage()]);
        }
    
        return redirect()->route('manpower-requests.index')->with('success', 'Request berhasil dipenuhi');
    }
}