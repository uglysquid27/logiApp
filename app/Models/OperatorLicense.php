<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperatorLicense extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'license_number',
        'expiry_date',
        'image_path',
    ];

    protected $dates = [
        'expiry_date',
        'verified_at'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // Helper methods
    public function isValid()
    {
        return $this->expiry_date && $this->expiry_date->isFuture();
    }

    public function isExpired()
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }
}