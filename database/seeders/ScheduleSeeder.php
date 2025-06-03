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
        // Fetch employees who are 'available' and NOT on 'cuti' for scheduling
        $eligibleEmployees = Employee::where('status', 'available')
                                     ->where('cuti', 'no')
                                     ->get();
        $subSections = SubSection::all();
        $manPowerRequests = ManPowerRequest::all();

        // Check if dependent tables have data
        if ($eligibleEmployees->isEmpty()) {
            $this->command->warn('No available Employees (not on cuti) found. Please run EmployeeSeeder first or ensure employees meet the criteria.');
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
        $employeesToAssignStatus = []; // To track employees whose status needs to be 'assigned'

        // Create 50 schedule entries
        foreach (range(1, 50) as $i) {
            // Randomly pick from eligible employees
            $employee = $eligibleEmployees->random();
            $manPowerRequest = $manPowerRequests->random();

            $scheduleDate = $manPowerRequest->date;

            // Double check employee eligibility before creating schedule
            // This is important if the random selection happens to pick an employee
            // that was just assigned in a previous iteration of this loop.
            $currentEmployee = Employee::find($employee->id);
            if (!$currentEmployee || $currentEmployee->cuti === 'yes' || $currentEmployee->status === 'assigned') {
                $this->command->info("Skipping schedule creation: Employee {$employee->name} (ID: {$employee->id}) is now on cuti or already assigned.");
                continue;
            }

            $existingSchedule = Schedule::where('employee_id', $currentEmployee->id)
                                        ->where('date', $scheduleDate)
                                        ->where('man_power_request_id', $manPowerRequest->id)
                                        ->first();

            if ($existingSchedule) {
                $this->command->info("Skipping schedule creation: Employee {$currentEmployee->name} (ID: {$currentEmployee->id}) is already scheduled for ManPowerRequest ID {$manPowerRequest->id} on {$scheduleDate}.");
                continue;
            }

            Schedule::create([
                'employee_id' => $currentEmployee->id,
                'sub_section_id' => $manPowerRequest->sub_section_id,
                'date' => $scheduleDate,
                'man_power_request_id' => $manPowerRequest->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $createdSchedulesCount++;

            // If the schedule is for today or a future date, mark the employee for 'assigned' status
            if (Carbon::parse($scheduleDate)->isSameDay(Carbon::today()) || Carbon::parse($scheduleDate)->isFuture()) {
                $employeesToAssignStatus[$currentEmployee->id] = true;
            }
        }

        $this->command->info("Successfully created {$createdSchedulesCount} schedule entries (excluding duplicates).");

        // Update employee statuses based on future/today schedules
        $updatedEmployeeStatusCount = 0;
        foreach ($employeesToAssignStatus as $employeeId => $value) {
            $employee = Employee::find($employeeId);
            if ($employee && $employee->status !== 'assigned') { // Only update if not already assigned
                $employee->status = 'assigned';
                $employee->save();
                $updatedEmployeeStatusCount++;
            }
        }
        if ($updatedEmployeeStatusCount > 0) {
            $this->command->info("Updated {$updatedEmployeeStatusCount} employee statuses to 'assigned' based on future/today schedules.");
        } else {
            $this->command->info('No employee statuses needed updating to "assigned".');
        }

        // Update ManPowerRequest statuses
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
