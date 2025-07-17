<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\BlindTest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EmployeeBlindTestController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::with(['blindTests' => function($query) {
            $query->orderBy('test_date', 'desc');
        }])->active();

        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%'.$searchTerm.'%')
                  ->orWhere('nik', 'like', '%'.$searchTerm.'%');
            });
        }

        $employees = $query->paginate(10);

        return Inertia::render('EmployeeBlindTest/Index', [
            'employees' => $employees,
            'filters' => $request->only('search')
        ]);
    }

    public function create(Employee $employee)
    {
        return Inertia::render('EmployeeBlindTest/Create', [
            'employee' => $employee->only('id', 'name', 'nik'),
            'defaultDate' => Carbon::now()->format('Y-m-d')
        ]);
    }

    public function store(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'test_date' => 'required|date',
            'result' => 'required|numeric|min:0|max:100'
        ]);

        $employee->blindTests()->create($validated);

        return redirect()->route('employee-blind-test.index')
            ->with('success', 'Blind test result added successfully.');
    }

    public function show(Employee $employee)
    {
        $blindTests = $employee->blindTests()
            ->orderBy('test_date', 'desc')
            ->paginate(10);

        return Inertia::render('EmployeeBlindTest/Show', [
            'employee' => $employee->only('id', 'name', 'nik'),
            'blindTests' => $blindTests
        ]);
    }

    public function destroy(BlindTest $blindTest)
    {
        $blindTest->delete();

        return redirect()->back()
            ->with('success', 'Blind test result deleted successfully.');
    }
}