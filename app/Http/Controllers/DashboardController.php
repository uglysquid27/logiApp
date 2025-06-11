<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use App\Models\SubSection;
use App\Models\Shift; // <-- NEW: Import Shift model if you use it for filter options
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Display the dashboard view with summary data.
     */
    public function index(): Response
    {
        // Get counts for employees
        $activeEmployeesCount = Employee::where('status', 'available')
                                        ->where('cuti', 'no')
                                        ->count();
        $totalEmployeesCount = Employee::count();

        // Get counts for manpower requests
        $pendingRequestsCount = ManPowerRequest::where('status', 'pending')->count();
        $fulfilledRequestsCount = ManPowerRequest::where('status', 'fulfilled')->count();
        $totalRequestsCount = ManPowerRequest::count();

        // Get counts for schedules
        $today = Carbon::today();
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $endOfWeek = Carbon::now()->endOfWeek(Carbon::SUNDAY);

        $todaySchedulesCount = Schedule::whereDate('date', $today)->count();
        $thisWeekSchedulesCount = Schedule::whereBetween('date', [$startOfWeek, $endOfWeek])->count();
        $totalSchedulesCount = Schedule::count();

        // --- Chart Data 1: Manpower Request Status Trends (Monthly) ---
        $months = [];
        $pendingRequestsMonthly = [];
        $fulfilledRequestsMonthly = [];

        $currentMonth = Carbon::now()->startOfMonth();
        for ($i = 5; $i >= 0; $i--) {
            $month = $currentMonth->copy()->subMonths($i);
            $monthLabel = $month->translatedFormat('M Y');
            $months[] = $monthLabel;

            $pendingCount = ManPowerRequest::where('status', 'pending')
                                            ->whereYear('date', $month->year)
                                            ->whereMonth('date', $month->month)
                                            ->count();
            $fulfilledCount = ManPowerRequest::where('status', 'fulfilled')
                                              ->whereYear('date', $month->year)
                                              ->whereMonth('date', $month->month)
                                              ->count();

            $pendingRequestsMonthly[] = $pendingCount;
            $fulfilledRequestsMonthly[] = $fulfilledCount;
        }

        $manpowerRequestChartData = [
            'labels' => $months,
            'datasets' => [
                [
                    'label' => 'Pending Requests',
                    'data' => $pendingRequestsMonthly,
                    'backgroundColor' => 'rgba(251, 191, 36, 0.6)',
                    'borderColor' => 'rgba(251, 191, 36, 1)',
                    'borderWidth' => 1,
                ],
                [
                    'label' => 'Fulfilled Requests',
                    'data' => $fulfilledRequestsMonthly,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.6)',
                    'borderColor' => 'rgba(34, 197, 94, 1)',
                    'borderWidth' => 1,
                ],
            ],
        ];

        // --- Chart Data 2: Employee Assignment Distribution by Sub-Section ---
        $subSections = SubSection::all();
        $subSectionLabels = $subSections->pluck('name')->toArray();
        $assignedCounts = [];

        foreach ($subSections as $subSection) {
            $assignedCount = Schedule::where('sub_section_id', $subSection->id)
                                    ->distinct('employee_id')
                                    ->count('employee_id');
            $assignedCounts[] = $assignedCount;
        }

        $employeeAssignmentChartData = [
            'labels' => $subSectionLabels,
            'datasets' => [
                [
                    'label' => 'Assigned Employees',
                    'data' => $assignedCounts,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.6)',
                    'borderColor' => 'rgba(59, 130, 246, 1)',
                    'borderWidth' => 1,
                ],
            ],
        ];

        // --- New Data for Dashboard Sections (Tables) ---
        $recentPendingRequests = ManPowerRequest::where('status', 'pending')
                                                ->with(['subSection', 'shift'])
                                                ->orderBy('date', 'desc')
                                                ->limit(5)
                                                ->get();

        $upcomingSchedules = Schedule::where('date', '>=', $today)
                                     ->with(['employee', 'subSection', 'manPowerRequest.shift'])
                                     ->orderBy('date', 'asc')
                                     ->limit(5)
                                     ->get();


        return Inertia::render('Dashboard', [
            'summary' => [
                'activeEmployeesCount' => $activeEmployeesCount,
                'totalEmployeesCount' => $totalEmployeesCount,
                'pendingRequestsCount' => $pendingRequestsCount,
                'fulfilledRequestsCount' => $fulfilledRequestsCount,
                'totalRequestsCount' => $totalRequestsCount,
                'todaySchedulesCount' => $todaySchedulesCount,
                'thisWeekSchedulesCount' => $thisWeekSchedulesCount,
                'totalSchedulesCount' => $totalSchedulesCount,
            ],
            'manpowerRequestChartData' => $manpowerRequestChartData,
            'employeeAssignmentChartData' => $employeeAssignmentChartData,
            'recentPendingRequests' => $recentPendingRequests,
            'upcomingSchedules' => $upcomingSchedules,
        ]);
    }

    /**
     * Get paginated active employees for modal display.
     */
    public function getActiveEmployees(Request $request): \Illuminate\Http\JsonResponse
    {
        $employees = Employee::query()
                            ->where('status', 'available')
                            ->where('cuti', 'no')
                            ->when($request->input('filter_nik'), function ($query, $nik) {
                                $query->where('nik', 'like', '%' . $nik . '%');
                            })
                            ->when($request->input('filter_name'), function ($query, $name) {
                                $query->where('name', 'like', '%' . $name . '%');
                            })
                            ->when($request->input('filter_type'), function ($query, $type) {
                                $query->where('type', $type);
                            })
                            ->when($request->input('filter_status'), function ($query, $status) {
                                $query->where('status', $status);
                            })
                            ->when($request->input('filter_cuti'), function ($query, $cuti) {
                                $query->where('cuti', $cuti);
                            })
                            ->when($request->input('filter_created_at_from'), function ($query, $date) {
                                $query->whereDate('created_at', '>=', $date);
                            })
                            ->when($request->input('filter_created_at_to'), function ($query, $date) {
                                $query->whereDate('created_at', '<=', $date);
                            })
                            ->paginate(5)
                            ->withQueryString(); // Crucial to maintain filters in pagination links

        return response()->json($employees);
    }

    /**
     * Get paginated pending manpower requests for modal display.
     */
    public function getPendingRequests(Request $request): \Illuminate\Http\JsonResponse
    {
        $requests = ManPowerRequest::query()
                                    ->where('status', 'pending')
                                    ->with(['subSection', 'shift'])
                                    ->when($request->input('filter_date_from'), function ($query, $date) {
                                        $query->whereDate('date', '>=', $date);
                                    })
                                    ->when($request->input('filter_date_to'), function ($query, $date) {
                                        $query->whereDate('date', '<=', $date);
                                    })
                                    ->when($request->input('filter_sub_section_id'), function ($query, $subSectionId) {
                                        $query->where('sub_section_id', $subSectionId);
                                    })
                                    ->when($request->input('filter_shift_id'), function ($query, $shiftId) {
                                        $query->where('shift_id', $shiftId);
                                    })
                                    ->when($request->input('filter_requested_amount'), function ($query, $amount) {
                                        $query->where('requested_amount', $amount);
                                    })
                                    ->orderBy('date', 'desc')
                                    ->paginate(5)
                                    ->withQueryString(); // Crucial to maintain filters in pagination links

        return response()->json($requests);
    }

    /**
     * Get paginated fulfilled manpower requests for modal display.
     */
    public function getFulfilledRequests(Request $request): \Illuminate\Http\JsonResponse
    {
        $requests = ManPowerRequest::query()
                                    ->where('status', 'fulfilled')
                                    ->with(['subSection', 'shift'])
                                    ->when($request->input('filter_date_from'), function ($query, $date) {
                                        $query->whereDate('date', '>=', $date);
                                    })
                                    ->when($request->input('filter_date_to'), function ($query, $date) {
                                        $query->whereDate('date', '<=', $date);
                                    })
                                    ->when($request->input('filter_sub_section_id'), function ($query, $subSectionId) {
                                        $query->where('sub_section_id', $subSectionId);
                                    })
                                    ->when($request->input('filter_shift_id'), function ($query, $shiftId) {
                                        $query->where('shift_id', $shiftId);
                                    })
                                    ->when($request->input('filter_requested_amount'), function ($query, $amount) {
                                        $query->where('requested_amount', $amount);
                                    })
                                    ->orderBy('date', 'desc')
                                    ->paginate(5)
                                    ->withQueryString(); // Crucial to maintain filters in pagination links

        return response()->json($requests);
    }

    /**
     * Get paginated schedules for modal display.
     */
    public function getUpcomingSchedules(Request $request): \Illuminate\Http\JsonResponse
    {
        $today = Carbon::today();
        $schedules = Schedule::query()
                                ->where('date', '>=', $today)
                                ->with(['employee', 'subSection', 'manPowerRequest.shift'])
                                ->when($request->input('filter_date_from'), function ($query, $date) {
                                    $query->whereDate('date', '>=', $date);
                                })
                                ->when($request->input('filter_date_to'), function ($query, $date) {
                                    $query->whereDate('date', '<=', $date);
                                })
                                ->when($request->input('filter_employee_name'), function ($query, $employeeName) {
                                    $query->whereHas('employee', function ($q) use ($employeeName) {
                                        $q->where('name', 'like', '%' . $employeeName . '%');
                                    });
                                })
                                ->when($request->input('filter_sub_section_id'), function ($query, $subSectionId) {
                                    $query->where('sub_section_id', $subSectionId);
                                })
                                ->when($request->input('filter_shift_id'), function ($query, $shiftId) {
                                    $query->whereHas('manPowerRequest', function ($q) use ($shiftId) {
                                        $q->where('shift_id', $shiftId);
                                    });
                                })
                                ->orderBy('date', 'asc')
                                ->paginate(5)
                                ->withQueryString(); // Crucial to maintain filters in pagination links

        return response()->json($schedules);
    }
}