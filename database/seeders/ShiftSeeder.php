<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        Shift::firstOrCreate(['id' => 1], [ // Using firstOrCreate to prevent duplicates on re-seed
            'name' => 'Pagi',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'hours' => 8,
        ]);
        Shift::firstOrCreate(['id' => 2], [
            'name' => 'Siang',
            'start_time' => '16:00',
            'end_time' => '00:00', // Represents midnight of the next day
            'hours' => 8,
        ]);
        Shift::firstOrCreate(['id' => 3], [
            'name' => 'Malam',
            'start_time' => '00:00', // Represents midnight of the current day
            'end_time' => '08:00',
            'hours' => 8,
        ]);

        $this->command->info('Shifts seeded successfully.');
    }
}