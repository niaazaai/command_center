import React from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export function Logo({ className }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2 flex-shrink-0 no-underline text-foreground', className)}>
      <img src="/main-logo.svg" alt="" className="h-8 w-8 shrink-0" aria-hidden />
      <span className="font-semibold hidden sm:inline">Command Center</span>
    </Link>
  );
}
