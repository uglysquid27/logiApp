<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Employee;

class Rating extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'employee_id',
        'rating',
        'comment',
    ];

    public function Employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
