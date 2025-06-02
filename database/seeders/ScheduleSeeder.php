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
        // Filter employees to only include those with 'aktif' status
        $employees = Employee::where('status', 'aktif')->get();
        $subSections = SubSection::all();
        $manPowerRequests = ManPowerRequest::all();

        // Check if dependent tables have data
        if ($employees->isEmpty()) {
            $this->command->warn('No active Employees found. Please run EmployeeSeeder first or ensure employees have "aktif" status.');
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

            // Prevent duplicate schedules for the same employee on the same day and for the same request
            // This check ensures an employee is not assigned to the same specific request (which implies date and shift) twice.
            $existingSchedule = Schedule::where('employee_id', $employee->id)
                                        ->where('date', $scheduleDate)
                                        ->where('man_power_request_id', $manPowerRequest->id)
                                        ->first();

            if ($existingSchedule) {
                // If a duplicate is found, skip this iteration
                $this->command->info("Skipping schedule creation: Employee {$employee->name} (ID: {$employee->id}) is already scheduled for ManPowerRequest ID {$manPowerRequest->id} on {$scheduleDate}.");
                continue; // Move to the next iteration of the loop
            }

            Schedule::create([
                'employee_id' => $employee->id,
                'sub_section_id' => $manPowerRequest->sub_section_id, // Link to the sub-section of the request
                'date' => $scheduleDate,
                'man_power_request_id' => $manPowerRequest->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully created 50 schedule entries (excluding duplicates).');

        // Update ManPowerRequest statuses
        $allManPowerRequests = ManPowerRequest::all();
        $today = Carbon::today();
        $updatedCount = 0;

        foreach ($allManPowerRequests as $requestToUpdate) {
            $requestDate = Carbon::parse($requestToUpdate->date);
            $scheduledEmployeeCount = Schedule::where('man_power_request_id', $requestToUpdate->id)->count();

            if ($requestDate->isPast() || ($requestDate->isToday() && $scheduledEmployeeCount >= $requestToUpdate->requested_amount)) {
                if ($requestToUpdate->status !== 'fulfilled') { // Only update if not already fulfilled
                    $requestToUpdate->status = 'fulfilled';
                    $requestToUpdate->save();
                    $updatedCount++;
                }
            }
        }

        if ($updatedCount > 0) {
            $this->command->info("Updated $updatedCount ManPowerRequest statuses to 'fulfilled' based on dates and schedule fulfillment.");
        } else {
            $this->command->info('No ManPowerRequest statuses needed updating based on dates and schedule fulfillment.');
        }
    }
}
