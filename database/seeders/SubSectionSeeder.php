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
        'Leader Finished goods', // Changed from 'Leader FG'
        'Admin Finished goods',  // Changed from 'Admin FG'
        'Penandaan',
        'Putway',
        'Checker SAP',           // Changed from 'SAP'
        // Removed 'Repallet', 'Pembuatan Partisi' as not in data
    ],
    'Delivery' => [
        'Leader Delivery',
        'Dispatcer',             // Note spelling in data
        'Picker',
        'Admin Delivery',
        'Checker SAP',           // Note case
    ],
    'Loader' => [
        'Loader',
        'Bongkar Material/Cap/Juice' // Added
    ],
    'RM/PM' => [
        'Admin RM/PM',
        'Checker',               // Changed from 'Checker RM/PM'
        'Buffer Room',
        'Penimbangan',
        // Removed 'Checker Snack Bar' as not in data
        'Bongkar Material/Cap/Juice'
    ],
    'Operator Forklift' => [
        'Operator Forklift',
        'Dispatcer'             // Added as it appears in data
    ],
    'Inspeksi' => [
        'Leader Inspeksi',
        'Admin Inspeksi',
        'Camera Offline',
        'Meja',
        'Shrink',
        'Cluster',
        'Stickering',
        'Rework',
        'Repallet',             // Added
        'Pembuatan Partisi',    // Added
        'Cleaning Pallet',      // Added
        'Leader Meja',
        // Removed several not in data
    ],
    'Reject' => [
        'Reject'
    ]
    // Removed 'Store' section as not in data
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