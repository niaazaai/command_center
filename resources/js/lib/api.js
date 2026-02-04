import { router } from '@inertiajs/react';

const API_BASE = '/api';

function getCsrfToken() {
  if (typeof document === 'undefined') return null;
  // Prefer XSRF-TOKEN cookie (set by Laravel); survives Inertia client-side navigation
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch (_) {
      // fall through to meta
    }
  }
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };
  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-XSRF-TOKEN'] = csrf;
  }
  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.visit('/login');
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
