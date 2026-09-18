<?php

namespace App\Http\Requests\Admin;

use App\Services\DoctorSlotFinder;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorBreakRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $doctor = $this->route('doctor');
            $date = CarbonImmutable::createFromFormat('Y-m-d', $this->input('date'))->startOfDay();

            $hasFreeSlot = app(DoctorSlotFinder::class)->forDate($doctor, $date) !== [];

            if (! $hasFreeSlot) {
                $validator->errors()->add(
                    'date',
                    'No breaks can be assigned because the doctor has no free slots for that day.',
                );
            }
        });
    }
}
