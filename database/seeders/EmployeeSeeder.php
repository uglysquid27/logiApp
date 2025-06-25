<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $filePath = database_path('seeders/data/employees.csv');
        $csvData = File::get($filePath);
        $lines = explode(PHP_EOL, $csvData);
        
        // Remove header
        array_shift($lines);
        
        foreach ($lines as $line) {
            if (empty($line)) continue;
            
            $data = str_getcsv($line);
            
            // Skip if data doesn't have enough columns
            if (count($data) < 4) continue;
            
            Employee::create([
                'nik' => $data[0],
                'name' => $data[1],
                'type' => $data[2],
                'gender' => $data[3],
                'password' => Hash::make('password123'), // Default password
                'status' => 'available', // Default status
                'cuti' => 'no', // Default cuti status
            ]);
        }
        
        // Add test employees if needed
    }
}