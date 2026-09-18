<?php

namespace App\Http\Controllers\Api;

use App\Enums\AppointmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Services\DoctorSlotFinder;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = $request->user()->appointments()
            ->with('doctor')
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function store(StoreAppointmentRequest $request, DoctorSlotFinder $slotFinder): AppointmentResource
    {
        $doctor = Doctor::findOrFail($request->validated('doctor_id'));
        $date = CarbonImmutable::createFromFormat('Y-m-d', $request->validated('appointment_date'))->startOfDay();
        $startTime = $request->validated('start_time');

        $slot = collect($slotFinder->forDate($doctor, $date))->firstWhere('start_time', $startTime);

        abort_if($slot === null, 422, 'The selected time slot is not available.');

        $appointment = DB::transaction(function () use ($doctor, $date, $slot, $request) {
            $conflict = Appointment::where('doctor_id', $doctor->id)
                ->where('appointment_date', $date->toDateString())
                ->where('start_time', $slot['start_time'].':00')
                ->where('status', AppointmentStatus::Booked)
                ->lockForUpdate()
                ->first();

            abort_if($conflict !== null, 409, 'This slot has just been booked by someone else.');

            return Appointment::create([
                'doctor_id' => $doctor->id,
                'patient_id' => $request->user()->id,
                'appointment_date' => $date->toDateString(),
                'start_time' => $slot['start_time'].':00',
                'end_time' => $slot['end_time'].':00',
                'status' => AppointmentStatus::Booked,
            ]);
        });

        return new AppointmentResource($appointment->load('doctor'));
    }

    public function destroy(Request $request, Appointment $appointment): AppointmentResource
    {
        $this->authorize('cancel', $appointment);

        abort_if($appointment->status === AppointmentStatus::Cancelled, 422, 'This appointment is already cancelled.');

        $appointment->update([
            'status' => AppointmentStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return new AppointmentResource($appointment->load('doctor'));
    }
}
