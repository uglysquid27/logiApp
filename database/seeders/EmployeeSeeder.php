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

        // Process the CSV file
        $csvFile = fopen(database_path('seeders/data/employees_with_ktp.csv'), 'r');
        
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
            
            // Parse the address components
            $address = !empty($row[7]) ? trim($row[7]) : null;
            
            // Format KTP number (remove .0 if present)
            $ktp = !empty($row[8]) ? rtrim($row[8], '.0') : null;
            
            try {
                Employee::create([
                    'nik' => $row[0], // nik from CSV
                    'ktp' => $ktp, // ktp from CSV (column 9)
                    'name' => $row[1], // name
                    'email' => $email,
                    'password' => Hash::make('password'), // Default password
                    'type' => $row[2], // type
                    'status' => 'available',
                    'cuti' => 'no',
                    'gender' => $row[3], // gender
                    'group' => !empty($row[4]) ? $row[4] : null, // group
                    'phone' => !empty($row[6]) ? rtrim($row[6], '.0') : null, // phone (remove .0 if present)
                    'address' => $address, // original full address
                    
                    // Set default values for other fields
                    'marital' => null,
                    'birth_date' => null,
                    'religion' => null,
                    'street' => null,
                    'rt' => null,
                    'rw' => null,
                    'kelurahan' => null,
                    'kecamatan' => null,
                    'kabupaten_kota' => null,
                    'provinsi' => null,
                    'kode_pos' => null,
                    'deactivation_reason' => null,
                    'deactivation_notes' => null,
                    'deactivated_at' => null,
                    'deactivated_by' => null,
                    
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