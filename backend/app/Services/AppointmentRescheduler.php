<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorBreak;
use Carbon\CarbonImmutable;

class AppointmentRescheduler
{
    private const MAX_SEARCH_DAYS = 60;

    public function __construct(private DoctorSlotFinder $slotFinder) {}

    /**
     * Move every booked appointment that conflicts with the given break to the
     * nearest slot still available for that doctor, closest in time first on the
     * same day, then the earliest slot on the soonest following day.
     *
     * @return list<Appointment>
     */
    public function rescheduleConflicting(Doctor $doctor, DoctorBreak $break): array
    {
        $affected = Appointment::where('doctor_id', $doctor->id)
            ->where('appointment_date', $break->date->toDateString())
            ->where('status', AppointmentStatus::Booked)
            ->where('start_time', '<', $break->end_time)
            ->where('end_time', '>', $break->start_time)
            ->orderBy('start_time')
            ->get();

        $moved = [];

        foreach ($affected as $appointment) {
            $slot = $this->findNearestSlot($doctor, $appointment);

            if ($slot === null) {
                continue;
            }

            $appointment->update([
                'appointment_date' => $slot['date'],
                'start_time' => $slot['start_time'].':00',
                'end_time' => $slot['end_time'].':00',
                'rescheduled_at' => now(),
            ]);

            $moved[] = $appointment;
        }

        return $moved;
    }

    /**
     * @return array{date: string, start_time: string, end_time: string}|null
     */
    private function findNearestSlot(Doctor $doctor, Appointment $appointment): ?array
    {
        $originalDate = CarbonImmutable::parse($appointment->appointment_date->toDateString());
        $originalMinutes = $this->toMinutes($appointment->start_time);

        $sameDaySlots = $this->slotFinder->forDate($doctor, $originalDate);

        if ($sameDaySlots !== []) {
            usort($sameDaySlots, function (array $a, array $b) use ($originalMinutes) {
                $diffA = abs($this->toMinutes($a['start_time']) - $originalMinutes);
                $diffB = abs($this->toMinutes($b['start_time']) - $originalMinutes);

                return $diffA <=> $diffB ?: $this->toMinutes($a['start_time']) <=> $this->toMinutes($b['start_time']);
            });

            return ['date' => $originalDate->toDateString(), ...$sameDaySlots[0]];
        }

        for ($offset = 1; $offset <= self::MAX_SEARCH_DAYS; $offset++) {
            $candidateDate = $originalDate->addDays($offset);
            $slots = $this->slotFinder->forDate($doctor, $candidateDate);

            if ($slots !== []) {
                return ['date' => $candidateDate->toDateString(), ...$slots[0]];
            }
        }

        return null;
    }

    private function toMinutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }
}
