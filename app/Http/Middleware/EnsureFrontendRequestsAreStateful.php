<?php

namespace App\Http\Middleware;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumStateful;
use Laravel\Sanctum\Sanctum;

/**
 * Extends Sanctum's stateful check so API requests from the same host are
 * treated as stateful even when Referer/Origin are missing (e.g. strict privacy).
 */
class EnsureFrontendRequestsAreStateful extends SanctumStateful
{
    /**
     * Determine if the given request is from the first-party application frontend.
     * When Referer/Origin are missing, treat as stateful if request host is in the list.
     */
    public static function fromFrontend($request): bool
    {
        $domain = $request->headers->get('referer') ?: $request->headers->get('origin');

        if ($domain !== null) {
            $domain = Str::replaceFirst('https://', '', $domain);
            $domain = Str::replaceFirst('http://', '', $domain);
            $domain = Str::endsWith($domain, '/') ? $domain : "{$domain}/";

            $stateful = array_filter(config('sanctum.stateful', []));

            if (Str::is(Collection::make($stateful)->map(function ($uri) use ($request) {
                $uri = $uri === Sanctum::$currentRequestHostPlaceholder ? $request->getHttpHost() : $uri;

                return trim($uri).'/*';
            })->all(), $domain)) {
                return true;
            }
        }

        // Fallback: same-host requests (e.g. page and API both on localhost:8000)
        $host = $request->getHttpHost();
        $stateful = array_filter(config('sanctum.stateful', []));

        foreach ($stateful as $uri) {
            $uri = $uri === Sanctum::$currentRequestHostPlaceholder ? $host : trim($uri);
            if ($uri === $host || $uri === $host.'/*') {
                return true;
            }
            if (Str::is($uri.'/*', $host.'/')) {
                return true;
            }
        }

        return false;
    }
}
