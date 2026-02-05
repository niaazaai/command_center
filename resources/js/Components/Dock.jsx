import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Home, ListTodo, Bell, StickyNote, Lightbulb, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/todos', icon: ListTodo, label: 'Todos' },
  { href: '/reminders', icon: Bell, label: 'Reminders' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
  { href: '/ideas', icon: Lightbulb, label: 'Ideas' },
];

function DockItem({ href, icon: Icon, label, isActive, onClick, children }) {
  const [showLabel, setShowLabel] = useState(false);
  const content = (
    <>
      <div className="flex items-center justify-center w-full h-full rounded-lg">
        <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
      </div>
      {showLabel && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap bg-popover border border-border text-popover-foreground shadow-md pointer-events-none z-50"
          role="tooltip"
        >
          {label}
        </span>
      )}
    </>
  );

  const baseClass =
    'relative flex items-center justify-center rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  const sizeClass = 'w-12 h-12 min-w-12 min-h-12 hover:scale-110 hover:z-10 active:scale-95';

  if (href !== undefined) {
    return (
      <Link
        href={href}
        onClick={onClick}
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
        onFocus={() => setShowLabel(true)}
        onBlur={() => setShowLabel(false)}
        className={cn(baseClass, sizeClass, isActive && 'bg-primary/15 border-primary/40 text-primary')}
        aria-label={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setShowLabel(true)}
      onMouseLeave={() => setShowLabel(false)}
      onFocus={() => setShowLabel(true)}
      onBlur={() => setShowLabel(false)}
      className={cn(baseClass, sizeClass)}
      aria-label={label}
    >
      {content}
    </button>
  );
}

export function Dock({ className }) {
  const page = usePage();
  const currentPath = page.url?.split('?')[0] || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={cn('fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-40', className)}
    >
      <nav
        className="pointer-events-auto flex items-end gap-2 px-3 py-2.5 rounded-2xl border border-border bg-background/90 backdrop-blur-md shadow-xl"
        role="toolbar"
        aria-label="App dock"
      >
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <DockItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={currentPath === href || (href !== '/' && currentPath.startsWith(href))}
          />
        ))}
        <div className="w-px h-8 bg-border shrink-0" aria-hidden />
        <DockItem
          icon={theme === 'dark' ? Sun : Moon}
          label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />
      </nav>
    </div>
  );
}
