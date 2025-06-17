<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Permit extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'permit_type', // Ini akan menjadi string di PHP
        'start_date',
        'end_date',
        'reason',
        'status', // Ini akan menjadi string di PHP
    ];


    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}