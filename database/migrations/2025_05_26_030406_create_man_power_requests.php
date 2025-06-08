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
            // Re-added shift_id as per your requirement
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->date('date');
            // Added start_time and end_time
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('requested_amount');
            $table->enum('status', ['pending', 'fulfilled', 'rejected'])->default('pending'); // Added 'rejected' for completeness
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
