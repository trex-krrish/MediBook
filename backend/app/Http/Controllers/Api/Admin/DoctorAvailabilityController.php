<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorAvailabilityRequest;
use App\Http\Resources\DoctorAvailabilityResource;
use App\Models\Doctor;
use App\Models\DoctorAvailability;
use Illuminate\Http\Response;

class DoctorAvailabilityController extends Controller
{
    /**
     * Add a new availability period for a doctor. A day may have several
     * non-overlapping periods (e.g. split morning/afternoon hours).
     */
    public function store(StoreDoctorAvailabilityRequest $request, Doctor $doctor): DoctorAvailabilityResource
    {
        $availability = $doctor->availabilities()->create([
            'day_of_week' => $request->validated('day_of_week'),
            'start_time' => $request->validated('start_time').':00',
            'end_time' => $request->validated('end_time').':00',
        ]);

        return new DoctorAvailabilityResource($availability);
    }

    public function destroy(Doctor $doctor, DoctorAvailability $availability): Response
    {
        abort_if($availability->doctor_id !== $doctor->id, 404);

        $availability->delete();

        return response()->noContent();
    }
}
