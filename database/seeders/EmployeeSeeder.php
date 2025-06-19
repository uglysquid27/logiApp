<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;

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
                'nik'      => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'name'     => $faker->name(),
                'type'     => $faker->randomElement(['harian', 'bulanan']),
                'status'   => $status,
                'cuti'     => $isCuti,
                'gender'   => $faker->randomElement(['male', 'female']), // Random gender
                'password' => Hash::make('password123'),
            ]);
        }

        // Create specific test employees
        Employee::create([
            'nik'      => '9999999999',
            'name'     => 'Test Male Employee',
            'type'     => 'bulanan',
            'status'   => 'available',
            'cuti'     => 'no',
            'gender'   => 'male',
            'password' => Hash::make('testpassword'),
        ]);

        Employee::create([
            'nik'      => '8888888888',
            'name'     => 'Test Female Employee',
            'type'     => 'harian',
            'status'   => 'available',
            'cuti'     => 'no',
            'gender'   => 'female',
            'password' => Hash::make('testpassword'),
        ]);
    }
}