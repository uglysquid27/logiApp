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
        Schema::create('man_power_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_section_id')->constrained('sub_sections')->onDelete('cascade');
            // REMOVED: $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time'); // NEW: Start time for the requested slot
            $table->time('end_time');   // NEW: End time for the requested slot
            $table->unsignedInteger('requested_amount');
            $table->enum('status', ['pending', 'fulfilled', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('man_power_requests');
    }
};
