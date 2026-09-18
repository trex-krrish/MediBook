<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('doctor_availabilities', function (Blueprint $table) {
            $table->index(['doctor_id', 'day_of_week'], 'doctor_availabilities_doctor_id_day_of_week_index');
        });

        Schema::table('doctor_availabilities', function (Blueprint $table) {
            $table->dropUnique(['doctor_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_availabilities', function (Blueprint $table) {
            $table->unique(['doctor_id', 'day_of_week']);
        });

        Schema::table('doctor_availabilities', function (Blueprint $table) {
            $table->dropIndex('doctor_availabilities_doctor_id_day_of_week_index');
        });
    }
};
