<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManPowerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'sub_section_id',
        'shift_id',
        'date',
        'start_time',
        'end_time',
        'requested_amount',
        'male_count',
        'female_count',
        'status',
        'fulfilled_by'
    ];

    // Add this relationship
    public function fulfilledBy()
    {
        return $this->belongsTo(User::class, 'fulfilled_by');
    }

    // Existing relationships...
    public function subSection()
    {
        return $this->belongsTo(SubSection::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}