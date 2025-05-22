<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManPowerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'sub_section_id',
        'date',
        'requested_amount',
        'status',
    ];

    public function sub_section()
    {
        return $this->belongsTo(SubSection::class);
    }
    public function subSection()
{
    return $this->belongsTo(SubSection::class);
}

}
