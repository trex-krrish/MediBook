<?php

namespace Tests\Feature\Admin;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DoctorAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_add_an_availability_period_for_a_day(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $response->assertCreated()->assertJsonPath('data.start_time', '09:00');
        $this->assertDatabaseHas('doctor_availabilities', [
            'doctor_id' => $doctor->id,
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '13:00:00',
        ]);
    }

    public function test_an_admin_can_add_multiple_split_periods_for_the_same_day(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();

        $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '13:00',
        ])->assertCreated();

        $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '14:00',
            'end_time' => '17:00',
        ])->assertCreated();

        $this->assertDatabaseCount('doctor_availabilities', 2);
        $this->assertDatabaseHas('doctor_availabilities', ['start_time' => '09:00:00', 'end_time' => '13:00:00']);
        $this->assertDatabaseHas('doctor_availabilities', ['start_time' => '14:00:00', 'end_time' => '17:00:00']);
    }

    public function test_a_new_period_cannot_overlap_an_existing_period_on_the_same_day(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '12:00',
            'end_time' => '15:00',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('start_time');
        $this->assertDatabaseCount('doctor_availabilities', 1);
    }

    public function test_back_to_back_periods_are_allowed(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '13:00',
            'end_time' => '17:00',
        ]);

        $response->assertCreated();
        $this->assertDatabaseCount('doctor_availabilities', 2);
    }

    public function test_the_end_time_must_be_after_the_start_time(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '17:00',
            'end_time' => '09:00',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('end_time');
    }

    public function test_an_admin_can_remove_an_availability_period(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $availability = $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/doctors/{$doctor->id}/availabilities/{$availability->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('doctor_availabilities', ['id' => $availability->id]);
    }

    public function test_a_patient_cannot_manage_a_doctors_availability(): void
    {
        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();

        $this->actingAs($patient)->postJson("/api/admin/doctors/{$doctor->id}/availabilities", [
            'day_of_week' => 1,
            'start_time' => '09:00',
            'end_time' => '17:00',
        ])->assertForbidden();
    }
}
