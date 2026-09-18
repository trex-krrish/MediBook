<?php

namespace Tests\Feature\Admin;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DoctorManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_can_add_a_doctor(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/admin/doctors', [
            'name' => 'Dr. Sarah Johnson',
            'specialization' => 'Cardiology',
            'email' => 'sarah@example.com',
            'phone' => '1234567890',
        ]);

        $response->assertCreated()->assertJsonPath('data.name', 'Dr. Sarah Johnson');
        $this->assertDatabaseHas('doctors', ['email' => 'sarah@example.com']);
    }

    public function test_an_admin_can_update_a_doctor(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin)->patchJson("/api/admin/doctors/{$doctor->id}", [
            'is_active' => false,
        ]);

        $response->assertOk()->assertJsonPath('data.is_active', false);
        $this->assertDatabaseHas('doctors', ['id' => $doctor->id, 'is_active' => false]);
    }

    public function test_an_admin_can_view_all_doctors_with_their_availability(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create([
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/admin/doctors');

        $response->assertOk()
            ->assertJsonPath('data.0.availabilities.0.day_of_week', 1);
    }

    public function test_a_patient_cannot_manage_doctors(): void
    {
        $patient = User::factory()->create();

        $response = $this->actingAs($patient)->postJson('/api/admin/doctors', [
            'name' => 'Dr. Sarah Johnson',
            'specialization' => 'Cardiology',
        ]);

        $response->assertForbidden();
    }

    public function test_a_guest_cannot_manage_doctors(): void
    {
        $response = $this->postJson('/api/admin/doctors', [
            'name' => 'Dr. Sarah Johnson',
            'specialization' => 'Cardiology',
        ]);

        $response->assertUnauthorized();
    }
}
