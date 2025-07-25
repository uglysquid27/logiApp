<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('lunch_coupons', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending'); // pending, claimed
            $table->timestamps();
            
            $table->unique(['date', 'schedule_id']); // Prevent duplicates
        });
    }

    public function down()
    {
        Schema::dropIfExists('lunch_coupons');
    }
};