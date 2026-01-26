'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/firebase/auth-context';

export default function NotificationPrompt() {
  const { permission, platform, isLoading, requestPermission, subscribeToPush, sendTestNotification } = useNotifications();
  const { user, userProfile } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Don't show for iOS (handled by IOSInstallPrompt) or if already granted/denied
    if (platform.isIOS || permission === 'granted' || permission === 'denied' || permission === 'unsupported') {
      return;
    }

    // Don't show if notifications aren't supported
    if (!platform.supportsNotifications) {
      return;
    }

    // Check if user previously dismissed
    const dismissedAt = localStorage.getItem('notification-prompt-dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 3) {
        return;
      }
    }

    // Show prompt after a delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [platform, permission, isLoading]);

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        // Subscribe to push notifications if user is logged in
        if (user && userProfile) {
          const userType = userProfile.role === 'business_owner' ? 'business_owner' : 'customer';
          const businessId = userProfile.businessId;
          await subscribeToPush(user.uid, userType, businessId);
        }

        // Send a test notification to confirm it's working
        setTimeout(() => {
          sendTestNotification();
        }, 500);
        setShowPrompt(false);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header strip */}
          <div className="h-1 bg-gradient-to-r from-[#ff7a00] to-[#ff5500]" />

          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Bell icon */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#ff7a00] to-[#ff5500] rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Stay Updated
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Get notified about new local deals, business updates, and community events in Gresham!
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleEnable}
                    disabled={isRequesting}
                    className="flex-1 bg-[#ff7a00] hover:bg-[#ff5500] disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {isRequesting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enabling...
                      </>
                    ) : (
                      'Enable Notifications'
                    )}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors duration-200"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
