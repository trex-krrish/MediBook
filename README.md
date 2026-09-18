# Appointment Booking System

A simple appointment booking system with two portals:

- **Admin Portal** – add/manage doctors, set multiple availability periods per day (e.g. split morning/afternoon hours), and add one-off breaks — appointments that fall inside a new break are automatically moved to the nearest open slot.
- **Patient Portal** – register/log in, browse doctors, book an available time slot, view and cancel appointments.

## Stack

- **Backend**: Laravel 13 (PHP 8.4), MySQL, Sanctum (Bearer token auth) — `backend/`
- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS v4, React Router — `frontend/`

## Prerequisites

- PHP 8.3+ and Composer
- Node.js 20+ and npm
- MySQL running locally

## Backend setup

```sh
cd backend
composer install
cp .env.example .env   # already present in this repo, but this is the setup step
php artisan key:generate
```

Create the database (matches `DB_DATABASE` in `.env`):

```sh
mysql -uroot -e "CREATE DATABASE IF NOT EXISTS practical_test"
```

Run migrations and seed demo data (an admin, a patient, and 3 doctors with Mon–Fri 9–5 availability):

```sh
php artisan migrate --seed
```

Start the API server:

```sh
php artisan serve
```

The API is served at `http://localhost:8000/api`.

### Seeded accounts

| Role    | Email                  | Password   |
| ------- | ---------------------- | ---------- |
| Admin   | admin@example.com      | password   |
| Patient | patient@example.com    | password   |

### Running backend tests

```sh
cd backend
php artisan test
```

### Config knobs

| Env var                           | Default | Meaning                                            |
| ---------------------------------- | ------- | --------------------------------------------------- |
| `APPOINTMENT_SLOT_MINUTES`          | 30      | Length of each bookable slot                        |
| `APPOINTMENT_BOOKING_WINDOW_DAYS`   | 14      | How many days ahead a patient can book              |
| `CORS_ALLOWED_ORIGINS`              | `http://localhost:5173` | Origins allowed to call the API (comma-separated) |

## Frontend setup

```sh
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and talks to the API via `VITE_API_URL` (set in `frontend/.env`, defaults to `http://localhost:8000/api`).

## How it works

- **Auth**: a single `users` table with a `role` column (`admin` | `patient`). Registration always creates a `patient`; the admin account is seeded. Sanctum issues a Bearer token on login/register, stored in `localStorage` and sent as `Authorization: Bearer <token>`.
- **Availability**: a doctor can have several availability periods per day of week (0=Sunday..6=Saturday), e.g. Monday 09:00–13:00 and 14:00–17:00. New periods can't overlap an existing one for that day (back-to-back periods are fine).
- **Breaks**: a one-off break (date + time range) for a doctor. Any `booked` appointment overlapping the break is automatically moved to the nearest still-open slot — same day first (closest by time, ties broken by the earlier slot), then the earliest slot on the soonest following day if the same day has none left. Adding a break is rejected with a 422 if the doctor has zero free slots left on that date (either no availability is configured, or the day is already fully booked).
- **Slots**: computed on demand for a given doctor + date across every availability period for that day, sliced into `APPOINTMENT_SLOT_MINUTES` chunks, excluding chunks inside a break, chunks with an existing `booked` appointment, and any that have already passed.
- **Booking**: validated against the same slot computation, then inserted inside a DB transaction with a row lock to avoid double-booking races.
- **Cancelling**: flips the appointment's `status` to `cancelled` (row is kept for history) — since slot availability excludes only `booked` appointments, the slot immediately becomes bookable again.

## Project layout

```
backend/   Laravel API (routes/api.php, app/Http/Controllers/Api, app/Services/DoctorSlotFinder.php)
frontend/  React SPA (src/pages, src/components, src/context/AuthContext.tsx)
```
