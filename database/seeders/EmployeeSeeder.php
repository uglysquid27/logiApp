<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker; // Ensure this line is present

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create(); // Create an instance of Faker

        for ($i = 1; $i <= 100; $i++) {
            $isCuti = $faker->randomElement(['yes', 'no']);
            $status = 'available'; // Default status if on cuti or randomly chosen if not

            if ($isCuti === 'no') {
                // If the employee is NOT on 'cuti', their status can be 'available' or 'assigned'.
                $status = $faker->randomElement(['available', 'assigned']);
            }
            // If $isCuti is 'yes', $status remains 'available' as per the initial default.

            Employee::create([
                'nik'    => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT), // e.g., EMP0001
                'name'   => $faker->name(), // Use the $faker instance
                'type'   => $faker->randomElement(['harian', 'bulanan']), // Use the $faker instance
                'status' => $status, // Use the conditionally determined status
                'cuti'   => $isCuti, // Use the determined cuti value
            ]);
        }
    }
}
