<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = [
        'employee_id', 'month', 'year', 'bobot_spv', 'bobot_hk',
        'attitude', 'kedisiplinan', 'performa', 'total_bobot'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
