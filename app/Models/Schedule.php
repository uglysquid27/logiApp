<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = ['employee_id', 'date', 'shift'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
    public function request()
    {
        return $this->belongsTo(ManPowerRequest::class);
    }

}
