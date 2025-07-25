<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LunchCoupon extends Model
{
    use HasFactory;

    protected $fillable = ['date', 'schedule_id', 'employee_id', 'status'];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
