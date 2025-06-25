<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $sections = [
            'Finished goods',
            'Delivery',
            'Loader',
            'RM/PM',
            'Operator Forklift',
            'Inspeksi'
        ];

        foreach ($sections as $sectionName) {
            Section::create(['name' => $sectionName]);
        }
    }
}