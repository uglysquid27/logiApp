<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\Workload;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class WorkloadSeeder extends Seeder
{
    public function run(): void
    {
        // Get the CSV file path
        $filePath = database_path('seeders/data/employees.csv');
        $csvData = File::get($filePath);
        $lines = explode(PHP_EOL, $csvData);
        
        // Remove header
        array_shift($lines);
        
        foreach ($lines as $line) {
            if (empty($line)) continue;
            
            $data = str_getcsv($line);
            
            // Skip if data doesn't have enough columns or NIK is empty
            if (count($data) < 1 || empty($data[0])) continue;
            
            // Find employee by NIK to get their auto-incremented ID
            $employee = Employee::where('nik', $data[0])->first();
            
            if ($employee) {
                // Create simplified workload record
                Workload::create([
                    'employee_id' => $employee->id, // Auto-incremented ID
                    'nik' => $data[0],             // NIK from CSV
                    'week' => null,                // Set to null
                    'total_work_count' => null,    // Set to null
                    'workload_point' => 165,       // Fixed value
                ]);
            }
        }
    }
}