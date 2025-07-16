<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $shifts = Shift::all();
        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Shift $shift)
    {
        return Inertia::render('Shifts/Edit', [
            'shift' => $shift,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Shift $shift)
{
    $validated = $request->validate([
        'start_time' => ['required', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/'], // HH:MM format
        'end_time' => ['required', 'regex:/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/', 'after:start_time'],
    ]);

    // Ensure times are in HH:MM format
    $validated['start_time'] = $this->formatTime($validated['start_time']);
    $validated['end_time'] = $this->formatTime($validated['end_time']);

    // Calculate hours based on time difference
    $start = Carbon::createFromFormat('H:i', $validated['start_time']);
    $end = Carbon::createFromFormat('H:i', $validated['end_time']);
    $validated['hours'] = $end->diffInHours($start) + ($end->diffInMinutes($start) % 60) / 60;

    $shift->update($validated);

    return redirect()->route('shifts.index')->with('success', 'Shift updated successfully.');
}

private function formatTime($time)
{
    $parts = explode(':', $time);
    $hours = str_pad($parts[0], 2, '0', STR_PAD_LEFT);
    $minutes = str_pad($parts[1] ?? '00', 2, '0', STR_PAD_LEFT);
    return "{$hours}:{$minutes}";
}
}