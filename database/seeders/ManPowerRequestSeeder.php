<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ManPowerRequest;
use App\Models\SubSection;
use App\Models\Shift; // Import the Shift model
use Carbon\Carbon;

class ManPowerRequestSeeder extends Seeder
{
    public function run(): void
    {
        $subSections = SubSection::all();
        $shifts = Shift::all(); // Fetch all available shifts
        $today = Carbon::today();

        // Check if dependent tables have data
        if ($subSections->isEmpty()) {
            $this->command->warn('No SubSections found. Please run SubSectionSeeder first.');
            return;
        }
        if ($shifts->isEmpty()) {
            $this->command->warn('No Shifts found. Please run ShiftSeeder first.'); // Warn if no shifts
            return;
        }

        foreach (range(1, 20) as $i) {
            $subSection = $subSections->random();
            $shift = $shifts->random(); // Get a random shift

            ManPowerRequest::create([
                'sub_section_id' => $subSection->id,
                'shift_id' => $shift->id, // Assign the random shift_id
                'date' => $today->copy()->subDays(rand(0, 19)),
                'requested_amount' => rand(1, 3), // maksimal 3 employee per request
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Berhasil membuat 20 man power requests.');
    }
}
