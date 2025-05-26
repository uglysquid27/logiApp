<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'start_time', 'end_time', 'hours'];

    // If you need a relationship back to ManPowerRequest, define it here
    public function manPowerRequests()
    {
        return $this->hasMany(ManPowerRequest::class);
    }
}