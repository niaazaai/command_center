import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { ListTodo, StickyNote, Lightbulb, Menu, PanelLeftClose, PanelLeft, Home, Bell } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Sidebar } from './Sidebar';
import { Logo } from './Logo';
import { MiniSidebar } from './MiniSidebar';

export function Layout({ children }) {
  const page = usePage();
  const user = page.props.auth?.user;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const currentPath = page.url?.split('?')[0] || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const logout = () => router.post('/logout');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between p-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((o) => !o)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="font-semibold">Command Center</span>
        <div className="w-10" />
      </header>

      <MiniSidebar>
        <Link href="/">
          <Button variant={currentPath === '/' ? 'secondary' : 'ghost'} size="icon" title="Home">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/todos">
          <Button variant={currentPath === '/todos' ? 'secondary' : 'ghost'} size="icon" title="Todos">
            <ListTodo className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/reminders">
          <Button variant={currentPath === '/reminders' ? 'secondary' : 'ghost'} size="icon" title="Reminders">
            <Bell className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/notes">
          <Button variant={currentPath === '/notes' ? 'secondary' : 'ghost'} size="icon" title="Notes">
            <StickyNote className="h-5 w-5" />
          </Button>
        </Link>
        <Link href="/ideas">
          <Button variant={currentPath === '/ideas' ? 'secondary' : 'ghost'} size="icon" title="Ideas">
            <Lightbulb className="h-5 w-5" />
          </Button>
        </Link>
      </MiniSidebar>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        minimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized((m) => !m)}
        className={cn(
          'w-full flex-shrink-0 border-r border-border bg-card flex flex-col transition-[width] duration-200',
          sidebarOpen ? 'block md:flex' : 'hidden md:flex',
          sidebarMinimized ? 'md:w-16' : 'md:w-72'
        )}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <nav className="flex items-center gap-2 sm:gap-3 px-3 py-2 border-b border-border bg-card min-h-12">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex flex-shrink-0"
            onClick={() => setSidebarMinimized((m) => !m)}
            title={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            {sidebarMinimized ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>
          <Logo />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-[140px]">
              {user?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </nav>

        <main className="flex-1 p-3 md:p-4 overflow-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
