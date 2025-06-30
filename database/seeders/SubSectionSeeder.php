<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\SubSection;
use Illuminate\Database\Seeder;

class SubSectionSeeder extends Seeder
{
    public function run(): void
    {
        // Get all sections first
        $sections = Section::all();

        // Sub-sections data based on Excel file
        $subSectionsData = [
            'Finished goods' => [
                'Leader',
                'Admin',
                'Penandaan',
                'Putway',
                'SAP'
            ],
            'Delivery' => [
                'Leader',
                'Dispatcer',
                'Picker',
                'Admin'
            ],
            'Loader' => [
                'Loader' // All loader employees have "Loader" as both section and sub-section
            ],
            'RM/PM' => [
                'Admin',
                'Checker',
                'Buffer Room',
                'Penimbangan'
            ],
            'Operator Forklift' => [
                'Operator Forklift' // All have same sub-section as section
            ],
            'Inspeksi' => [
                'Leader',
                'Checker',
                'Admin',
                'Inspektor',
                'Resealer',
                'Reject'
            ]
        ];

        foreach ($sections as $section) {
            if (isset($subSectionsData[$section->name])) {
                foreach ($subSectionsData[$section->name] as $subSectionName) {
                    SubSection::create([
                        'section_id' => $section->id,
                        'name' => $subSectionName
                    ]);
                }
            }
        }
    }
}