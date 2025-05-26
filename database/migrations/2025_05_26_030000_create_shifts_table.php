<?php

// database/migrations/YYYY_MM_DD_create_shifts_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'Pagi', 'Siang', 'Malam'
            $table->time('start_time');       // e.g., '08:00:00'
            $table->time('end_time');         // e.g., '16:00:00'
            $table->integer('hours');         // Number of hours for payroll, e.g., 8
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};