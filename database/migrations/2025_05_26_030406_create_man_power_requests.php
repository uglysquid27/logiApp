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
            $table->foreignId('sub_section_id')->constrained()->onDelete('cascade');
            // FIX: Ensure shift_id is correctly defined here as a non-nullable foreign key
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->date('date');
            $table->unsignedInteger('requested_amount');
            $table->enum('status', ['pending', 'fulfilled'])->default('pending');
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
