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
        'shift_id', // Ensure this is in fillable if you're mass assigning
        'requested_amount',
        'status',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function subSection()
    {
        return $this->belongsTo(SubSection::class);
    }

    public function shift() // Relationship to Shift
    {
        return $this->belongsTo(Shift::class);
    }

    /**
     * Get the schedules associated with the man power request.
     */
    public function schedules() // <-- ADDED THIS RELATIONSHIP
    {
        return $this->hasMany(Schedule::class);
    }
}
