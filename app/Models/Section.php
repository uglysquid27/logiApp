<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    protected $fillable = ['name'];

    public function subSections()
    {
        return $this->hasMany(SubSection::class);
    }
}
