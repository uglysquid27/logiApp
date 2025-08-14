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
            
            // Parse the address components
            $address = !empty($row[7]) ? trim($row[7]) : null;
            // $parsedAddress = $this->parseIndonesianAddress($address);
            
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
                    'address' => $address, // original full address
                    
                    // Parsed address components
                    // 'street' => $parsedAddress['street'],
                    // 'rt' => $parsedAddress['rt'],
                    // 'rw' => $parsedAddress['rw'],
                    // 'kelurahan' => $parsedAddress['kelurahan'],
                    // 'kecamatan' => $parsedAddress['kecamatan'],
                    // 'kabupaten_kota' => $parsedAddress['kabupaten_kota'],
                    // 'provinsi' => 'Jawa Timur', // Default as most addresses are in East Java
                    // 'kode_pos' => $parsedAddress['kode_pos'],
                    
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

    /**
     * Parse Indonesian address into components
     */
    // protected function parseIndonesianAddress($address)
    // {
    //     if (empty($address)) {
    //         return [
    //             'street' => null,
    //             'rt' => null,
    //             'rw' => null,
    //             'kelurahan' => null,
    //             'kecamatan' => null,
    //             'kabupaten_kota' => null,
    //             'kode_pos' => null,
    //         ];
    //     }

    //     // Initialize components
    //     $components = [
    //         'street' => null,
    //         'rt' => null,
    //         'rw' => null,
    //         'kelurahan' => null,
    //         'kecamatan' => null,
    //         'kabupaten_kota' => null,
    //         'kode_pos' => null,
    //     ];

    //     // Extract postal code (5 digits at the end)
    //     if (preg_match('/(\d{5})/', $address, $matches)) {
    //         $components['kode_pos'] = $matches[1];
    //         $address = str_replace($matches[1], '', $address);
    //     }

    //     // Common patterns to look for
    //     $patterns = [
    //         'rt' => '/Rt\.?\s*(\d+)/i',
    //         'rw' => '/Rw\.?\s*(\d+)/i',
    //         'kelurahan' => '/Kel\.?\s*([^,\.]+)/i',
    //         'kecamatan' => '/Kec\.?\s*([^,\.]+)/i',
    //         'kabupaten' => '/Kab\.?\s*([^,\.]+)/i',
    //         'kota' => '/Kota\s*([^,\.]+)/i',
    //     ];

    //     // Extract components using patterns
    //     foreach ($patterns as $key => $pattern) {
    //         if (preg_match($pattern, $address, $matches)) {
    //             $components[$key] = trim($matches[1]);
    //             $address = str_replace($matches[0], '', $address);
    //         }
    //     }

    //     // Handle Kabupaten/Kota
    //     if (!empty($components['kabupaten'])) {
    //         $components['kabupaten_kota'] = $components['kabupaten'];
    //     } elseif (!empty($components['kota'])) {
    //         $components['kabupaten_kota'] = $components['kota'];
    //     }
    //     unset($components['kabupaten'], $components['kota']);

    //     // The remaining part is likely the street/dusun
    //     $components['street'] = trim(preg_replace('/\s+/', ' ', $address));

    //     // Clean up extracted values
    //     foreach ($components as &$value) {
    //         if ($value) {
    //             $value = trim($value, " \t\n\r\0\x0B,");
    //         }
    //     }

    //     return $components;
    // }
}