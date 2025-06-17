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
        Schema::create('permits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade'); // Kunci asing ke tabel employees
            $table->enum('permit_type', ['sakit', 'cuti', 'izin_khusus', 'lainnya']); // Tipe izin menggunakan ENUM
            $table->date('start_date');    // Tanggal mulai izin
            $table->date('end_date')->nullable(); // Tanggal selesai izin (nullable jika izin satu hari)
            $table->text('reason');        // Alasan pengajuan izin
            $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending'); // Status izin menggunakan ENUM
            $table->timestamps();          // Kolom created_at dan updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permits');
    }
};
