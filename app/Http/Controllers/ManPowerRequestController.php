<?php

namespace App\Http\Controllers;

use App\Models\ManPowerRequest;
use App\Models\SubSection;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManPowerRequestController extends Controller
{
    public function index()
    {
        $requests = ManpowerRequest::with(['sub_section.section'])->latest()->get();

        return Inertia::render('ManpowerRequests/Index', [
            'requests' => $requests,
        ]);
        
    }

    public function create()
    {
        $subSections = SubSection::all();
        return Inertia::render('ManpowerRequests/Create', [
            'subSections' => $subSections
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sub_section_id' => 'required|exists:sub_sections,id',
            'date' => 'required|date',
            'requested_amount' => 'required|integer|min:1',
        ]);

        ManPowerRequest::create([
            'sub_section_id' => $request->sub_section_id,
            'date' => $request->date,
            'requested_amount' => $request->requested_amount,
            'status' => 'pending',
        ]);

        return redirect()->route('manpower-requests.index');
    }
}
