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
            Employee::create([
                'nik'    => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT), // e.g., EMP0001
                'name'   => $faker->name(), // Use the $faker instance
                'type' => $faker->randomElement(['harian', 'bulanan']), // Use the $faker instance
                'status' => $faker->randomElement(['aktif', 'cuti', 'resign', 'assigned']), // Use the $faker instance
            ]);
        }
    }
}
