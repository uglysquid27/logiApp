<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\SubSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class EmployeeSubSectionSeeder extends Seeder
{
    public function run(): void
    {
        // Get the path to the CSV file
        $filePath = database_path('seeders/data/employee_sub_sections.csv');
        
        // Read the CSV file
        $csvData = File::get($filePath);
        $lines = explode(PHP_EOL, $csvData);
        
        // Remove header
        array_shift($lines);
        
        // Get all subsections with their section relationship
        $subSections = SubSection::with('section')->get();
        
        foreach ($lines as $line) {
            if (empty($line)) continue;
            
            $data = str_getcsv($line);
            
            $nik = $data[0];
            $sectionName = $data[1];
            $subSectionName = $data[2];
            
            $employee = Employee::where('nik', $nik)->first();
            
            if ($employee) {
                // Find the matching subsection
                $subSection = $subSections->first(function($subSection) use ($sectionName, $subSectionName) {
                    return $subSection->name === $subSectionName && 
                           $subSection->section->name === $sectionName;
                });
                
                if ($subSection) {
                    $employee->subSections()->sync([$subSection->id]);
                }
            }
        }
    }
}