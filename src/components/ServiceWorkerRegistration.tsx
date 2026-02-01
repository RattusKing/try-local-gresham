'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegistration() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registered');

          // Check for updates immediately on page load
          reg.update();

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('[SW] Update found, installing...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available - auto-activate it
                    console.log('[SW] New version ready, auto-activating...');
                    setUpdating(true);
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    // First install
                    console.log('[SW] Service worker installed for the first time');
                  }
                }
              });
            }
          });

          // Check for updates frequently (every 30 seconds)
          const updateInterval = setInterval(() => {
            reg.update().catch(() => {});
          }, 30 * 1000);

          // Check for updates when page becomes visible
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Check for updates on page focus
          const handleFocus = () => {
            reg.update().catch(() => {});
          };
          window.addEventListener('focus', handleFocus);

          // Check for updates when coming back online
          const handleOnline = () => {
            console.log('[SW] Back online, checking for updates...');
            reg.update().catch(() => {});
          };
          window.addEventListener('online', handleOnline);

          // If there's already a waiting service worker, activate it immediately
          if (reg.waiting) {
            console.log('[SW] Update already waiting, auto-activating...');
            setUpdating(true);
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Cleanup on unmount
          return () => {
            clearInterval(updateInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('online', handleOnline);
          };
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });

      // Listen for controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[SW] New service worker activated, reloading page...');
          // Brief delay to show updating message, then reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('[SW] Received update notification:', event.data.version);
        }
      });
    }
  }, []);

  // Show a brief updating indicator
  if (updating) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, var(--primary, #99edc3), var(--secondary, #c2aff0))',
          color: 'var(--dark, #373737)',
          padding: '0.75rem',
          textAlign: 'center',
          zIndex: 99999,
          fontWeight: 600,
          fontSize: '0.875rem',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
        Updating app... Please wait
      </div>
    );
  }

  return null;
}
