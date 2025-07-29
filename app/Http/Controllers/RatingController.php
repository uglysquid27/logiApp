<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Rating;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function create($employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        
        // Check if rating already exists for this employee (if needed)
        $rating = Rating::where('employee_id', $employeeId)->first();
    
        return inertia('Rating/Index', [
            'employee' => [
                'id' => $employee->id,
                'name' => $employee->name,
                'nik' => $employee->nik
            ],
            'ratingData' => $rating,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'rating' => 'required|numeric|min:0.5|max:5',
            'comment' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        // Check if rating already exists for this employee
        if (Rating::where('employee_id', $validated['employee_id'])->exists()) {
            return back()->withErrors(['msg' => 'Rating already exists for this employee.']);
        }

        Rating::create([
            'employee_id' => $validated['employee_id'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'tags' => $validated['tags'] ?? null,
        ]);

        return redirect()->route('employee-attendance.index')->with('success', 'Rating submitted successfully!');
    }

    public function update(Request $request, Rating $rating)
    {
        $validated = $request->validate([
            'rating' => 'required|numeric|min:0.5|max:5',
            'comment' => 'nullable|string',
            'tags' => 'nullable|array',
        ]);

        $rating->update([
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
            'tags' => $validated['tags'] ?? null,
        ]);

        return redirect()->route('employees.index')->with('success', 'Rating updated successfully!');
    }
}