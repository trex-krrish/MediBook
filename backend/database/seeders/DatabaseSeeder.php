<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
        ]);

        User::factory()->create([
            'name' => 'Test Patient',
            'email' => 'patient@example.com',
        ]);

        $doctors = [
            ['name' => 'Dr. Sarah Johnson', 'specialization' => 'Cardiology'],
            ['name' => 'Dr. Michael Lee', 'specialization' => 'Dermatology'],
            ['name' => 'Dr. Emily Davis', 'specialization' => 'Pediatrics'],
        ];

        foreach ($doctors as $doctorAttributes) {
            $doctor = Doctor::factory()->create($doctorAttributes);

            foreach (range(1, 5) as $dayOfWeek) {
                $doctor->availabilities()->create([
                    'day_of_week' => $dayOfWeek,
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                ]);
            }
        }
    }
}
