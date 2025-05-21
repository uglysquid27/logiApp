<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 100; $i++) {
            Employee::create([
                'nik'    => 'EMP' . str_pad($i, 4, '0', STR_PAD_LEFT), // e.g., EMP0001
                'name'   => fake()->name(),
                'type'   => fake()->randomElement(['harian', 'bulanan']),
                'status' => fake()->randomElement(['aktif', 'cuti', 'resign']),
            ]);
        }
    }
}
