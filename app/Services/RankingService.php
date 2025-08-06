<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Workload;
use App\Models\BlindTest;
use App\Models\Rating;
use App\Models\Ranking;
use Illuminate\Support\Facades\DB;

class RankingService
{
    public function calculateAllRankings()
    {
        // Get all employees
        $employees = Employee::all();

        // Prepare ranking data
        $rankings = $employees->map(function ($employee) {
            // Get latest workload (assuming you want the most recent)
            $workload = Workload::where('employee_id', $employee->id)
                ->latest('week')
                ->first();
            
            // Get average rating
            $rating = Rating::where('employee_id', $employee->id)
                ->avg('rating') ?? 0;
            
            // Get latest blind test result
            $blindTest = BlindTest::where('employee_id', $employee->id)
                ->latest('test_date')
                ->first();
            
            return [
                'employee_id' => $employee->id,
                'workload' => $workload->workload_point ?? 0,
                'rating_score' => $rating,
                'blind_test_score' => $blindTest->result ?? 0,
                'total_score' => Ranking::calculateTotalScore(
                    $workload->workload_point ?? 0,
                    $rating,
                    $blindTest->result ?? 0
                )
            ];
        })
        ->sortByDesc('total_score')
        ->values()
        ->map(function ($item, $index) {
            $item['ranking'] = $index + 1;
            return $item;
        });

        // Update rankings in transaction
        DB::transaction(function () use ($rankings) {
            foreach ($rankings as $rankingData) {
                Ranking::updateOrCreate(
                    ['employee_id' => $rankingData['employee_id']],
                    [
                        'workload' => $rankingData['workload'],
                        'rating_score' => $rankingData['rating_score'],
                        'blind_test_score' => $rankingData['blind_test_score'],
                        'total_score' => $rankingData['total_score'],
                        'ranking' => $rankingData['ranking']
                    ]
                );
            }
        });

        return $rankings;
    }
}