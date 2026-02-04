import React from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

/**
 * Logo placeholder. To use your own logo:
 * 1. Add your logo file to public/ (e.g. public/logo.svg)
 * 2. Replace the inner content with: <img src="/logo.svg" alt="Command Center" className="h-8 w-auto" />
 */
export function Logo({ className }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 flex-shrink-0 no-underline text-foreground', className)}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
        CC
      </div>
      <span className="font-semibold hidden sm:inline">Command Center</span>
    </Link>
  );
}
