<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('nik')->unique();
            $table->string('name');
            $table->string('password');
            $table->enum('type', ['harian', 'bulanan']);
            $table->enum('status', ['available', 'assigned', 'on leave', 'deactivated'])->default('available');
            $table->enum('cuti', ['yes', 'no'])->default('no');
            $table->enum('gender', ['male', 'female']);
            $table->string('deactivation_reason')->nullable();
            $table->text('deactivation_notes')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->foreignId('deactivated_by')->nullable()->constrained('users');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};