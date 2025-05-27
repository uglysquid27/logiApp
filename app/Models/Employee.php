<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'nik',
        'name',
        'type',
        'status',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'schedules_count', // Added back to ensure explicit serialization
        'calculated_rating',
        'working_day_weight',
        // 'total_assigned_hours', // Uncomment if you want this explicitly appended and displayed
    ];

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = []; // Or any existing 'with' relationships

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function subSections()
    {
        return $this->belongsToMany(SubSection::class, 'employee_sub_section');
    }

    /**
     * Get the calculated rating for the employee.
     * This accessor ensures the 'calculated_rating' attribute is available for serialization.
     * The actual value is set in the controller's map method.
     *
     * @return int|null
     */
    public function getCalculatedRatingAttribute()
    {
        return $this->attributes['calculated_rating'] ?? null;
    }

    /**
     * Get the working day weight for the employee.
     * This accessor ensures the 'working_day_weight' attribute is available for serialization.
     * The actual value is set in the controller's map method.
     *
     * @return float|null
     */
    public function getWorkingDayWeightAttribute()
    {
        return $this->attributes['working_day_weight'] ?? null;
    }

    /**
     * Get the total assigned hours for the employee.
     * This accessor ensures the 'total_assigned_hours' attribute is available for serialization.
     * The actual value is set in the controller's map method.
     *
     * @return int|null
     */
    public function getTotalAssignedHoursAttribute()
    {
        return $this->attributes['total_assigned_hours'] ?? null;
    }

    /**
     * Get the schedules count for the employee.
     * This accessor ensures the 'schedules_count' attribute is available for serialization.
     * The actual value is set by the withCount() method in the controller.
     *
     * @return int
     */
    public function getSchedulesCountAttribute()
    {
        // withCount adds this directly to attributes, so we can retrieve it.
        // Default to 0 if not set (e.g., if withCount wasn't used in a specific query).
        return $this->attributes['schedules_count'] ?? 0;
    }
}
