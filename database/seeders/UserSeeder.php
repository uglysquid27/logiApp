<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        // LO User
        User::create([
            'name' => 'LO User',
            'email' => 'lo@example.com',
            'password' => Hash::make('password'),
            'role' => 'lo',
        ]);

        // SPV 1 (with admin role)
        User::create([
            'name' => 'SPV 1',
            'email' => 'spv1@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin', // SPV has admin role as requested
        ]);

        // SPV 2 (with admin role)
        User::create([
            'name' => 'SPV 2',
            'email' => 'spv2@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin', // SPV has admin role as requested
        ]);

        // Regular user
        User::create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role' => 'user', // Regular user has user role
        ]);
    }
}