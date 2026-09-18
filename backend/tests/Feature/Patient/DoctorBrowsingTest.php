<?php

namespace Tests\Feature\Patient;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DoctorBrowsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_only_sees_active_doctors(): void
    {
        $patient = User::factory()->create();
        Doctor::factory()->create(['name' => 'Active Doc', 'is_active' => true]);
        Doctor::factory()->create(['name' => 'Inactive Doc', 'is_active' => false]);

        $response = $this->actingAs($patient)->getJson('/api/doctors');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Active Doc');
    }

    public function test_a_patient_only_sees_slots_within_the_doctors_availability_window(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create([
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $response->assertOk()->assertJsonCount(2, 'slots')
            ->assertJsonPath('slots.0.start_time', '09:00')
            ->assertJsonPath('slots.1.start_time', '09:30');
    }

    public function test_a_booked_slot_is_excluded_from_the_available_slots(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create([
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);
        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $response->assertOk()->assertJsonCount(1, 'slots')
            ->assertJsonPath('slots.0.start_time', '09:30');
    }

    public function test_a_day_with_no_availability_returns_no_slots(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $response->assertOk()->assertJsonCount(0, 'slots');
    }

    public function test_slots_are_combined_across_multiple_split_periods_on_the_same_day(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '10:00:00']);
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '14:00:00', 'end_time' => '15:00:00']);

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $response->assertOk()->assertJsonCount(4, 'slots')
            ->assertJsonPath('slots.0.start_time', '09:00')
            ->assertJsonPath('slots.1.start_time', '09:30')
            ->assertJsonPath('slots.2.start_time', '14:00')
            ->assertJsonPath('slots.3.start_time', '14:30');
    }

    public function test_the_gap_between_split_periods_is_not_offered_as_a_slot(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '14:00:00', 'end_time' => '17:00:00']);

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $slots = collect($response->json('slots'))->pluck('start_time');

        $this->assertFalse($slots->contains('13:00'));
        $this->assertFalse($slots->contains('13:30'));
        $this->assertTrue($slots->contains('12:30'));
        $this->assertTrue($slots->contains('14:00'));
    }

    public function test_a_break_removes_the_slots_it_overlaps(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);
        $doctor->breaks()->create(['date' => '2026-09-21', 'start_time' => '10:30:00', 'end_time' => '11:30:00']);

        $response = $this->actingAs($patient)->getJson("/api/doctors/{$doctor->id}/slots?date=2026-09-21");

        $slots = collect($response->json('slots'))->pluck('start_time');

        $this->assertFalse($slots->contains('10:30'));
        $this->assertFalse($slots->contains('11:00'));
        $this->assertTrue($slots->contains('10:00'));
        $this->assertTrue($slots->contains('11:30'));
    }
}
