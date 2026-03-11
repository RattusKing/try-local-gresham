'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

const SW_RELOAD_KEY = 'sw-last-reload';
const SW_VERSION_KEY = 'sw-known-version';
// Only allow one SW-triggered reload per 60 seconds to prevent loops
const RELOAD_COOLDOWN_MS = 60 * 1000;

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
          logger.log('[SW] Service Worker registered');

          // Check for updates immediately on page load
          reg.update();

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            logger.log('[SW] Update found, installing...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available - auto-activate it
                    logger.log('[SW] New version ready, auto-activating...');
                    setUpdating(true);
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  } else {
                    // First install
                    logger.log('[SW] Service worker installed for the first time');
                  }
                }
              });
            }
          });

          // Check for updates every 5 minutes (not 30 seconds)
          const updateInterval = setInterval(() => {
            reg.update().catch(() => {});
          }, 5 * 60 * 1000);

          // Check for updates when page becomes visible
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Check for updates when coming back online
          const handleOnline = () => {
            logger.log('[SW] Back online, checking for updates...');
            reg.update().catch(() => {});
          };
          window.addEventListener('online', handleOnline);

          // If there's already a waiting service worker, activate it immediately
          if (reg.waiting) {
            logger.log('[SW] Update already waiting, auto-activating...');
            setUpdating(true);
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // Cleanup on unmount
          return () => {
            clearInterval(updateInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
          };
        })
        .catch((error) => {
          logger.error('[SW] Registration failed:', error);
        });

      // Listen for controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;

        // Reload guard: prevent infinite reload loops
        const lastReload = sessionStorage.getItem(SW_RELOAD_KEY);
        const now = Date.now();
        if (lastReload && now - Number(lastReload) < RELOAD_COOLDOWN_MS) {
          logger.log('[SW] Skipping reload — already reloaded recently');
          return;
        }

        refreshing = true;
        logger.log('[SW] New service worker activated, reloading page...');
        sessionStorage.setItem(SW_RELOAD_KEY, String(now));
        setTimeout(() => {
          window.location.reload();
        }, 500);
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          const newVersion = event.data.version;
          const knownVersion = localStorage.getItem(SW_VERSION_KEY);
          logger.log('[SW] Received update notification:', newVersion);

          // Only treat it as a real update if the version actually changed
          if (knownVersion === newVersion) {
            logger.log('[SW] Same version as before, skipping reload');
            setUpdating(false);
            return;
          }

          localStorage.setItem(SW_VERSION_KEY, newVersion);
          logger.log('[SW] New version confirmed:', newVersion);
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
