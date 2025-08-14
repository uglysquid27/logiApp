<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class EmployeeProfileController extends Controller
{
    public function edit(Employee $employee)
    {
        return inertia('Employee/Edit', [
            'employee' => $employee->only([
                'id',
                'email',
                'nik',
                'name',
                'gender',
                'birth_date',
                'religion',
                'phone',
                'street',
                'rt',
                'rw',
                'kelurahan',
                'kecamatan',
                'kabupaten_kota',
                'provinsi',
                'kode_pos',
                'type',
                'group',
            ]),
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'gender' => ['required', 'in:male,female'],
            'birth_date' => ['nullable', 'date'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'religion' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:20'],
            'street' => ['nullable', 'string', 'max:255'],
            'rt' => ['nullable', 'string', 'max:10'],
            'rw' => ['nullable', 'string', 'max:10'],
            'kelurahan' => ['nullable', 'string', 'max:100'],
            'kecamatan' => ['nullable', 'string', 'max:100'],
            'kabupaten_kota' => ['nullable', 'string', 'max:100'],
            'provinsi' => ['nullable', 'string', 'max:100'],
            'kode_pos' => ['nullable', 'string', 'max:10'],
        ]);

        $employee->update($request->only([
            'name',
            'gender',
            'birth_date',
            'email',
            'religion',
            'phone',
            'street',
            'rt',
            'rw',
            'kelurahan',
            'kecamatan',
            'kabupaten_kota',
            'provinsi',
            'kode_pos',
        ]));

        return redirect()->route('employee.employees.edit', $employee)
            ->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request, Employee $employee)
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if (!Hash::check($request->current_password, $employee->password)) {
            return back()->withErrors([
                'current_password' => ['The provided password does not match our records.']
            ]);
        }

        $employee->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Password updated successfully.');
    }
}