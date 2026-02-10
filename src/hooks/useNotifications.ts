'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export interface PlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isStandalone: boolean;
  supportsNotifications: boolean;
  supportsPush: boolean;
}

export interface UseNotificationsReturn {
  permission: NotificationPermissionState;
  platform: PlatformInfo;
  isLoading: boolean;
  isSubscribed: boolean;
  requestPermission: () => Promise<NotificationPermissionState>;
  subscribeToPush: (userId: string, userType: 'customer' | 'business_owner', businessId?: string) => Promise<boolean>;
  unsubscribeFromPush: (userId: string) => Promise<boolean>;
  sendTestNotification: () => void;
}

function getPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isSafari: false,
      isStandalone: false,
      supportsNotifications: false,
      supportsPush: false,
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|chromium|crios|fxios|edgios/.test(ua);

  // Check if running as installed PWA (standalone mode)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  const supportsNotifications = 'Notification' in window;
  const supportsPush = 'PushManager' in window && 'serviceWorker' in navigator;

  return {
    isIOS,
    isAndroid,
    isSafari,
    isStandalone,
    supportsNotifications,
    supportsPush,
  };
}

// Convert base64 string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [platform, setPlatform] = useState<PlatformInfo>({
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isStandalone: false,
    supportsNotifications: false,
    supportsPush: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const info = getPlatformInfo();
    setPlatform(info);

    if (!info.supportsNotifications) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission as NotificationPermissionState);
    }

    // Check if already subscribed to push
    if (info.supportsPush && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      });
    }

    setIsLoading(false);
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (!platform.supportsNotifications) {
      return 'unsupported';
    }

    // iOS requires the app to be installed as PWA first
    if (platform.isIOS && !platform.isStandalone) {
      return 'default'; // Can't request permission if not installed
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);
      return result as NotificationPermissionState;
    } catch {
      // Fallback for older browsers
      return new Promise((resolve) => {
        Notification.requestPermission((result) => {
          setPermission(result as NotificationPermissionState);
          resolve(result as NotificationPermissionState);
        });
      });
    }
  }, [platform]);

  const subscribeToPush = useCallback(async (
    userId: string,
    userType: 'customer' | 'business_owner',
    businessId?: string
  ): Promise<boolean> => {
    if (!platform.supportsPush || permission !== 'granted') {
      logger.warn('Push not supported or permission not granted');
      return false;
    }

    try {
      // Get VAPID public key from server
      const keyResponse = await fetch('/api/push/subscribe');
      if (!keyResponse.ok) {
        logger.error('Failed to get VAPID public key');
        return false;
      }
      const { publicKey } = await keyResponse.json();

      if (!publicKey) {
        logger.error('VAPID public key not configured');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
          userType,
          businessId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }

      setIsSubscribed(true);
      return true;
    } catch (error) {
      logger.error('Failed to subscribe to push:', error);
      return false;
    }
  }, [platform, permission]);

  const unsubscribeFromPush = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            userId,
          }),
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe from push:', error);
      return false;
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    if (permission !== 'granted') return;

    // Try using service worker for notification (more reliable)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Try Local Gresham', {
          body: 'Notifications are working! You\'ll receive updates about orders and local businesses.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test-notification',
        });
      });
    } else {
      // Fallback to Notification API
      new Notification('Try Local Gresham', {
        body: 'Notifications are working! You\'ll receive updates about orders and local businesses.',
        icon: '/icon-192x192.png',
      });
    }
  }, [permission]);

  return {
    permission,
    platform,
    isLoading,
    isSubscribed,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
  };
}
