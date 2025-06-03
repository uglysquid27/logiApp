<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ManPowerRequest;
use App\Models\Schedule;
use App\Models\SubSection;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard view with summary data.
     */
    public function index(): Response
    {
        // Get counts for employees
        // FIX: Updated definition of 'activeEmployeesCount'
        $activeEmployeesCount = Employee::where('status', 'available')
                                        ->where('cuti', 'no') // Ensure they are not on 'cuti'
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

        // Get data for the last 6 months including current month
        $currentMonth = Carbon::now()->startOfMonth();
        for ($i = 5; $i >= 0; $i--) { // Loop for last 6 months (0 to 5 months ago)
            $month = $currentMonth->copy()->subMonths($i);
            $monthLabel = $month->translatedFormat('M Y'); // e.g., 'Jun 2025' in Indonesian locale
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
                    'backgroundColor' => 'rgba(251, 191, 36, 0.6)', // Tailwind yellow-400 with opacity
                    'borderColor' => 'rgba(251, 191, 36, 1)',
                    'borderWidth' => 1,
                ],
                [
                    'label' => 'Fulfilled Requests',
                    'data' => $fulfilledRequestsMonthly,
                    'backgroundColor' => 'rgba(34, 197, 94, 0.6)', // Tailwind green-500 with opacity
                    'borderColor' => 'rgba(34, 197, 94, 1)',
                    'borderWidth' => 1,
                ],
            ],
        ];

        // --- Chart Data 2: Employee Assignment Distribution by Sub-Section ---
        // Fetch SubSection names for labels
        $subSections = SubSection::all();
        $subSectionLabels = $subSections->pluck('name')->toArray();
        $assignedCounts = [];

        foreach ($subSections as $subSection) {
            $assignedCount = Schedule::where('sub_section_id', $subSection->id)
                                    ->distinct('employee_id') // Count unique employees assigned to this sub-section
                                    ->count('employee_id');
            $assignedCounts[] = $assignedCount;
        }

        $employeeAssignmentChartData = [
            'labels' => $subSectionLabels,
            'datasets' => [
                [
                    'label' => 'Assigned Employees',
                    'data' => $assignedCounts,
                    'backgroundColor' => 'rgba(59, 130, 246, 0.6)', // Tailwind blue-500 with opacity
                    'borderColor' => 'rgba(59, 130, 246, 1)',
                    'borderWidth' => 1,
                ],
            ],
        ];

        // --- New Data for Dashboard Sections ---
        // Recent Pending Manpower Requests (e.g., last 5 pending requests)
        $recentPendingRequests = ManPowerRequest::where('status', 'pending')
                                                ->with(['subSection', 'shift']) // Eager load relationships
                                                ->orderBy('date', 'desc') // Change to descending order for recent requests
                                                ->limit(5)
                                                ->get();

        // Upcoming Schedules (e.g., next 5 schedules from today onwards)
        $upcomingSchedules = Schedule::where('date', '>=', $today)
                                     ->with(['employee', 'subSection', 'manPowerRequest.shift']) // Eager load relationships
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
}
