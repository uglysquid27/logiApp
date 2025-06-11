<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
       Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            // Ensure 'employees' table is created BEFORE this migration
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            // Ensure 'sub_sections' table is created BEFORE this migration
            $table->foreignId('sub_section_id')->constrained('sub_sections')->onDelete('cascade');
            // Ensure 'man_power_requests' table is created BEFORE this migration
            $table->foreignId('man_power_request_id')->constrained('man_power_requests')->onDelete('cascade');
            $table->date('date');
            $table->enum('status', ['pending','accepted','rejected'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
