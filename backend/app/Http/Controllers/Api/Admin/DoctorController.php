<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDoctorRequest;
use App\Http\Requests\Admin\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class DoctorController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $doctors = Doctor::with($this->scheduleRelations())
            ->orderBy('name')
            ->get();

        return DoctorResource::collection($doctors);
    }

    public function store(StoreDoctorRequest $request): DoctorResource
    {
        $doctor = Doctor::create($request->validated());

        return new DoctorResource($doctor);
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor): DoctorResource
    {
        $doctor->update($request->validated());

        return new DoctorResource($doctor->fresh($this->scheduleRelations()));
    }

    /**
     * @return array<string, \Closure>
     */
    private function scheduleRelations(): array
    {
        return [
            'availabilities' => fn ($query) => $query->orderBy('day_of_week')->orderBy('start_time'),
            'breaks' => fn ($query) => $query->orderBy('date')->orderBy('start_time'),
        ];
    }
}
