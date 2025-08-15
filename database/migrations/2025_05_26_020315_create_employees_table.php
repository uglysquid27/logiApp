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
            $table->string('ktp')->unique()->nullable();
            $table->string('name');
            $table->string('photo')->nullable();
            $table->string('email')->unique()->nullable();
            $table->string('password');
            $table->enum('marital', ['single', 'married', 'divorced', 'widowed'])->default('single')->nullable();
            $table->enum('type', ['harian', 'bulanan']);
            $table->enum('status', ['available', 'assigned', 'on leave', 'deactivated'])->default('available');
            $table->enum('cuti', ['yes', 'no'])->default('no');
            $table->enum('gender', ['male', 'female']);
            $table->string('group')->nullable();
            
            // Personal data fields
            $table->date('birth_date')->nullable();
            $table->string('religion')->nullable();
            $table->string('phone')->nullable();
            
            // Address components
            $table->string('street')->nullable(); // Jalan/Dusun
            $table->string('rt')->nullable();
            $table->string('rw')->nullable();
            $table->string('kelurahan')->nullable();
            $table->string('kecamatan')->nullable();
            $table->string('kabupaten_kota')->nullable();
            $table->string('provinsi')->nullable()->default('Jawa Timur');
            $table->string('kode_pos')->nullable();
            
            // Full address for reference (original)
            $table->text('address')->nullable();
            
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