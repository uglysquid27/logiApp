<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ManPowerRequest;
use App\Models\SubSection;
use Carbon\Carbon;
use Faker\Factory as Faker; // Import Faker

class ManPowerRequestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create(); // Create Faker instance
        $subSections = SubSection::all();

        if ($subSections->isEmpty()) {
            $this->command->warn('No SubSections found. Please run SubSectionSeeder first.');
            return;
        }

        // Create 20 man power requests with dates spanning from recent past to near future
        foreach (range(1, 20) as $i) {
            $subSection = $subSections->random();

            // Generate dates from 10 days ago to 10 days in the future
            $randomDays = rand(-10, 10);
            $requestDate = Carbon::today()->addDays($randomDays);

            // Generate random start and end times
            $startHour = $faker->numberBetween(7, 18); // e.g., between 07:00 and 18:00
            $startMinute = $faker->randomElement(['00', '30']);
            $startTime = Carbon::parse("{$startHour}:{$startMinute}")->format('H:i');

            $endHour = $faker->numberBetween($startHour + 1, 23); // End hour after start hour, up to 23:00
            $endMinute = $faker->randomElement(['00', '30']);
            $endTime = Carbon::parse("{$endHour}:{$endMinute}")->format('H:i');

            // Ensure end time is after start time if they are on the same day
            if ($startHour === $endHour && $startMinute >= $endMinute) {
                $endTime = Carbon::parse($startTime)->addHours(2)->format('H:i'); // Ensure at least 2 hours difference
            }


            ManPowerRequest::create([
                'sub_section_id' => $subSection->id,
                'date' => $requestDate->toDateString(),
                'start_time' => $startTime, // NEW
                'end_time' => $endTime,     // NEW
                'requested_amount' => rand(1, 3),
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully created 20 man power requests with varied dates and custom times.');
    }
}
