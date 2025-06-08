<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Shift; // Import the Shift model
use Carbon\Carbon;
use Faker\Factory as Faker;

class ManPowerRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $subSections = SubSection::all();
        $shifts = Shift::all(); // Fetch all shifts

        if ($subSections->isEmpty()) {
            $this->command->warn('No SubSections found. Please run SubSectionSeeder first.');
            return;
        }
        if ($shifts->isEmpty()) {
            $this->command->warn('No Shifts found. Please run ShiftSeeder first.');
            return;
        }

        // Create 20 man power requests with dates spanning from recent past to near future
        foreach (range(1, 20) as $i) {
            $subSection = $subSections->random();
            $shift = $shifts->random(); // Pick a random shift

            // Generate dates from 10 days ago to 10 days in the future
            $randomDays = rand(-10, 10);
            $requestDate = Carbon::today()->addDays($randomDays);

            // Use the shift's predefined start and end times
            // This is the logic where `start_time` and `end_time` are directly taken from the selected shift
            $startTime = $shift->start_time;
            $endTime = $shift->end_time;

            ManPowerRequest::create([
                'sub_section_id' => $subSection->id,
                'date' => $requestDate->toDateString(),
                'shift_id' => $shift->id, // FIX: Include shift_id here
                'start_time' => $startTime,
                'end_time' => $endTime,
                'requested_amount' => rand(1, 3),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully created 20 man power requests with shifts and custom times.');
    }
}
