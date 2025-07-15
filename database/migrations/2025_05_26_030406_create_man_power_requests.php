<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('man_power_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sub_section_id')->constrained('sub_sections')->onDelete('cascade');
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time')->nullable(); // Made nullable
            $table->time('end_time')->nullable(); // Made nullable
            $table->unsignedInteger('requested_amount');
            $table->unsignedInteger('male_count')->default(0);
            $table->unsignedInteger('female_count')->default(0);
            $table->enum('status', ['pending', 'fulfilled', 'rejected', 'revision_requested'])->default('pending'); // Added revision_requested
            $table->foreignId('fulfilled_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('reason')->nullable(); // Added for additional request reason
            $table->boolean('is_additional')->default(false); // Added to mark additional requests
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('man_power_requests');
    }
};