<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request; // Use base Request for custom validation
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException; // Import ValidationException
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;


class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request for both web users and employees.
     */
    public function store(Request $request): RedirectResponse
    {
        // Use a generic name for the input field to handle both email and NIK
        $credential = $request->input('credential');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        // Determine if the credential is likely an NIK (purely numeric)
        $isNik = preg_match('/^EMP\d+$|^\d+$/', $credential);

        if ($isNik) {
            Log::info('NIK login attempt', [
                'nik' => $credential,
                'password' => $password,
            ]);
        
            $authenticated = Auth::guard('employee')->attempt(
                ['nik' => $credential, 'password' => $password],
                $remember
            );
        
            Log::info('Authenticated status:', [$authenticated]);
        
            if (! $authenticated) {
                throw ValidationException::withMessages([
                    'credential' => __('auth.failed'),
                ]);
            }
        
            $request->session()->regenerate();
            return redirect()->intended(route('employee.dashboard'));
        }
         else {
            // Assume it's an email for standard web user authentication
            if (! Auth::guard('web')->attempt(['email' => $credential, 'password' => $password], $remember)) {
                // If web authentication fails
                throw ValidationException::withMessages([
                    'credential' => __('auth.failed'), // Use 'credential' as the error key for consistency
                ]);
            }
            // If web authentication is successful, redirect to standard dashboard
            $request->session()->regenerate();
            return redirect()->intended(route('dashboard'));
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // This method will only log out the currently active guard.
        // If an employee is logged in, it logs them out. If a web user, logs them out.
        // This is important for unified logout.
        if (Auth::guard('web')->check()) {
            Auth::guard('web')->logout();
        } elseif (Auth::guard('employee')->check()) {
            Auth::guard('employee')->logout();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
