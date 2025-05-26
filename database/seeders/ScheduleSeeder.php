<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Schedule;
use App\Models\Employee;
use App\Models\SubSection;
use App\Models\ManPowerRequest;
use Carbon\Carbon;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch existing data from dependent tables
        $employees = Employee::all();
        $subSections = SubSection::all();
        $manPowerRequests = ManPowerRequest::all();

        // Check if dependent tables have data
        if ($employees->isEmpty()) {
            $this->command->warn('No Employees found. Please run EmployeeSeeder first.');
            return;
        }
        if ($subSections->isEmpty()) {
            $this->command->warn('No SubSections found. Please run SubSectionSeeder first.');
            return;
        }
        if ($manPowerRequests->isEmpty()) {
            $this->command->warn('No ManPowerRequests found. Please run ManPowerRequestSeeder first.');
            return;
            // Note: ManPowerRequestSeeder depends on SubSectionSeeder, so ensure that order in DatabaseSeeder
        }

        // Create 50 schedule entries
        foreach (range(1, 50) as $i) {
            $employee = $employees->random();
            $manPowerRequest = $manPowerRequests->random();

            // Use the date from the ManPowerRequest for the schedule,
            // or a date close to it for variety if desired.
            // For simplicity, we'll use the request date directly.
            $scheduleDate = $manPowerRequest->date;

            Schedule::create([
                'employee_id' => $employee->id,
                'sub_section_id' => $manPowerRequest->sub_section_id, // Link to the sub-section of the request
                'date' => $scheduleDate,
                'man_power_request_id' => $manPowerRequest->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully created 50 schedule entries.');
    }
}
