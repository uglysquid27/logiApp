<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeactivateEmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('deactivate', $this->route('employee'));
    }

    public function rules()
    {
        return [
            'deactivation_reason' => 'required|string|max:255|in:resignation,termination,retirement,other',
            'deactivation_notes' => 'nullable|string|max:500'
        ];
    }
    
    public function messages()
    {
        return [
            'deactivation_reason.required' => 'Please select a deactivation reason',
            'deactivation_reason.in' => 'Invalid deactivation reason selected'
        ];
    }
}