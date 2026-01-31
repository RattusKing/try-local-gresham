'use client';

import { useEffect, useState, useCallback } from 'react';
import UpdateNotification from './UpdateNotification';

export default function ServiceWorkerRegistration() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Force check for updates
  const checkForUpdates = useCallback(() => {
    if (registration) {
      console.log('[SW] Checking for updates...');
      registration.update().catch(err => {
        console.warn('[SW] Update check failed:', err);
      });
    }
  }, [registration]);

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
          setRegistration(reg);

          // Check immediately on registration
          reg.update();

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('[SW] Update found, installing...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log('[SW] New version ready!');
                  setWaitingServiceWorker(newWorker);
                  setShowUpdateNotification(true);
                }
              });
            }
          });

          // Check for updates very frequently (every 60 seconds)
          const updateInterval = setInterval(() => {
            reg.update();
          }, 60 * 1000); // Every 1 minute

          // Check for updates when page becomes visible
          const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              reg.update();
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);

          // Check for updates on page focus
          const handleFocus = () => {
            reg.update();
          };
          window.addEventListener('focus', handleFocus);

          // Check for updates on online event (when coming back online)
          const handleOnline = () => {
            console.log('[SW] Back online, checking for updates...');
            reg.update();
          };
          window.addEventListener('online', handleOnline);

          // Check if there's already a waiting service worker
          if (reg.waiting) {
            console.log('[SW] Update already waiting');
            setWaitingServiceWorker(reg.waiting);
            setShowUpdateNotification(true);
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
          console.log('[SW] New service worker activated, reloading...');
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingServiceWorker) {
      // Tell the waiting service worker to skip waiting and take over
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateNotification(false);
    }
  };

  const handleDismiss = () => {
    // Still hide the notification but it will reappear on next check
    setShowUpdateNotification(false);

    // Show again after 5 minutes if still not updated
    setTimeout(() => {
      if (waitingServiceWorker) {
        setShowUpdateNotification(true);
      }
    }, 5 * 60 * 1000);
  };

  return (
    <UpdateNotification
      show={showUpdateNotification}
      onUpdate={handleUpdate}
      onDismiss={handleDismiss}
    />
  );
}
