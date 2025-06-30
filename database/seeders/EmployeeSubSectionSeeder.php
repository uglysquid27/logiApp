<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\SubSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class EmployeeSubSectionSeeder extends Seeder
{
    public function run(): void
    {
        // Get the path to the CSV file
        $filePath = database_path('seeders/data/employee_sub_sections.csv');
        
        if (!File::exists($filePath)) {
            Log::error("CSV file not found: {$filePath}");
            return;
        }

        // Read the CSV file
        $csvData = File::get($filePath);
        $lines = explode(PHP_EOL, $csvData);
        
        // Remove header
        array_shift($lines);
        
        // Get all subsections with their section relationship
        $subSections = SubSection::with('section')->get();
        
        $processed = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            
            $data = str_getcsv($line);
            
            if (count($data) < 3) {
                $skipped++;
                Log::warning("Invalid line format: {$line}");
                continue;
            }

            $nik = trim($data[0]);
            $sectionName = trim($data[1]);
            $subSectionName = trim($data[2]);
            
            $employee = Employee::where('nik', $nik)->first();
            
            if (!$employee) {
                $skipped++;
                Log::warning("Employee not found with NIK: {$nik}");
                continue;
            }

            // Find the matching subsection
            $subSection = $subSections->first(function($subSection) use ($sectionName, $subSectionName) {
                return $subSection->name === $subSectionName && 
                       $subSection->section->name === $sectionName;
            });
            
            if (!$subSection) {
                $skipped++;
                Log::warning("SubSection not found: {$sectionName} - {$subSectionName}");
                continue;
            }

            try {
                // Check if relationship already exists
                if (!$employee->subSections()->where('sub_section_id', $subSection->id)->exists()) {
                    $employee->subSections()->attach($subSection->id);
                    $processed++;
                    Log::info("Attached subsection {$subSection->id} to employee {$nik}");
                } else {
                    Log::info("Relationship already exists for employee {$nik} and subsection {$subSection->id}");
                }
            } catch (\Exception $e) {
                $errors++;
                Log::error("Error attaching subsection to employee: " . $e->getMessage());
            }
        }

        $this->command->info("Employee SubSection seeding completed. Processed: {$processed}, Skipped: {$skipped}, Errors: {$errors}");
    }
}