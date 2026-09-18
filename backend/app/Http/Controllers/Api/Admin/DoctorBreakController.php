<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorBreakRequest;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\DoctorBreakResource;
use App\Models\Doctor;
use App\Services\AppointmentRescheduler;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DoctorBreakController extends Controller
{
    /**
     * Add a break for a doctor. Any booked appointment that falls inside the
     * break window is automatically moved to the nearest slot still available.
     */
    public function store(StoreDoctorBreakRequest $request, Doctor $doctor, AppointmentRescheduler $rescheduler): JsonResponse
    {
        [$break, $movedAppointments] = DB::transaction(function () use ($request, $doctor, $rescheduler) {
            $break = $doctor->breaks()->create([
                'date' => $request->validated('date'),
                'start_time' => $request->validated('start_time').':00',
                'end_time' => $request->validated('end_time').':00',
            ]);

            $moved = $rescheduler->rescheduleConflicting($doctor, $break);

            return [$break, $moved];
        });

        return response()->json([
            'data' => new DoctorBreakResource($break),
            'moved_appointments' => AppointmentResource::collection(
                collect($movedAppointments)->map(fn ($appointment) => $appointment->load(['doctor', 'patient'])),
            ),
        ], 201);
    }
}
