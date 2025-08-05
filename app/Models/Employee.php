<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
          'deactivation_reason',
    'deactivated_at',
        'cuti',
        'gender',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
          'deactivated_at' => 'datetime'
    ];
    
    public function scopeActive($query)
    {
        return $query->whereNull('deactivated_at');
    }

    // In App\Models\Employee
public function blindTests()
{
    return $this->hasMany(BlindTest::class);
}
    
    public function scopeInactive($query)
    {
        return $query->whereNotNull('deactivated_at');
    }

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

    // In your Employee model
public function operatorLicense()
{
    return $this->hasOne(OperatorLicense::class);
}

public function hasValidLicense()
{
    return $this->operatorLicense && $this->operatorLicense->isValid();
}

 /**
     * Get the ratings for the employee.
     * ADD THIS NEW METHOD
     */
    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function workload()
    {
        return $this->hasMany(Workload::class);
    }
}