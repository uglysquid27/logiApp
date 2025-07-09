<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PreventBackAfterLogout
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Only add headers for GET requests
        if ($request->isMethod('GET')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Fri, 01 Jan 1990 00:00:00 GMT');
        }

        return $response;
    }
}