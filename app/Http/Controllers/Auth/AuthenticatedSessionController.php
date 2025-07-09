<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credential = $request->input('credential');
        $password = $request->input('password');
        $remember = $request->boolean('remember');

        $isNik = preg_match('/^EMP\d+$|^\d+$/', $credential);

        if ($isNik) {
            if (!Auth::guard('employee')->attempt(
                ['nik' => $credential, 'password' => $password],
                $remember
            )) {
                throw ValidationException::withMessages([
                    'credential' => __('auth.failed'),
                ]);
            }

            $request->session()->regenerate();
            return redirect()->intended(route('employee.dashboard'));
        } else {
            if (!Auth::guard('web')->attempt(
                ['email' => $credential, 'password' => $password],
                $remember
            )) {
                throw ValidationException::withMessages([
                    'credential' => __('auth.failed'),
                ]);
            }

            $request->session()->regenerate();
            return redirect()->intended(route('dashboard'));
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        // Store current session ID before logout
        $sessionId = $request->session()->getId();

        // Logout from all guards
        Auth::guard('web')->logout();
        Auth::guard('employee')->logout();

        // Invalidate and regenerate
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Explicitly delete the session record from database
        DB::table('sessions')->where('id', $sessionId)->delete();

        // Clear all session data
        $request->session()->flush();

        return redirect('/')
            ->withHeaders([
                'Cache-Control' => 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'no-cache',
                'Expires' => 'Fri, 01 Jan 1990 00:00:00 GMT',
            ]);
    }
}