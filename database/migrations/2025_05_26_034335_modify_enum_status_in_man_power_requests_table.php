<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Added for raw SQL

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // This raw SQL is MySQL-specific.
        // It will fail on databases like SQLite that don't support MODIFY COLUMN for ENUMs this way.
        DB::statement("ALTER TABLE man_power_requests MODIFY COLUMN status ENUM('pending', 'fulfilled', 'terpenuhi') NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This raw SQL is MySQL-specific.
        // Before running this, any 'terpenuhi' values should ideally be migrated to 'pending' or 'fulfilled'.
        // For example: DB::table('man_power_requests')->where('status', 'terpenuhi')->update(['status' => 'fulfilled']);
        DB::statement("ALTER TABLE man_power_requests MODIFY COLUMN status ENUM('pending', 'fulfilled') NOT NULL DEFAULT 'pending'");
    }
};
