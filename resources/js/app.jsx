import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

createInertiaApp({
  title: (title) => (title ? `${title} - Command Center` : 'Command Center'),
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx');
    const page = pages[`./Pages/${name}.jsx`];
    if (!page) throw new Error(`Page ${name} not found`);
    return page();
  },
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(
      <ThemeProvider>
        <ToastProvider>
          <App {...props} />
        </ToastProvider>
      </ThemeProvider>
    );
  },
});
