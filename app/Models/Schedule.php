<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = ['employee_id', 'sub_section_id', 'date', 'man_power_request_id'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function subSection()
    {
        return $this->belongsTo(SubSection::class);
    }

    public function request()
    {
        return $this->belongsTo(ManPowerRequest::class, 'man_power_request_id');
    }
}
