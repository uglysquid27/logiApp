<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Carbon\Carbon;

class Employee extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'password',
        'nik',
        'type',
        'status',
        'cuti',
        'gender',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    public function subSections(): BelongsToMany
    {
        return $this->belongsToMany(SubSection::class, 'employee_sub_section', 'employee_id', 'sub_section_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'employee_id');
    }

    public function permits()
    {
        return $this->hasMany(Permit::class);
    }

    /**
     * Check if the employee is assigned to any schedule today.
     */
    public function isAssignedToday(): bool
    {
        return $this->schedules()
            ->whereDate('date', Carbon::today())
            ->exists();
    }
}