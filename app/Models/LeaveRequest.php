<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeaveRequest extends Model
{
    protected $fillable = ['employee_id', 'date', 'reason', 'status'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
