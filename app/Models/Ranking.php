<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ranking extends Model
{
    protected $fillable = ['employee_id', 'month', 'year', 'total_bobot', 'rank'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
