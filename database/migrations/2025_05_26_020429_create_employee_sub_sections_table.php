<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_sub_section', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('sub_section_id')->constrained('sub_sections')->onDelete('cascade');
            $table->boolean('dedicated')->default(false); // Added dedicated field
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_sub_section');
    }
};