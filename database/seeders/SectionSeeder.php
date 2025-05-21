<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = ['Produksi', 'Quality Control', 'Logistik', 'HRD', 'Maintenance'];

        foreach ($sections as $sectionName) {
            Section::create(['name' => $sectionName]);
        }
    }
}
