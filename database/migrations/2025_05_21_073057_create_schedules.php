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
       // Schedules
       Schema::create('schedules', function (Blueprint $table) {
        $table->id();
        $table->foreignId('employee_id')->constrained()->onDelete('cascade');
        $table->foreignId('sub_section_id')->constrained()->onDelete('cascade');
        $table->date('date');
        $table->foreignId('man_power_request_id')->constrained()->onDelete('cascade');
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
