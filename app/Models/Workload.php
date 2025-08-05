<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workload extends Model
{
    use HasFactory;

    // Specify table name if it's not the plural form of the model name
    protected $table = 'workload';

    // Define which attributes can be mass-assigned
    protected $fillable = [
        'employee_id',
        'week',
        'total_work_count',
        'workload_point',
    ];

    /**
     * Get the employee that owns the workload.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
