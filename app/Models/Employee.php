<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany; // Import BelongsToMany
// use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory;
    // use SoftDeletes;

    protected $fillable = [
        'name',
        'email',
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
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Get the sub sections that the employee belongs to (Many-to-Many).
     */
    public function subSections(): BelongsToMany // <--- PERUBAHAN DI SINI: Plural dan BelongsToMany
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

    // ...
}
