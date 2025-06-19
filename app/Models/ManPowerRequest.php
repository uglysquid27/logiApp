<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManPowerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'sub_section_id',
        'date',
        'shift_id', // Ensure this is in fillable
        'start_time', // New field
        'end_time',   // New field
        'requested_amount',
        'male_count',
        'female_count',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function subSection()
    {
        return $this->belongsTo(SubSection::class);
    }

    public function shift() // Relationship to Shift is maintained
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * Get the schedules associated with the man power request.
     */
    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
