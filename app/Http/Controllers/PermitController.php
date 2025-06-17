<?php

namespace App\Http\Controllers;

use App\Models\Permit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PermitController extends Controller
{
    /**
     * Tampilkan daftar izin.
     * Dapat memfilter izin berdasarkan karyawan yang sedang login.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $query = Permit::with('employee');
        $authenticatedEmployee = null;

        if (Auth::guard('employee')->check()) {
            // Jika karyawan login, hanya tampilkan izin mereka sendiri
            $authenticatedEmployee = Auth::guard('employee')->user();
            $query->where('employee_id', $authenticatedEmployee->id);
            Log::info("Karyawan ID " . $authenticatedEmployee->id . " mengakses daftar izin mereka.");
        } else {
            // Jika bukan karyawan (misal: admin), ambil daftar semua karyawan untuk dropdown
            // Ini akan memastikan data 'employees' selalu tersedia jika halaman diakses oleh non-karyawan
            $employees = Employee::select('id', 'nik', 'name')->orderBy('name')->get();
            Inertia::share('employees', $employees); // Bagikan ke semua halaman jika diperlukan, atau kirimkan di sini
            Log::info("Pengguna non-karyawan mengakses daftar semua izin.");
        }

        // Ambil data izin dengan pengurutan dan paginasi
        $permits = $query->orderBy('created_at', 'desc')
                        ->paginate(10);

        // Render halaman Inertia 'Permits/Index'
        // dan kirim data permits serta info karyawan yang login (jika ada) ke frontend
        return Inertia::render('Permits/Index', [
            'permits' => $permits,
            'authenticatedEmployee' => $authenticatedEmployee ? [
                'id' => $authenticatedEmployee->id,
                'name' => $authenticatedEmployee->name,
                'nik' => $authenticatedEmployee->nik,
            ] : null,
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
                // Aturan validasi untuk foto: wajib jika permit_type adalah 'sakit', harus berupa file gambar, max 2MB
                'photo' => ['sometimes', 'nullable', 'image', 'max:2048', 'required_if:permit_type,sakit'],
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
                'photo.required_if' => 'Foto surat dokter wajib disertakan untuk tipe izin "sakit".',
                'photo.image' => 'File harus berupa gambar.',
                'photo.max' => 'Ukuran foto tidak boleh lebih dari 2MB.',
            ]);

            // Optional: If an employee is logged in, ensure they are only creating permits for themselves
            // This is a security measure to prevent employees from creating permits for others.
            if (Auth::guard('employee')->check() && Auth::guard('employee')->id() !== (int)$validatedData['employee_id']) {
                throw ValidationException::withMessages([
                    'employee_id' => 'Anda hanya bisa mengajukan izin untuk diri sendiri.',
                ]);
            }

            $photoPath = null;
            // Handle file upload if a photo is provided
            if ($request->hasFile('photo')) {
                // Simpan foto ke direktori 'public/permits'
                // Ini akan menyimpan file di storage/app/public/permits
                $photoPath = $request->file('photo')->store('permits', 'public');
            }

            // Gabungkan path foto ke dalam data yang divalidasi
            $validatedData['photo'] = $photoPath;

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
