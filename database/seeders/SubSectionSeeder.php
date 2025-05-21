<?php

namespace Database\Seeders;

use App\Models\Section;
use App\Models\SubSection;
use Illuminate\Database\Seeder;

class SubSectionSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil semua section dulu
        $sections = Section::all();

        // Contoh sub-sections per section
        $subSectionsData = [
            'Produksi' => ['Line 1', 'Line 2', 'Line 3'],
            'Quality Control' => ['QC A', 'QC B'],
            'Logistik' => ['Gudang 1', 'Gudang 2'],
            'HRD' => ['Recruitment', 'Payroll'],
            'Maintenance' => ['Elektrikal', 'Mekanik']
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
