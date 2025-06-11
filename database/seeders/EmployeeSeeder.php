<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash; // Don't forget to import Hash facade

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 100; $i++) {
            $isCuti = $faker->randomElement(['yes', 'no']);
            $status = 'available';

            if ($isCuti === 'no') {
                $status = $faker->randomElement(['available', 'assigned']);
            }

            Employee::create([
                'nik'    => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT), // e.g., EMP0001
                'name'   => $faker->name(),
                'type'   => $faker->randomElement(['harian', 'bulanan']),
                'status' => $status,
                'cuti'   => $isCuti,
                'password' => Hash::make('password123'), // ADDED: A default hashed password for all employees
            ]);
        }

        // OPTIONAL: Create one specific employee for easy testing
        // This makes it easy to remember a specific NIK and password for login
        Employee::create([
            'nik' => '9999999999', // A distinct NIK for testing
            'name' => 'Test Employee',
            'type' => 'bulanan',
            'status' => 'available',
            'cuti' => 'no',
            'password' => Hash::make('testpassword'), // A simple password for testing
        ]);
    }
}
