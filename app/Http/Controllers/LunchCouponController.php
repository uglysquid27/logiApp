<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Schedule;
use Inertia\Inertia;
use Carbon\Carbon;

class LunchCouponController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with([
            'employee',
            'subSection.section',
            'manPowerRequest.shift',
            'manPowerRequest.subSection.section'
        ])->where('status', 'accepted'); // Only count accepted schedules

        $date = $request->input('date', today()->toDateString());

        if ($date) {
            $query->whereDate('date', Carbon::parse($date));
        }

        $schedules = $query->orderBy('date')->get();

        // Group by date and count employees
        $groupedSchedules = $schedules->groupBy(function ($schedule) {
            return $schedule->date->format('Y-m-d');
        })->map(function ($dateSchedules) {
            return [
                'date' => $dateSchedules->first()->date->format('Y-m-d'),
                'display_date' => $dateSchedules->first()->date->format('l, d F Y'),
                'employee_count' => $dateSchedules->count(),
                'schedules' => $dateSchedules
            ];
        })->values();

        return Inertia::render('LunchCoupons/Index', [
            'schedules' => $groupedSchedules,
            'filters' => [
                'date' => $date,
            ],
            'totalCoupons' => $schedules->count()
        ]);
    }
}