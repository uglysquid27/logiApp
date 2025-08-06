<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'password',
        'nik',
        'type',
        'status',
        'deactivation_reason',
        'deactivation_notes',
        'deactivated_at',
        'deactivated_by',
        'cuti',
        'gender',
        'group',
        'birth_date',
        'birth_place',
        'address',
        'city',
        'religion',
        'phone',
        'marital_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'deactivated_at' => 'datetime',
        'birth_date' => 'date',
    ];
    
    public function scopeActive($query)
    {
        return $query->whereNull('deactivated_at');
    }

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

    public function isAssignedToday(): bool
    {
        return $this->schedules()
            ->whereDate('date', Carbon::today())
            ->exists();
    }

    public function operatorLicense()
    {
        return $this->hasOne(OperatorLicense::class);
    }

    public function hasValidLicense()
    {
        return $this->operatorLicense && $this->operatorLicense->isValid();
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }

    public function workloads()
    {
        return $this->hasMany(Workload::class);
    }
    public function workload()
    {
        return $this->hasMany(Workload::class);
    }

    public function deactivatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deactivated_by');
    }
}