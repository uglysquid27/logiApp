<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin user (original)
        User::create([
            'name' => 'Admin',
            'email' => 'admin@internal',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // New Admin users for Arina
        User::create([
            'name' => 'Hadi',
            'email' => 'hadi@internal',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Lukman',
            'email' => 'lukman@internal',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Redia',
            'email' => 'redia@internal',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Subchan',
            'email' => 'subchan@internal',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // New Regular user for Arina
        User::create([
            'name' => 'Otsuka1',
            'email' => 'user1@otsuka',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
    }
}

