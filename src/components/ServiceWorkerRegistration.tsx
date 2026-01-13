'use client';

import { useEffect, useState } from 'react';
import UpdateNotification from './UpdateNotification';

export default function ServiceWorkerRegistration() {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [waitingServiceWorker, setWaitingServiceWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log('New service worker available!');
                  setWaitingServiceWorker(newWorker);
                  setShowUpdateNotification(true);
                }
              });
            }
          });

          // Check for updates more frequently (every 10 minutes)
          setInterval(() => {
            registration.update();
          }, 10 * 60 * 1000); // Check every 10 minutes

          // Check for updates when page becomes visible
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              registration.update();
            }
          });

          // Check for updates on page focus
          window.addEventListener('focus', () => {
            registration.update();
          });

          // Check if there's already a waiting service worker
          if (registration.waiting) {
            setWaitingServiceWorker(registration.waiting);
            setShowUpdateNotification(true);
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for controller change (when new SW takes over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
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
    setShowUpdateNotification(false);
  };

  return (
    <UpdateNotification
      show={showUpdateNotification}
      onUpdate={handleUpdate}
      onDismiss={handleDismiss}
    />
  );
}
