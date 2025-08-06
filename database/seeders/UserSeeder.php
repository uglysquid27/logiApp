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
            'email' => 'admin@arina.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // New Admin users for Arina
        User::create([
            'name' => 'Hadi',
            'email' => 'hadi@arina.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Lukman',
            'email' => 'lukman@arina.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Redia',
            'email' => 'redia@arina.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Subchan',
            'email' => 'subchan@arina.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // New Regular user for Arina
        User::create([
            'name' => 'Otsuka1',
            'email' => 'user1@otsuka.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);
    }
}

