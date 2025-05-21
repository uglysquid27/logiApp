<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'lo']);
            $table->timestamps();
        });

        // Employees
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('nik')->unique();
            $table->string('name');
            $table->enum('type', ['harian', 'bulanan']);
            $table->string('status');
            $table->timestamps();
        });

        // Sections
        Schema::create('sections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        // Sub-sections
        Schema::create('sub_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('sections')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
        });

        // Employee - Sub Section (Pivot Table)
        Schema::create('employee_sub_section', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('sub_section_id')->constrained('sub_sections')->onDelete('cascade');
            $table->timestamps();
        });

        // Schedules
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('date');
            $table->enum('shift', ['I', 'II', 'III', 'off']);
            $table->timestamps();
        });

        // Attendances
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('date');
            $table->enum('status', ['hadir', 'ijin', 'sakit', 'alpha']);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        // Evaluations
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->float('bobot_spv');
            $table->float('bobot_hk');
            $table->float('attitude');
            $table->float('kedisiplinan');
            $table->float('performa');
            $table->float('total_bobot');
            $table->timestamps();
        });

        // Rankings
        Schema::create('rankings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->float('total_bobot');
            $table->unsignedInteger('rank');
            $table->timestamps();
        });

        // Leave Requests (Izin)
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('date');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });

        // Blind Tests
        Schema::create('blind_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->date('test_date');
            $table->enum('result', ['passed', 'failed']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blind_tests');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('rankings');
        Schema::dropIfExists('evaluations');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('employee_sub_section');
        Schema::dropIfExists('sub_sections');
        Schema::dropIfExists('sections');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('users');
    }
};
