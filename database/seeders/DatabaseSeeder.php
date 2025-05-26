<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\SubSection;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            EmployeeSeeder::class,
            SectionSeeder::class,
            SubSectionSeeder::class,
            EmployeeSubSectionSeeder::class,
            ManPowerRequestSeeder::class,
            ScheduleSeeder::class,
        ]);
    }
}
