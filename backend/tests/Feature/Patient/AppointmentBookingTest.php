<?php

namespace Tests\Feature\Patient;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
{
    use RefreshDatabase;

    private Doctor $doctor;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));

        $this->doctor = Doctor::factory()->create();
        $this->doctor->availabilities()->create([
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
        ]);
    }

    public function test_a_patient_can_book_an_available_slot(): void
    {
        $patient = User::factory()->create();

        $response = $this->actingAs($patient)->postJson('/api/appointments', [
            'doctor_id' => $this->doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.start_time', '09:00')
            ->assertJsonPath('data.status', 'booked');

        $this->assertDatabaseHas('appointments', [
            'doctor_id' => $this->doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'status' => AppointmentStatus::Booked,
        ]);
    }

    public function test_a_patient_cannot_book_an_already_booked_slot(): void
    {
        $patient = User::factory()->create();
        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($patient)->postJson('/api/appointments', [
            'doctor_id' => $this->doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00',
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseCount('appointments', 1);
    }

    public function test_a_patient_cannot_book_a_slot_outside_the_doctors_availability(): void
    {
        $patient = User::factory()->create();

        $response = $this->actingAs($patient)->postJson('/api/appointments', [
            'doctor_id' => $this->doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '11:00',
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseCount('appointments', 0);
    }

    public function test_a_patient_only_sees_their_own_appointments(): void
    {
        $patient = User::factory()->create();
        $otherPatient = User::factory()->create();

        $ownAppointment = Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'patient_id' => $patient->id,
        ]);
        Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'patient_id' => $otherPatient->id,
        ]);

        $response = $this->actingAs($patient)->getJson('/api/appointments');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownAppointment->id);
    }

    public function test_a_patient_can_cancel_their_own_appointment_and_the_slot_reopens(): void
    {
        $patient = User::factory()->create();
        $appointment = Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($patient)->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertOk()->assertJsonPath('data.status', 'cancelled');
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatus::Cancelled,
        ]);

        $slotsResponse = $this->actingAs($patient)->getJson("/api/doctors/{$this->doctor->id}/slots?date=2026-09-21");
        $slotsResponse->assertJsonFragment(['start_time' => '09:00']);
    }

    public function test_a_patient_cannot_cancel_another_patients_appointment(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $appointment = Appointment::factory()->create([
            'doctor_id' => $this->doctor->id,
            'patient_id' => $owner->id,
        ]);

        $response = $this->actingAs($intruder)->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => AppointmentStatus::Booked,
        ]);
    }

    public function test_an_already_cancelled_appointment_cannot_be_cancelled_again(): void
    {
        $patient = User::factory()->create();
        $appointment = Appointment::factory()->cancelled()->create([
            'doctor_id' => $this->doctor->id,
            'patient_id' => $patient->id,
        ]);

        $response = $this->actingAs($patient)->deleteJson("/api/appointments/{$appointment->id}");

        $response->assertUnprocessable();
    }
}
