<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // Import BelongsToMany
use Illuminate\Foundation\Auth\User as Authenticatable; // <<< PASTIKAN INI ADA
use Illuminate\Notifications\Notifiable;


// use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        // 'email', // <<< DIHAPUS - JIKA KARYAWAN LOGIN HANYA DENGAN NIK
        'password',
        'nik',
        'type',
        'status',
        'cuti',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        // 'email_verified_at' => 'datetime', // <<< DIHAPUS - JIKA KARYAWAN TIDAK MEMILIKI VERIFIKASI EMAIL
        'password' => 'hashed',
    ];

    /**
     * Get the sub sections that the employee belongs to (Many-to-Many).
     */
    public function subSections(): BelongsToMany
    {
        // Pastikan 'employee_sub_section' adalah nama tabel pivot Anda
        // dan 'employee_id', 'sub_section_id' adalah nama kolom di tabel pivot.
        return $this->belongsToMany(SubSection::class, 'employee_sub_section', 'employee_id', 'sub_section_id');
    }

    /**
     * Get the schedules for the employee.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'employee_id');
    }

    // Anda bisa menambahkan relasi atau metode lain di sini
}
