'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/firebase/auth-context';

export default function PWAInstallAfterSignup() {
  const { platform, isLoading } = useNotifications();
  const { justSignedUp, clearJustSignedUp } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isLoading || !justSignedUp) return;

    // Don't show if already installed as PWA
    if (platform.isStandalone) {
      clearJustSignedUp();
      return;
    }

    // Check if user previously dismissed permanently
    const permanentlyDismissed = localStorage.getItem('pwa-install-never-show');
    if (permanentlyDismissed) {
      clearJustSignedUp();
      return;
    }

    // Show prompt after a brief delay
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [platform, isLoading, justSignedUp, clearJustSignedUp]);

  const handleDismiss = () => {
    setShowPrompt(false);
    clearJustSignedUp();
  };

  const handleNeverShow = () => {
    localStorage.setItem('pwa-install-never-show', 'true');
    handleDismiss();
  };

  const handleNext = () => {
    if (platform.isIOS) {
      // iOS has 3 steps
      if (step < 3) {
        setStep(step + 1);
      } else {
        handleDismiss();
      }
    } else {
      // Android/Desktop has 2 steps
      if (step < 2) {
        setStep(step + 1);
      } else {
        handleDismiss();
      }
    }
  };

  const totalSteps = platform.isIOS ? 3 : 2;

  if (!showPrompt) return null;

  // Desktop users
  if (!platform.isIOS && !platform.isAndroid) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#ff7a00] to-[#ff5500] p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Welcome to Try Local!</h2>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/90 text-sm">
                Get the best experience with our mobile app
              </p>
            </div>

            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#ff7a00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Visit on Your Phone
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  For the best experience with notifications and easy access, open <strong>try-local.com</strong> on your iPhone or Android device.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You can then install it as an app on your home screen!
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full mt-6 py-3 px-4 bg-[#ff7a00] hover:bg-[#ff5500] text-white font-medium rounded-xl transition-colors"
              >
                Got it!
              </button>

              <button
                onClick={handleNeverShow}
                className="w-full mt-3 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Don&apos;t show this again
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Mobile users (iOS or Android)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff7a00] to-[#ff5500] p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Welcome to Try Local!</h2>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-white/90 text-sm">
              Install the app for easy access and notifications about orders and local deals!
            </p>
          </div>

          {/* Steps */}
          <div className="p-6">
            {/* Progress indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    s === step
                      ? 'bg-[#ff7a00]'
                      : s < step
                      ? 'bg-[#ff7a00]/50'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {platform.isIOS ? (
                  // iOS Instructions
                  <>
                    {step === 1 && (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#007AFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Step 1: Tap the Share button
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Look for the Share icon at the bottom of your Safari browser (the square with an arrow pointing up)
                        </p>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Step 2: Tap &quot;Add to Home Screen&quot;
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Scroll down in the share menu and tap &quot;Add to Home Screen&quot;
                        </p>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#ff7a00] to-[#ff5500] rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Step 3: Tap &quot;Add&quot; to confirm
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Open Try Local from your home screen to enable notifications and get the full app experience!
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  // Android Instructions
                  <>
                    {step === 1 && (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Step 1: Tap the menu button
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Look for the three dots (⋮) in the top-right corner of Chrome, or tap the install banner if it appears
                        </p>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#ff7a00] to-[#ff5500] rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Step 2: Tap &quot;Install app&quot; or &quot;Add to Home Screen&quot;
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Confirm the installation and Try Local will be added to your home screen with full notification support!
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-4 bg-[#ff7a00] hover:bg-[#ff5500] text-white font-medium rounded-xl transition-colors"
              >
                {step === totalSteps ? 'Got it!' : 'Next'}
              </button>
            </div>

            {/* Skip link */}
            <button
              onClick={handleNeverShow}
              className="w-full mt-4 text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Don&apos;t show this again
            </button>
          </div>

          {/* Bottom indicator for iOS step 1 */}
          {platform.isIOS && step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2"
            >
              <div className="flex flex-col items-center text-[#007AFF]">
                <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
