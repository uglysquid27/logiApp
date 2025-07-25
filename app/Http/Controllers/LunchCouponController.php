<?php
// app/Http/Controllers/LunchCouponController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Schedule;
use App\Models\LunchCoupon;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LunchCouponController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with([
            'employee',
            'subSection.section',
            'manPowerRequest.shift',
            'manPowerRequest.subSection.section',
            'lunchCoupon'
        ])->where('status', 'accepted');

        $date = $request->input('date', today()->toDateString());

        if ($date) {
            $query->whereDate('date', Carbon::parse($date));
        }

        $schedules = $query->orderBy('date')->get();

        // Get existing lunch coupons for the selected date
        $lunchCoupons = LunchCoupon::whereDate('date', $date)
            ->get()
            ->keyBy('schedule_id');

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
            'totalCoupons' => $schedules->count(),
            'lunchCoupons' => $lunchCoupons->toArray() // Convert to array
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'schedule_ids' => 'required|array',
            'schedule_ids.*' => 'exists:schedules,id'
        ]);

        $date = $request->date;
        $scheduleIds = $request->schedule_ids;

        DB::transaction(function () use ($date, $scheduleIds) {
            // First delete any existing coupons for this date
            LunchCoupon::whereDate('date', $date)->delete();

            // Create new coupons for selected schedules
            foreach ($scheduleIds as $scheduleId) {
                $schedule = Schedule::findOrFail($scheduleId);
                
                LunchCoupon::create([
                    'date' => $date,
                    'schedule_id' => $scheduleId,
                    'employee_id' => $schedule->employee_id,
                    'status' => 'pending'
                ]);
            }
        });

        return redirect()->back()->with('success', 'Lunch coupons saved successfully!');
    }
}