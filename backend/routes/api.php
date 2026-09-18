<?php

use App\Http\Controllers\Api\Admin\DoctorAvailabilityController;
use App\Http\Controllers\Api\Admin\DoctorBreakController;
use App\Http\Controllers\Api\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DoctorController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/doctors', [AdminDoctorController::class, 'index']);
        Route::post('/doctors', [AdminDoctorController::class, 'store']);
        Route::patch('/doctors/{doctor}', [AdminDoctorController::class, 'update']);

        Route::post('/doctors/{doctor}/availabilities', [DoctorAvailabilityController::class, 'store']);
        Route::delete('/doctors/{doctor}/availabilities/{availability}', [DoctorAvailabilityController::class, 'destroy']);

        Route::post('/doctors/{doctor}/breaks', [DoctorBreakController::class, 'store']);
    });

    Route::middleware('role:patient')->group(function () {
        Route::get('/doctors', [DoctorController::class, 'index']);
        Route::get('/doctors/{doctor}', [DoctorController::class, 'show']);
        Route::get('/doctors/{doctor}/slots', [DoctorController::class, 'slots']);

        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);
    });
});
