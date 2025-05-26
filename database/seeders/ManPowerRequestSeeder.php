<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ManPowerRequest;
use App\Models\SubSection;
use Carbon\Carbon;

class ManPowerRequestSeeder extends Seeder
{
    public function run(): void
    {
        $subSections = SubSection::all();
        $today = Carbon::today();

        foreach (range(1, 20) as $i) {
            $subSection = $subSections->random();
            ManPowerRequest::create([
                'sub_section_id' => $subSection->id,
                'date' => $today->copy()->subDays(rand(0, 19)),
                'requested_amount' => rand(1, 3), // maksimal 3 employee per request
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Berhasil membuat 20 man power requests.');
    }
}
