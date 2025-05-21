<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubSection extends Model
{
    protected $fillable = ['section_id', 'name'];

    public function section()
    {
        return $this->belongsTo(Section::class);
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_sub_section');
    }
    public function manPowerRequests()
    {
        return $this->hasMany(ManPowerRequest::class);
    }

}
