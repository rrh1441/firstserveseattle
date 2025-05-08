// src/app/tennis-courts/components/AboutUs.tsx
'use client' // Needed for useEffect and event handlers

import React, { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X, Info, KeyRound, AlertTriangle } from 'lucide-react'

interface AboutUsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutUs({ isOpen, onClose }: AboutUsProps) {
  /* ------------------------------------------------------------------ */
  /*  Lock body scroll when modal is open                               */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  /* ------------------------------------------------------------------ */
  /*  Modal                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-0 duration-300"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl animate-in zoom-in-95 fade-in-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Close modal"
        >
          <X size={22} />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-block rounded-full bg-green-100 p-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                alt="First Serve Seattle Logo"
                width={48}
                height={48}
                priority
              />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Spend Less Time Searching,
              <br /> More Time Playing!
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Your daily guide to open courts in Seattle.
            </p>
          </div>

          <div className="space-y-6">
            {/* How It Works */}
            <div className="flex items-start gap-3">
              <Info size={20} className="mt-1 flex-shrink-0 text-blue-600" />
              <div>
                <h3 className="mb-1 font-semibold text-gray-800">How It Works</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  First Serve Seattle checks the official Parks reservation system each morning to
                  show you today&apos;s available public tennis and pickleball courts for walk-on
                  play. No more guesswork!
                </p>
              </div>
            </div>

            {/* Availability Key */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
              <div className="mb-3 flex items-center gap-2">
                <KeyRound size={18} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Availability Key</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="mr-2 h-3.5 w-3.5 flex-shrink-0 rounded-full border border-green-600/50 bg-green-500"></span>
                  <span className="w-16 font-medium text-gray-700">Green:</span>
                  <span className="text-gray-600">Fully Available</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 h-3.5 w-3.5 flex-shrink-0 rounded-full border border-orange-500/50 bg-orange-400"></span>
                  <span className="w-16 font-medium text-gray-700">Orange:</span>
                  <span className="text-gray-600">Partially Available</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 h-3.5 w-3.5 flex-shrink-0 rounded-full border border-gray-500/50 bg-gray-400"></span>
                  <span className="w-16 font-medium text-gray-700">Gray:</span>
                  <span className="text-gray-600">Fully Reserved</span>
                </div>
              </div>
              <p className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-500">
                Availability is based on schedule data checked this morning. Real-time court
                status may vary due to recent bookings or walk-ons.
              </p>
            </div>

            {/* Booking Ahead */}
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="mt-1 flex-shrink-0 text-orange-600"
              />
              <div>
                <h3 className="mb-1 font-semibold text-gray-800">Booking Ahead?</h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  This app shows <span className="font-medium">today&apos;s</span>
                  &nbsp;walk-on potential. To reserve courts for future dates, please use the
                  official&nbsp;
                  <a
                    href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Seattle Parks Reservation Site
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* SPR disclaimer */}
            <p className="mt-6 text-center text-xs text-gray-500">
              First&nbsp;Serve&nbsp;Seattle is an independent community resource and is not
              associated with Seattle Parks&nbsp;&amp;&nbsp;Recreation.
            </p>
          </div>
        </div>

        {/* Modal footer / CTA */}
        <div className="mt-auto border-t border-gray-200 bg-gray-50 p-6 pt-4">
          <Button
            onClick={() => (window.location.href = '/signup')}
            className="w-full bg-[#0c372b] px-6 py-3 text-base font-semibold text-white hover:bg-[#0c372b]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Get Unlimited Court Checks
          </Button>
        </div>
      </div>
    </div>
  )
}
