<?php

namespace App\Http\Controllers;

use App\Models\Permit;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AdminPermitController extends Controller
{
    /**
     * Menampilkan daftar semua permintaan izin untuk admin.
     * Dapat memfilter berdasarkan status (pending, accepted, rejected).
     */
    public function index(Request $request): Response
    {
        // Mendapatkan filter status dari request, default ke 'pending' jika tidak ada
        $filterStatus = $request->input('status', 'pending');

        $query = Permit::with('employee') // Eager load relasi employee
                       ->orderBy('created_at', 'desc'); // Urutkan berdasarkan tanggal terbaru

        if ($filterStatus && $filterStatus !== 'all') {
            $query->where('status', $filterStatus);
        }

        $permits = $query->paginate(10); // Paginate hasilnya

        Log::info("Admin mengakses daftar izin dengan filter status: " . $filterStatus);

        return Inertia::render('Permits/AdminIndex', [
            'permits' => $permits,
            'filters' => ['status' => $filterStatus],
        ]);
    }

    /**
     * Memperbarui status permintaan izin (terima atau tolak).
     */
    public function respond(Request $request, Permit $permit)
    {
        try {
            $validated = $request->validate([
                'status' => ['required', 'in:pending,approved,rejected,cancelled'],
                // Tetap biarkan 'admin_notes' nullable di sini jika Anda ingin catatan admin disimpan
                // Meskipun di frontend Anda telah menghapus inputnya, backend masih bisa menerima nilai null.
                'admin_notes' => ['nullable', 'string', 'max:500'],
            ], [
                'status.required' => 'Status persetujuan wajib diisi.',
                // PERBAIKAN: Perbarui pesan kustom agar sesuai dengan nilai enum yang benar
                'status.in' => 'Status yang dipilih tidak valid. Harap pilih dari pending, approved, rejected, atau cancelled.',
                'admin_notes.string' => 'Catatan admin harus berupa teks.',
                'admin_notes.max' => 'Catatan admin tidak boleh lebih dari 500 karakter.',
            ]);

            DB::transaction(function () use ($permit, $validated) {
                $permit->status = $validated['status'];
                // Set admin_notes ke nilai yang divalidasi atau null jika tidak ada
                $permit->admin_notes = $validated['admin_notes'] ?? null;
                $permit->save();

                // Logika tambahan jika izin ditolak atau diterima
                $employee = $permit->employee; // Ambil employee dari relasi
                if ($employee) {
                    if ($permit->status === 'rejected') {
                        // Jika izin ditolak, pastikan karyawan tidak dianggap cuti
                        $employee->cuti = 'no'; // Asumsi: Karyawan tidak cuti jika izin ditolak
                        $employee->status = 'available'; // Atau status default lainnya
                        Log::info("Izin ID " . $permit->id . " ditolak. Status karyawan " . $employee->nik . " diatur ke available.");
                    } else if ($permit->status === 'approved') { // PERBAIKAN: Mengubah 'accepted' menjadi 'approved'
                         // Jika izin diterima, perbarui status cuti karyawan
                        $employee->cuti = 'yes'; // Karyawan sedang cuti
                        $employee->status = 'on leave'; // Atau status lain yang menunjukkan cuti
                        Log::info("Izin ID " . $permit->id . " diterima. Status karyawan " . $employee->nik . " diatur ke on leave.");
                    }
                    $employee->save();
                } else {
                    Log::warning("Tidak dapat menemukan karyawan untuk izin ID: " . $permit->id . ". Status karyawan tidak diperbarui.");
                }
            });

            Log::info("Status izin ID " . $permit->id . " berhasil diperbarui menjadi: " . $validated['status']);
            return back()->with('success', 'Status izin berhasil diperbarui.');

        } catch (ValidationException $e) {
            Log::error('Validation Error responding to permit: ' . json_encode($e->errors()), ['exception' => $e]);
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            Log::error('Error responding to permit: ' . $e->getMessage(), ['exception' => $e, 'permit_id' => $permit->id]);
            return back()->with('error', 'Terjadi kesalahan tak terduga. Mohon coba lagi.');
        }
    }
}
