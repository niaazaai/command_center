import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Fixed-width mini sidebar (not expandable). Nav links first, theme toggle at bottom left.
 */
export function MiniSidebar({ className, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col flex-shrink-0 w-14 border-r border-border bg-background py-3 items-center gap-1 min-h-0',
        className
      )}
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        {children}
      </div>
      <div className="mt-auto pt-2 flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </aside>
  );
}
