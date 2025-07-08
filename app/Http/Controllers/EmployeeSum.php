<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Section;
use App\Models\SubSection;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rules;
use App\Http\Requests\DeactivateEmployeeRequest;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class EmployeeSum extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): Response
    {
        $startDate = Carbon::now()->subDays(6)->startOfDay();
        $endDate = Carbon::now()->endOfDay();

        $query = Employee::withCount('schedules')
            ->withCount(['schedules as schedules_count_weekly' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('date', [$startDate, $endDate]);
            }])
            ->with(['schedules' => function ($query) {
                $query->whereDate('date', Carbon::today())
                    ->with('manPowerRequest.shift');
            }, 'subSections.section']);

        // Apply Filters
        if ($request->has('status') && $request->input('status') !== 'All') {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('section') && $request->input('section') !== 'All') {
            $sectionName = $request->input('section');
            $query->whereHas('subSections.section', function ($q) use ($sectionName) {
                $q->where('name', $sectionName);
            });
        }

        if ($request->has('sub_section') && $request->input('sub_section') !== 'All') {
            $subSectionName = $request->input('sub_section');
            $query->whereHas('subSections', function ($q) use ($subSectionName) {
                $q->where('name', $subSectionName);
            });
        }

        // Search by Name or NIK
        if ($request->has('search') && $request->input('search') !== null) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('nik', 'like', '%' . $searchTerm . '%');
            });
        }

        $employees = $query->orderBy('name')
            ->paginate(10)
            ->through(function ($employee) {
                // Override status based on today's schedule
                $employee->status = $employee->isAssignedToday() ? 'assigned' : 'available';

                // Calculate total assigned hours (for today's schedules only)
                $totalWorkingHours = $employee->schedules
                    ->sum(function ($schedule) {
                        return $schedule->manPowerRequest->shift->hours ?? 0;
                    });

                // Rating logic
                $weeklyScheduleCount = $employee->schedules_count_weekly;
                $rating = match (true) {
                    $weeklyScheduleCount >= 5 => 5,
                    $weeklyScheduleCount == 4 => 4,
                    $weeklyScheduleCount == 3 => 3,
                    $weeklyScheduleCount == 2 => 1,
                    $weeklyScheduleCount == 1 => 1,
                    default => 0,
                };

                $workingDayWeight = match ($rating) {
                    5 => 15,
                    4 => 45,
                    3 => 75,
                    2 => 105,
                    1 => 135,
                    default => 165,
                };

                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                // Remove schedules from response to reduce payload
                unset($employee->schedules);

                return $employee;
            });

        // Fetch filter dropdown options
        $allStatuses = ['All', 'available', 'assigned'];
        $allSections = Section::select('name')->distinct()->pluck('name')->toArray();
        $allSubSections = SubSection::select('name')->distinct()->pluck('name')->toArray();

        return Inertia::render('EmployeeAttendance/Index', [
            'employees' => $employees,
            'filters' => $request->only(['status', 'section', 'sub_section', 'search']),
            'uniqueStatuses' => $allStatuses,
            'uniqueSections' => array_merge(['All'], $allSections),
            'uniqueSubSections' => array_merge(['All'], $allSubSections),
        ]);
    }

    public function resetAllStatuses(Request $request)
    {
        try {
            DB::transaction(function () {
                Employee::query()->update([
                    'status' => 'available',
                    'cuti' => 'no',
                ]);
            });

            return redirect()->back()->with('success', 'All employee statuses reset successfully.');
        } catch (\Exception $e) {
            Log::error('Error resetting employee statuses: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to reset statuses. Please try again.');
        }
    }

    public function create(): Response
    {
        $sections = Section::all();
        $subSections = SubSection::all();
        
        $uniqueSections = $sections->pluck('name')->unique()->prepend('All');
        $uniqueSubSections = $subSections->pluck('name')->unique()->prepend('All');

        return Inertia::render('EmployeeAttendance/Create', [
            'uniqueSections' => $uniqueSections,
            'uniqueSubSections' => $uniqueSubSections,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'required|string|max:255|unique:employees,nik',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'type' => 'required|in:harian,bulanan',
            'status' => 'required|in:available,assigned,on leave',
            'cuti' => 'required|in:yes,no',
            'gender' => 'required|in:male,female',
            'sub_sections' => 'array',
            'sub_sections.*' => 'string|exists:sub_sections,name',
        ]);

        $employee = Employee::create([
            'name' => $validated['name'],
            'nik' => $validated['nik'],
            'password' => Hash::make($validated['password']),
            'type' => $validated['type'],
            'status' => $validated['status'],
            'cuti' => $validated['cuti'],
            'gender' => $validated['gender'],
        ]);

        if (!empty($validated['sub_sections'])) {
            $subSectionIds = SubSection::whereIn('name', $validated['sub_sections'])
                ->pluck('id')
                ->toArray();
            
            $employee->subSections()->attach($subSectionIds);
        }

        return Redirect::route('employee-attendance.index')->with('success', 'Pegawai berhasil ditambahkan.');
    }

    public function show(Employee $employee)
    {
        return Inertia::render('Employees/Show', [
            'employee' => $employee->load('subSections.section'),
        ]);
    }

    public function edit(Employee $employee)
    {
        $sections = Section::all();
        $subSections = SubSection::all();
        
        $uniqueSections = $sections->pluck('name')->unique()->prepend('All');
        $uniqueSubSections = $subSections->pluck('name')->unique()->prepend('All');

        return Inertia::render('Employees/Edit', [
            'employee' => $employee->load('subSections'),
            'uniqueSections' => $uniqueSections,
            'uniqueSubSections' => $uniqueSubSections,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nik' => 'required|string|max:255|unique:employees,nik,' . $employee->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'type' => 'required|in:harian,bulanan',
            'status' => 'required|in:available,assigned,on leave',
            'cuti' => 'required|in:yes,no',
            'gender' => 'required|in:male,female',
            'sub_sections' => 'array',
            'sub_sections.*' => 'string|exists:sub_sections,name',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'nik' => $validated['nik'],
            'type' => $validated['type'],
            'status' => $validated['status'],
            'cuti' => $validated['cuti'],
            'gender' => $validated['gender'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $employee->update($updateData);

        if (isset($validated['sub_sections'])) {
            $subSectionIds = SubSection::whereIn('name', $validated['sub_sections'])
                ->pluck('id')
                ->toArray();
            
            $employee->subSections()->sync($subSectionIds);
        } else {
            $employee->subSections()->detach();
        }

        return Redirect::route('employee-attendance.index')->with('success', 'Pegawai berhasil diperbarui.');
    }


    public function inactive(Request $request)
    {
        try {
            Log::info('Accessing inactive employees list', [
                'user_id' => auth()->id(),
                'time' => now(),
                'request_params' => $request->all()
            ]);
    
            $query = Employee::where('status', 'deactivated')
                ->orWhereNotNull('deactivated_at')
                ->with(['subSections.section']); // Removed deactivatedBy
    
            if ($request->has('search') && $request->input('search') !== null) {
                $searchTerm = $request->input('search');
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', '%'.$searchTerm.'%')
                      ->orWhere('nik', 'like', '%'.$searchTerm.'%');
                });
            }
    
            $employees = $query->paginate(10);
    
            return Inertia::render('EmployeeAttendance/Inactive', [
                'employees' => $employees,
                'filters' => $request->only('search')
            ]);
    
        } catch (\Exception $e) {
            Log::error('Failed to retrieve inactive employees', [
                'error' => $e->getMessage(),
                'stack_trace' => $e->getTraceAsString(),
                'user_id' => auth()->id()
            ]);
    
            return back()->with('error', 'Failed to load inactive employees. Please try again.');
        }
    }

    public function deactivate(Employee $employee)
    {
        return Inertia::render('EmployeeAttendance/Deactivate', [
            'employee' => $employee->only('id', 'name', 'nik'),
            'reasons' => [
                'resignation' => 'Resignation',
                'termination' => 'Termination',
                'retirement' => 'Retirement',
                'other' => 'Other'
            ]
        ]);
    }

    public function processDeactivation(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'deactivation_reason' => 'required|string|max:255',
            'deactivation_notes' => 'nullable|string'
        ]);

        $employee->update([
            'status' => 'deactivated',
            'deactivation_reason' => $validated['deactivation_reason'],
            'deactivation_notes' => $validated['deactivation_notes'],
            'deactivated_at' => now(),
            'deactivated_by' => auth()->id()
        ]);

        return redirect()->route('employee-attendance.inactive')
            ->with('success', 'Employee deactivated successfully');
    }

    public function destroy(Employee $employee)
    {
        if ($employee->status !== 'deactivated') {
            return back()->with('error', 'Only deactivated employees can be deleted');
        }

        $employee->delete();

        return redirect()->route('employee-attendance.inactive')
            ->with('success', 'Employee permanently deleted');
    }

}