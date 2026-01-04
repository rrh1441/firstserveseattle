"use client";

import { useState } from "react";
import { MapIcon, Bell } from "lucide-react";
import { useSwipeable } from "react-swipeable";

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupNotifications: () => void;
}

export default function WalkthroughModal({
  isOpen,
  onClose,
  onSetupNotifications,
}: WalkthroughModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const handleSkip = () => {
    localStorage.setItem("fss_walkthrough_v2", "seen");
    onClose();
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleSetupNotifications = () => {
    localStorage.setItem("fss_walkthrough_v2", "seen");
    onSetupNotifications();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => step === 1 && setStep(2),
    onSwipedRight: () => step === 2 && setStep(1),
    onSwipedDown: () => handleSkip(),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop - no click to close */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal content */}
      <div
        {...swipeHandlers}
        className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-slide-up"
      >
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <MapIcon size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Welcome to the New First Serve
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;ve redesigned the app with a new map view. Tap any pin to see
              real-time court availability.
            </p>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="w-2 h-2 rounded-full bg-gray-300" />
            </div>

            {/* Actions */}
            <button
              onClick={handleNext}
              className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors mb-3"
            >
              Next
            </button>
            <button
              onClick={handleSkip}
              className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
          </div>
        )}

        {/* Step 2: Get Notified */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Never Miss an Open Court
            </h2>
            <p className="text-gray-600 mb-6">
              Get daily email alerts when your favorite courts have openings.
            </p>

            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            {/* Actions */}
            <button
              onClick={handleSetupNotifications}
              className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors mb-3"
            >
              Set Up Notifications
            </button>
            <button
              onClick={handleSkip}
              className="text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
