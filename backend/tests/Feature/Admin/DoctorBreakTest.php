<?php

namespace Tests\Feature\Admin;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DoctorBreakTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo(CarbonImmutable::parse('2026-09-21 08:00:00'));
    }

    public function test_an_admin_can_add_a_break_that_conflicts_with_nothing(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '17:00:00']);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '12:00',
            'end_time' => '13:00',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.start_time', '12:00')
            ->assertJsonCount(0, 'moved_appointments');

        $this->assertDatabaseHas('doctor_breaks', [
            'doctor_id' => $doctor->id,
            'date' => '2026-09-21',
            'start_time' => '12:00:00',
            'end_time' => '13:00:00',
        ]);
    }

    public function test_the_example_scenario_moves_the_conflicting_appointment_to_the_nearest_slot(): void
    {
        // Doctor available 9-1 and 2-5; patient booked 11:00; admin adds a break 10:30-11:30.
        // 11:30 (30 min away) is nearer than 10:00 (60 min away), so the appointment should land there.
        $admin = User::factory()->admin()->create();
        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '13:00:00']);
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '14:00:00', 'end_time' => '17:00:00']);

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '10:30',
            'end_time' => '11:30',
        ]);

        $response->assertCreated()->assertJsonCount(1, 'moved_appointments')
            ->assertJsonPath('moved_appointments.0.id', $appointment->id)
            ->assertJsonPath('moved_appointments.0.start_time', '11:30')
            ->assertJsonPath('moved_appointments.0.appointment_date', '2026-09-21');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '11:30:00',
            'status' => AppointmentStatus::Booked,
        ]);
        $this->assertNotNull($appointment->refresh()->rescheduled_at);
    }

    public function test_the_nearest_earlier_slot_is_preferred_when_it_is_closer(): void
    {
        $admin = User::factory()->admin()->create();
        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '17:00:00']);

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '12:00:00',
            'end_time' => '12:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        // 11:30 is 30 min before; 13:00 is 60 min after. 11:30 should win.
        $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '12:00',
            'end_time' => '13:00',
        ])->assertCreated();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'start_time' => '11:30:00',
        ]);
    }

    public function test_appointments_outside_the_break_window_are_left_untouched(): void
    {
        $admin = User::factory()->admin()->create();
        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '17:00:00']);

        $unaffected = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'patient_id' => $patient->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '12:00',
            'end_time' => '13:00',
        ])->assertCreated();

        $this->assertDatabaseHas('appointments', [
            'id' => $unaffected->id,
            'start_time' => '09:00:00',
        ]);
        $this->assertNull($unaffected->refresh()->rescheduled_at);
    }

    public function test_multiple_conflicting_appointments_are_each_moved_to_distinct_slots(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '17:00:00']);

        $first = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => AppointmentStatus::Booked,
        ]);
        $second = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '10:30:00',
            'end_time' => '11:00:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '10:00',
            'end_time' => '11:00',
        ]);

        $response->assertCreated()->assertJsonCount(2, 'moved_appointments');

        $firstNewTime = $first->refresh()->start_time;
        $secondNewTime = $second->refresh()->start_time;

        $this->assertNotEquals($firstNewTime, $secondNewTime);
        $this->assertNotEquals('10:00:00', $firstNewTime);
        $this->assertNotEquals('10:30:00', $secondNewTime);
    }

    public function test_when_no_slot_remains_that_day_the_appointment_moves_to_the_next_available_day(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        // Monday: two 30-minute slots. One is booked, one is still free, so the
        // day isn't fully booked yet — the break itself will consume both.
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '10:00:00']);
        // Tuesday: a normal day of availability to move into.
        $doctor->availabilities()->create(['day_of_week' => 2, 'start_time' => '09:00:00', 'end_time' => '17:00:00']);

        $appointment = Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '09:00',
            'end_time' => '10:00',
        ])->assertCreated();

        $appointment->refresh();
        $this->assertSame('2026-09-22', $appointment->appointment_date->toDateString());
        $this->assertSame('09:00:00', $appointment->start_time);
    }

    public function test_an_admin_cannot_add_a_break_when_the_doctor_has_no_free_slots_that_day(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        $doctor->availabilities()->create(['day_of_week' => 1, 'start_time' => '09:00:00', 'end_time' => '09:30:00']);

        Appointment::factory()->create([
            'doctor_id' => $doctor->id,
            'appointment_date' => '2026-09-21',
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => AppointmentStatus::Booked,
        ]);

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '09:00',
            'end_time' => '09:30',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('date');
        $this->assertDatabaseCount('doctor_breaks', 0);
    }

    public function test_an_admin_cannot_add_a_break_on_a_day_the_doctor_has_no_availability_at_all(): void
    {
        $admin = User::factory()->admin()->create();
        $doctor = Doctor::factory()->create();
        // No availability configured for any day.

        $response = $this->actingAs($admin)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '09:00',
            'end_time' => '09:30',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('date');
    }

    public function test_a_patient_cannot_add_a_break(): void
    {
        $patient = User::factory()->create();
        $doctor = Doctor::factory()->create();

        $this->actingAs($patient)->postJson("/api/admin/doctors/{$doctor->id}/breaks", [
            'date' => '2026-09-21',
            'start_time' => '12:00',
            'end_time' => '13:00',
        ])->assertForbidden();
    }
}
