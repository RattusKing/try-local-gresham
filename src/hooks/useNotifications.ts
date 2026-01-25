'use client';

import { useState, useEffect, useCallback } from 'react';

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
  requestPermission: () => Promise<NotificationPermissionState>;
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

  useEffect(() => {
    const info = getPlatformInfo();
    setPlatform(info);

    if (!info.supportsNotifications) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission as NotificationPermissionState);
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

  const sendTestNotification = useCallback(() => {
    if (permission !== 'granted') return;

    // Try using service worker for notification (more reliable)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Try Local Gresham', {
          body: 'Notifications are working! You\'ll receive updates about local businesses.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test-notification',
        });
      });
    } else {
      // Fallback to Notification API
      new Notification('Try Local Gresham', {
        body: 'Notifications are working! You\'ll receive updates about local businesses.',
        icon: '/icon-192x192.png',
      });
    }
  }, [permission]);

  return {
    permission,
    platform,
    isLoading,
    requestPermission,
    sendTestNotification,
  };
}
