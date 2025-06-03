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
        // FIX: Filter employees to only include those with 'available' status,
        // as 'aktif' is no longer a valid status in the updated migration.
        $employees = Employee::where('status', 'available')->get();
        $subSections = SubSection::all();
        $manPowerRequests = ManPowerRequest::all();

        // Check if dependent tables have data
        if ($employees->isEmpty()) {
            $this->command->warn('No available Employees found. Please run EmployeeSeeder first or ensure employees have "available" status.');
            return;
        }
        if ($subSections->isEmpty()) {
            $this->command->warn('No SubSections found. Please run SubSectionSeeder first.');
            return;
        }
        if ($manPowerRequests->isEmpty()) {
            $this->command->warn('No ManPowerRequests found. Please run ManPowerRequestSeeder first.');
            return;
        }

        $createdSchedulesCount = 0;

        // Create 50 schedule entries
        foreach (range(1, 50) as $i) {
            $employee = $employees->random();
            $manPowerRequest = $manPowerRequests->random();

            // Use the date from the ManPowerRequest for the schedule
            $scheduleDate = $manPowerRequest->date;

            // Prevent duplicate schedules for the same employee on the same day and for the same request
            $existingSchedule = Schedule::where('employee_id', $employee->id)
                                        ->where('date', $scheduleDate)
                                        ->where('man_power_request_id', $manPowerRequest->id)
                                        ->first();

            if ($existingSchedule) {
                $this->command->info("Skipping schedule creation: Employee {$employee->name} (ID: {$employee->id}) is already scheduled for ManPowerRequest ID {$manPowerRequest->id} on {$scheduleDate}.");
                continue;
            }

            Schedule::create([
                'employee_id' => $employee->id,
                'sub_section_id' => $manPowerRequest->sub_section_id, // Link to the sub-section of the request
                'date' => $scheduleDate,
                'man_power_request_id' => $manPowerRequest->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $createdSchedulesCount++;
        }

        $this->command->info("Successfully created {$createdSchedulesCount} schedule entries (excluding duplicates).");

        // FIX: Update ManPowerRequest statuses based on whether schedules were created for them.
        // This ensures a more consistent seeded state.
        $updatedRequestCount = 0;
        foreach ($manPowerRequests as $requestToUpdate) {
            // Check if any schedules were created for this specific ManPowerRequest
            if ($requestToUpdate->schedules()->exists() && $requestToUpdate->status !== 'fulfilled') {
                $requestToUpdate->status = 'fulfilled';
                $requestToUpdate->save();
                $updatedRequestCount++;
            }
        }

        if ($updatedRequestCount > 0) {
            $this->command->info("Updated {$updatedRequestCount} ManPowerRequest statuses to 'fulfilled' based on created schedules.");
        } else {
            $this->command->info('No ManPowerRequest statuses needed updating based on created schedules.');
        }
    }
}
