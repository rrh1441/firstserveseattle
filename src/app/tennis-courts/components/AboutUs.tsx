// src/app/tennis-courts/components/AboutUs.tsx
"use client"; // Needed for useEffect and event handlers

import React, { useEffect } from 'react';
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Adjust path if needed
import { X, Info, KeyRound, AlertTriangle } from "lucide-react"; // Keep imports needed here

interface AboutUsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutUs({ isOpen, onClose }: AboutUsProps) {

  // Effect to handle body scroll lock when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset overflow when component unmounts or isOpen changes
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Don't render the modal if it's not open
  if (!isOpen) return null;

  // Modal JSX
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={onClose} // Close when clicking overlay
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 animate-in zoom-in-95 fade-in-0 duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Close Button */}
        <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={22} /> {/* X is used here */}
          </button>
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 sm:p-8">
            <div className="text-center mb-6">
                <div className="inline-block p-2 bg-green-100 rounded-full mb-3">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                      alt="First Serve Seattle Logo"
                      width={48}
                      height={48}
                      priority
                    />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                    Spend Less Time Searching, <br /> More Time Playing!
                </h2>
                <p className="mt-2 text-base text-gray-600">
                    Your daily guide to open courts in Seattle.
                </p>
            </div>
            <div className="space-y-6">
                {/* How It Works */}
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-blue-600"> <Info size={20} /> </div>{/* Info is used here */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">How It Works</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {/* LINT FIX: Replaced ' with &apos; */}
                            First Serve Seattle checks the official Parks reservation system each morning to show you today&apos;s available public tennis and pickleball courts for walk-on play. No more guesswork!
                        </p>
                    </div>
                </div>
                {/* Availability Key */}
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <KeyRound size={18} className="text-gray-600" /> {/* KeyRound is used here */}
                        <h3 className="font-semibold text-gray-800">Availability Key</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                        {/* Key items... */}
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-green-600/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Green:</span>
                            <span className="text-gray-600">Fully Available</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-orange-400 border border-orange-500/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Orange:</span>
                            <span className="text-gray-600">Partially Available</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-3.5 h-3.5 rounded-full bg-gray-400 border border-gray-500/50 mr-2 flex-shrink-0"></span>
                            <span className="font-medium text-gray-700 w-16">Gray:</span>
                            <span className="text-gray-600">Fully Reserved</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                        Availability based on schedule data checked this morning. Real-time court status may vary due to recent bookings or walk-ons.
                    </p>
                </div>
                 {/* Booking Ahead */}
                 <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1 text-orange-600"> <AlertTriangle size={20} /> </div> {/* AlertTriangle is used here */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Booking Ahead?</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {/* LINT FIX: Replaced ' with &apos; */}
                            This app shows <span className="font-medium">today&apos;s</span> walk-on potential. To reserve courts for future dates, please use the official{" "}
                            <a href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                                Seattle Parks Reservation Site
                            </a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        {/* Modal Footer */}
        <div className="p-6 pt-4 bg-gray-50 border-t border-gray-200 mt-auto">
            <Button
                onClick={() => window.location.href = "/signup"}
                className="w-full bg-[#0c372b] text-white hover:bg-[#0c372b]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 px-6 py-3 text-base font-semibold"
            >
                Get Unlimited Court Checks
            </Button>
        </div>
      </div>
    </div>
  );
}