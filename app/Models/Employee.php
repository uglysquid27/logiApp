<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = ['nik', 'name', 'type', 'status'];

    public function subSections()
    {
        return $this->belongsToMany(SubSection::class, 'employee_sub_section');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function rankings()
    {
        return $this->hasMany(Ranking::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function blindTests()
    {
        return $this->hasMany(BlindTest::class);
    }
}
