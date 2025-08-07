<?php

namespace Database\Seeders;

use App\Models\Employee;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeSeeder extends Seeder
{
    public function run()
    {
        // Truncate the table first to avoid duplicates
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Employee::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Process the merged CSV file
        $csvFile = fopen(database_path('seeders/data/employees_with_contacts.csv'), 'r');
        
        // Skip header
        fgetcsv($csvFile);
        
        $emailCounters = []; // To handle duplicate emails
        
        while (($row = fgetcsv($csvFile)) !== false) {
            $email = !empty($row[5]) ? trim($row[5]) : null;
            
            // Handle duplicate emails by adding a number suffix
            if ($email) {
                if (isset($emailCounters[$email])) {
                    $emailCounters[$email]++;
                    $email = str_replace('@', "{$emailCounters[$email]}@", $email);
                } else {
                    $emailCounters[$email] = 1;
                }
            } else {
                // Generate a default email if none exists
                $email = Str::slug($row[1]) . '@example.com';
            }
            
            try {
                Employee::create([
                    'nik' => $row[0], // nik
                    'name' => $row[1], // name
                    'email' => $email,
                    'password' => Hash::make('password'), // Default password
                    'type' => $row[2], // type
                    'status' => 'available',
                    'cuti' => 'no',
                    'gender' => $row[3], // gender
                    'group' => !empty($row[4]) ? $row[4] : null, // group
                    'phone' => !empty($row[6]) ? $row[6] : null, // phone
                    'address' => !empty($row[7]) ? $row[7] : null, // address
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $e) {
                // Log any errors (like duplicate emails) and continue
                \Log::error("Failed to create employee {$row[0]}: {$e->getMessage()}");
                continue;
            }
        }
        
        fclose($csvFile);
    }
}