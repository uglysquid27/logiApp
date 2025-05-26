<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Shift;

class ManPowerRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'sub_section_id',
        'date',
        'requested_amount',
        'status',
        'shift_id',
    ];

    public function sub_section()
    {
        return $this->belongsTo(SubSection::class);
    }
    public function subSection()
{
    return $this->belongsTo(SubSection::class);
}

    /**
     * Get the shift associated with the manpower request.
     */
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
