<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\SubSection;
use Illuminate\Database\Seeder;

class EmployeeSubSectionSeeder extends Seeder
{
    public function run(): void
    {
        $employees = Employee::all();
        $subSections = SubSection::all();

        foreach ($employees as $employee) {
            // Assign 1 or 2 random subsections per employee
            $randomSubSections = $subSections->random(rand(1, 2));

            // Jika cuma satu, random() tetap return collection jika param > 1, 
            // tapi kalau param = 1 dia return model, jadi handle itu
            if ($randomSubSections instanceof SubSection) {
                $randomSubSections = collect([$randomSubSections]);
            }

            foreach ($randomSubSections as $subSection) {
                $employee->subSections()->attach($subSection->id);
            }
        }
    }
}
