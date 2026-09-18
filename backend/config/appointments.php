<?php

return [
    'slot_duration_minutes' => (int) env('APPOINTMENT_SLOT_MINUTES', 30),
    'booking_window_days' => (int) env('APPOINTMENT_BOOKING_WINDOW_DAYS', 14),
];
