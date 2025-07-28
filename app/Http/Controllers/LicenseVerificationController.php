<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\DomCrawler\Crawler;
use Inertia\Inertia;
use App\Models\OperatorLicense;
use Illuminate\Support\Facades\Auth;

class LicenseVerificationController extends Controller
{
public function showForm()
{
    // Get the current employee's license if it exists
    $license = OperatorLicense::where('employee_id', auth()->id())->first();
    
    return Inertia::render('License/Index', [
        'results' => null,
        'formData' => [
            'nama_peserta' => '',
            'tgl_lahir' => ''
        ],
        // Add the employee license data
        'employeeLicense' => $license ? [
            'expiry_date' => $license->expiry_date, // Keep as is if it's already a string
            'license_number' => $license->license_number,
            'image_path' => $license->image_path
        ] : null
    ]);
}

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'nama_peserta' => 'required|string|max:255',
            'tgl_lahir' => 'required|date',
        ]);

        // Prepare default response
        $responseData = [
            'formData' => $validated,
            'results' => [
                'success' => false,
                'message' => '',
                'certifications' => [],
                'debug' => []
            ]
        ];

        try {
            // Make the request with browser-like headers
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Referer' => 'https://temank3.kemnaker.go.id/page/cari_personel',
                    'Origin' => 'https://temank3.kemnaker.go.id'
                ])
                ->asForm()
                ->post('https://temank3.kemnaker.go.id/page/cari_personel', [
                    'nama_peserta' => $validated['nama_peserta'],
                    'tgl_lahir' => $validated['tgl_lahir']
                ]);

            $html = $response->body();
            $responseData['results']['debug']['http_status'] = $response->status();
            $responseData['results']['debug']['response_size'] = strlen($html);

            // Save response for debugging
            $debugFileName = 'kemnaker_response_'.now()->format('Ymd_His').'.html';
            Storage::put($debugFileName, $html);
            $responseData['results']['debug']['log_file'] = $debugFileName;

            $crawler = new Crawler($html);

            // Check for common error messages
            if (str_contains($html, 'data tidak ditemukan')) {
                throw new \Exception("No worker found with these details");
            }

            // Check if we got redirected back to the form
            if ($crawler->filter('form[action=""]')->count() > 0) {
                throw new \Exception("Received search form instead of results");
            }

            // Try multiple table selectors
            $table = $crawler->filter('table.table, table.table-bordered')->first();
            
            if ($table->count() === 0) {
                throw new \Exception("No results table found in response");
            }

            // Parse table data
            $certifications = $table->filter('tbody tr')->each(function (Crawler $row, $i) {
                return [
                    'no' => $i + 1,
                    'nama' => $row->filter('td:nth-child(2)')->text('N/A'),
                    'tanggal_lahir' => $row->filter('td:nth-child(3)')->text('N/A'),
                    'instansi' => $row->filter('td:nth-child(4)')->text('N/A'),
                    'jenis_alat' => $row->filter('td:nth-child(6)')->text('N/A'),
                    'no_registrasi' => $row->filter('td:nth-child(9)')->text('N/A'),
                    'masa_berlaku' => $row->filter('td:nth-child(10)')->text('N/A'),
                ];
            });

            if (empty($certifications)) {
                throw new \Exception("Table found but no certification data extracted");
            }

            $responseData['results'] = [
                'success' => true,
                'message' => count($certifications) . ' certifications found',
                'certifications' => $certifications,
                'debug' => $responseData['results']['debug']
            ];

        } catch (\Exception $e) {
            $responseData['results']['message'] = 'Verification failed: ' . $e->getMessage();
            Log::error('License verification failed', [
                'error' => $e->getMessage(),
                'input' => $validated,
                'trace' => $e->getTraceAsString()
            ]);
        }

        return Inertia::render('License/Index', $responseData);
    }

    // For API requests (optional)
    public function apiVerify(Request $request)
    {
        $response = $this->verify($request);
        $props = $response->getData()['props'];
        
        return response()->json([
            'success' => $props['results']['success'],
            'message' => $props['results']['message'],
            'data' => $props['results']['certifications'],
            'debug' => $props['results']['debug'] ?? null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'license_number' => 'nullable|string|max:255',
            'expiry_date' => 'required|date',
            'license_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $data = [
            'license_number' => $validated['license_number'],
            'expiry_date' => $validated['expiry_date'],
        ];

        // Handle file upload
        if ($request->hasFile('license_image')) {
            // Delete old image if exists
            $oldLicense = OperatorLicense::where('employee_id', Auth::id())->first();
            if ($oldLicense && $oldLicense->image_path) {
                Storage::delete($oldLicense->image_path);
            }

            // Store new image
            $path = $request->file('license_image')->store('license_images', 'public');
            $data['image_path'] = $path;
        }

        $license = OperatorLicense::updateOrCreate(
            ['employee_id' => Auth::id()],
            $data
        );

        return redirect()->back()->with('success', 'License updated successfully');
    }
}