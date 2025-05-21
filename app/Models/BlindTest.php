<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlindTest extends Model
{
    protected $fillable = ['employee_id', 'test_date', 'result'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
