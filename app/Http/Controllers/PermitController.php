<?php

namespace App\Http\Controllers;

use App\Models\Permit; // Import model Permit
use App\Models\Employee; // Import model Employee untuk dropdown
use Illuminate\Http\Request;
use Inertia\Inertia; // Import Inertia
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth; // Import Auth facade

class PermitController extends Controller
{
    /**
     * Tampilkan daftar izin.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        // Ambil semua data izin dari database
        // Eager load relasi 'employee' untuk menampilkan nama karyawan
        $permits = Permit::with('employee')
                        ->orderBy('created_at', 'desc') // Urutkan berdasarkan tanggal pembuatan terbaru
                        ->paginate(10); // Gunakan paginasi untuk daftar yang panjang

        // Render halaman Inertia 'Permits/Index'
        // dan kirim data permits ke frontend
        return Inertia::render('Permits/Index', [
            'permits' => $permits,
        ]);
    }

    /**
     * Tampilkan formulir untuk membuat izin baru.
     *
     * @return \Inertia\Response
     */
    public function create()
    {
        // Ambil daftar semua karyawan untuk dropdown (untuk admin atau jika employee_id belum ditentukan)
        $employees = Employee::select('id', 'nik', 'name')->orderBy('name')->get();

        $authenticatedEmployee = null;
        if (Auth::guard('employee')->check()) {
            // Jika ada karyawan yang login melalui guard 'employee', ambil datanya
            $authenticatedEmployee = Auth::guard('employee')->user();
        }

        return Inertia::render('Permits/Create', [
            'employees' => $employees, // Daftar lengkap karyawan (untuk admin)
            'authenticatedEmployee' => $authenticatedEmployee ? [
                'id' => $authenticatedEmployee->id,
                'name' => $authenticatedEmployee->name,
                'nik' => $authenticatedEmployee->nik,
            ] : null, // Data karyawan yang login, jika ada
        ]);
    }

    /**
     * Simpan izin baru ke penyimpanan.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'employee_id' => ['required', 'exists:employees,id'],
                'permit_type' => ['required', 'in:sakit,cuti,izin_khusus,lainnya'], // Sesuaikan dengan nilai ENUM di migrasi
                'start_date' => ['required', 'date'],
                'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
                'reason' => ['required', 'string', 'max:1000'],
            ], [
                'employee_id.required' => 'Karyawan wajib dipilih.',
                'employee_id.exists' => 'Karyawan yang dipilih tidak valid.',
                'permit_type.required' => 'Tipe izin wajib dipilih.',
                'permit_type.in' => 'Tipe izin tidak valid.',
                'start_date.required' => 'Tanggal mulai izin wajib diisi.',
                'start_date.date' => 'Format tanggal mulai izin tidak valid.',
                'end_date.date' => 'Format tanggal selesai izin tidak valid.',
                'end_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
                'reason.required' => 'Alasan wajib diisi.',
                'reason.string' => 'Alasan harus berupa teks.',
                'reason.max' => 'Alasan tidak boleh lebih dari 1000 karakter.',
            ]);

            // Optional: If an employee is logged in, ensure they are only creating permits for themselves
            // This is a security measure to prevent employees from creating permits for others.
            if (Auth::guard('employee')->check() && Auth::guard('employee')->id() !== (int)$validatedData['employee_id']) {
                throw ValidationException::withMessages([
                    'employee_id' => 'Anda hanya bisa mengajukan izin untuk diri sendiri.',
                ]);
            }

            Permit::create($validatedData);

            return redirect()->route('permits.index')->with('success', 'Pengajuan izin berhasil dibuat.');

        } catch (ValidationException $e) {
            Log::error('Validation Error creating permit: ' . json_encode($e->errors()), ['exception' => $e]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating permit: ' . $e->getMessage(), ['exception' => $e]);
            return back()->with('error', 'Terjadi kesalahan tak terduga saat membuat izin. Silakan coba lagi.')->withInput();
        }
    }


    // public function show(Permit $permit) { /* untuk menampilkan detail izin */ }
    // public function edit(Permit $permit) { /* untuk menampilkan form edit izin */ }
    // public function update(Request $request, Permit $permit) { /* untuk memperbarui izin */ }
    // public function destroy(Permit $permit) { /* untuk menghapus izin */ }
}
