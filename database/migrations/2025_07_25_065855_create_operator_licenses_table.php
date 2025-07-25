<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('operator_licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('license_number')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            
            $table->index('employee_id');
            $table->index('expiry_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('operator_licenses');
    }
};