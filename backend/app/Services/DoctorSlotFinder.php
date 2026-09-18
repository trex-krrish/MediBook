<?php

namespace App\Services;

use App\Enums\AppointmentStatus;
use App\Models\Doctor;
use Carbon\CarbonImmutable;

class DoctorSlotFinder
{
    /**
     * Build the list of bookable time slots for a doctor on a given date, across every
     * availability period set for that day of week, excluding slots that fall inside a
     * break, are already booked, or have already passed.
     *
     * @return list<array{start_time: string, end_time: string}>
     */
    public function forDate(Doctor $doctor, CarbonImmutable $date): array
    {
        $availabilityWindows = $doctor->availabilities()
            ->where('day_of_week', $date->dayOfWeek)
            ->get();

        if ($availabilityWindows->isEmpty()) {
            return [];
        }

        $slotMinutes = config('appointments.slot_duration_minutes');

        $breaks = $doctor->breaks()
            ->where('date', $date->toDateString())
            ->get(['start_time', 'end_time']);

        $bookedStartTimes = $doctor->appointments()
            ->where('appointment_date', $date->toDateString())
            ->where('status', AppointmentStatus::Booked)
            ->pluck('start_time')
            ->all();

        $now = CarbonImmutable::now();
        $slots = [];

        foreach ($availabilityWindows as $availability) {
            $windowStart = $date->setTimeFromTimeString($availability->start_time);
            $windowEnd = $date->setTimeFromTimeString($availability->end_time);

            for ($slotStart = $windowStart; $slotStart->lt($windowEnd); $slotStart = $slotStart->addMinutes($slotMinutes)) {
                $slotEnd = $slotStart->addMinutes($slotMinutes);

                if ($slotEnd->gt($windowEnd)) {
                    break;
                }

                if ($slotStart->lt($now)) {
                    continue;
                }

                $slotStartTime = $slotStart->format('H:i:s');
                $slotEndTime = $slotEnd->format('H:i:s');

                if (in_array($slotStartTime, $bookedStartTimes, true)) {
                    continue;
                }

                $overlapsBreak = $breaks->contains(
                    fn ($break) => $slotStartTime < $break->end_time && $slotEndTime > $break->start_time,
                );

                if ($overlapsBreak) {
                    continue;
                }

                $slots[$slotStartTime] = [
                    'start_time' => $slotStart->format('H:i'),
                    'end_time' => $slotEnd->format('H:i'),
                ];
            }
        }

        ksort($slots);

        return array_values($slots);
    }

    public function isSlotAvailable(Doctor $doctor, CarbonImmutable $date, string $startTime): bool
    {
        foreach ($this->forDate($doctor, $date) as $slot) {
            if ($slot['start_time'] === $startTime) {
                return true;
            }
        }

        return false;
    }
}
