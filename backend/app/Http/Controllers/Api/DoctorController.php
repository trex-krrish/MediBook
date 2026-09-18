<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Services\DoctorSlotFinder;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DoctorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $doctors = Doctor::where('is_active', true)
            ->orderBy('name')
            ->get();

        return DoctorResource::collection($doctors);
    }

    public function show(Doctor $doctor): DoctorResource
    {
        return new DoctorResource($doctor->load('availabilities'));
    }

    /**
     * List the bookable time slots for a doctor on a given date.
     */
    public function slots(Request $request, Doctor $doctor, DoctorSlotFinder $slotFinder): JsonResponse
    {
        $bookingWindowDays = config('appointments.booking_window_days');

        $validated = $request->validate([
            'date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
                'before_or_equal:'.CarbonImmutable::today()->addDays($bookingWindowDays)->toDateString(),
            ],
        ]);

        $date = CarbonImmutable::createFromFormat('Y-m-d', $validated['date'])->startOfDay();

        return response()->json([
            'date' => $date->toDateString(),
            'slots' => $slotFinder->forDate($doctor, $date),
        ]);
    }
}
