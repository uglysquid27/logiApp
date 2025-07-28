<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Section;
use App\Models\SubSection;
use App\Models\BlindTest; // Import the BlindTest model
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
            }, 'subSections.section'])
            ->with(['blindTests' => function ($query) { // Eager load the latest blind test result
                $query->orderBy('test_date', 'desc')->limit(1);
            }]);

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

                // Rating logic (existing calculation)
                $weeklyScheduleCount = $employee->schedules_count_weekly;
                $rating = match (true) {
                    $weeklyScheduleCount >= 5 => 5,
                    $weeklyScheduleCount == 4 => 4,
                    $weeklyScheduleCount == 3 => 3,
                    $weeklyScheduleCount == 2 => 1,
                    $weeklyScheduleCount == 1 => 1,
                    default => 0,
                };

                // Base working day weight from existing rating logic
                $workingDayWeight = match ($rating) {
                    5 => 15,
                    4 => 45,
                    3 => 75,
                    2 => 105,
                    1 => 135,
                    default => 165,
                };

                // --- Start Blind Test KPI Contribution Calculation ---
                $blindTestKpiContribution = 0;
                // Get the eager loaded latest blind test result
                $latestBlindTest = $employee->blindTests->first();

                if ($latestBlindTest) {
                    // Directly add the actual value of blind test (0-100) to workload
                    $blindTestKpiContribution = $latestBlindTest->result;
                }
                // --- End Blind Test KPI Contribution Calculation ---

                // Add the calculated blind test contribution to the existing workingDayWeight
                $workingDayWeight += $blindTestKpiContribution;

                $employee->setAttribute('calculated_rating', $rating);
                $employee->setAttribute('working_day_weight', $workingDayWeight);
                $employee->setAttribute('total_assigned_hours', $totalWorkingHours);

                // Remove schedules and blindTests from response to reduce payload
                unset($employee->schedules);
                unset($employee->blindTests);

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
            return redirect()->back()->with('error', 'Terjadi kesalahan saat mereset status karyawan. Silakan coba lagi.');
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
        $sections = Section::with('subSections')->get();
        
        // Get all unique section names (excluding 'All')
        $uniqueSections = $sections->pluck('name')
            ->unique()
            ->reject(fn($name) => $name === 'All')
            ->values()
            ->toArray();

        // Group sub-sections by section name
        $groupedSubSections = $sections->mapWithKeys(function ($section) {
            return [$section->name => $section->subSections->pluck('name')->toArray()];
        });

        // Get current sections from employee's sub-sections
        $currentSections = $employee->subSections->pluck('section.name')
            ->unique()
            ->toArray();

        return Inertia::render('EmployeeAttendance/Edit', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik,
                'type' => $employee->type,
                'status' => $employee->status,
                'cuti' => $employee->cuti,
                'gender' => $employee->gender,
                'sections' => $currentSections,
                'sub_sections' => $employee->subSections->pluck('name')->toArray(),
            ],
            'sections' => $uniqueSections,
            'groupedSubSections' => $groupedSubSections,
        ]);
    }

   public function update(Request $request, Employee $employee)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'nik' => 'required|string|max:255|unique:employees,nik,'.$employee->id,
        'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        'type' => 'required|in:harian,bulanan',
        'status' => 'required|in:available,assigned,on leave',
        'cuti' => 'required|in:yes,no',
        'gender' => 'required|in:male,female',
        'sections' => 'required|array|min:1',
        'sections.*' => 'string|exists:sections,name',
        'sub_sections' => 'required|array|min:1',
        'sub_sections.*' => 'string|exists:sub_sections,name',
    ]);

    // Verify each subsection belongs to at least one selected section
    $validSubSections = [];
    foreach ($validated['sub_sections'] as $subSectionName) {
        $subSection = SubSection::where('name', $subSectionName)
            ->whereHas('section', function($query) use ($validated) {
                $query->whereIn('name', $validated['sections']);
            })
            ->first();

        if ($subSection) {
            $validSubSections[] = $subSection->id;
        }
    }

    DB::transaction(function () use ($employee, $validated, $validSubSections) {
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
        $employee->subSections()->sync($validSubSections);
    });

    return redirect()->route('employee-attendance.index')
        ->with('success', 'Employee updated successfully.');
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
                ->with(['subSections.section']);

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

    public function activate(Employee $employee)
    {
        try {
            DB::transaction(function () use ($employee) {
                $employee->update([
                    'status' => 'available',
                    'deactivated_at' => null,
                    'deactivated_by' => null,
                    'deactivation_reason' => null,
                    'deactivation_notes' => null
                ]);
            });

            return redirect()->back()->with('success', 'Employee activated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed to activate employee: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to activate employee.');
        }
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
            'deactivation_notes' => $validated['deactivation_notes'], // Fixed this line
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