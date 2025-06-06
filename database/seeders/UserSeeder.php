<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'), // ganti kalau perlu
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'LO User',
            'email' => 'lo@example.com',
            'password' => Hash::make('password'), // ganti juga
            'role' => 'lo',
        ]);
    }
}
