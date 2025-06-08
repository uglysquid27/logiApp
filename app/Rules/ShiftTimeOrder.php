<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Carbon\Carbon; // Import Carbon for date/time handling

class ShiftTimeOrder implements ValidationRule
{
    protected $startTime; // To store the start time from the other field
    protected $attributeToValidate; // The attribute (end_time) currently being validated
    protected $startTimeField; // The field name containing the start time (e.g., 'start_time')

    /**
     * Create a new rule instance.
     *
     * @param string $startTimeField The field name containing the start time (e.g., 'start_time')
     * @param string $attribute The attribute being validated (e.g., 'time_slots.*.end_time')
     * @return void
     */
    public function __construct($startTimeField, $attribute)
    {
        $this->startTimeField = $startTimeField;
        $this->attributeToValidate = $attribute;
    }

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Get the full data of the current slot to find the start_time
        // $attribute will be something like 'time_slots.0.end_time'
        // We need to extract the base path (e.g., 'time_slots.0')
        $parts = explode('.', $attribute);
        array_pop($parts); // Remove 'end_time'
        $slotBasePath = implode('.', $parts); // e.g., 'time_slots.0'

        // Get the start time value from the request
        // This is crucial: use request()->input() because $value is only the end_time
        $startTimeValue = request()->input($slotBasePath . '.' . $this->startTimeField);

        if (empty($startTimeValue) || empty($value)) {
            // If either time is missing, let required_if handle it.
            // This rule only validates the order if both are present.
            return;
        }

        try {
            // Parse times. For comparison, assume both times are on the same arbitrary date.
            $start = Carbon::parse($startTimeValue);
            $end = Carbon::parse($value);

            // If end time is before or equal to start time, it must be an overnight shift
            // or an invalid input (e.g., 10:00 to 09:00 for same-day shift)
            if ($end->lte($start)) {
                // Check if it's an overnight shift (e.g., 22:00 to 06:00)
                // If end time is significantly earlier, it's likely next day
                if ($start->diffInMinutes($end, false) < 0) { // If end is before start numerically
                    // It's an overnight shift. This is valid.
                    return;
                }
                // If it's not an overnight shift, and end is before/equal to start, it's invalid
                $fail('Waktu selesai harus setelah waktu mulai pada hari yang sama atau merupakan shift semalam.');
            }
            // If $end is greater than $start, it's a normal same-day shift, which is valid.

        } catch (\Exception $e) {
            // Catch any parsing errors, though date_format rule should prevent this
            $fail('Format waktu tidak valid untuk perbandingan shift.');
        }
    }
}