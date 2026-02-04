import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  const add = useCallback((message, type = 'success') => {
    const id = ++nextIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  const toast = useCallback(
    {
      success: (msg) => add(msg, 'success'),
      error: (msg) => add(msg, 'error'),
    },
    [add]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-[360px] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all',
              t.type === 'success' &&
                'border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-200 dark:bg-green-950/80',
              t.type === 'error' &&
                'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200 dark:bg-red-950/80'
            )}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            )}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
