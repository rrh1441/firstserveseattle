"use client"

import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

// Paywall logic + component
// Make sure this path points to src/app/tennis-courts/components/paywall.tsx
import Paywall from "./tennis-courts/components/paywall"

// The function to increment user views
// (assuming you created updateUserSession in src/lib or similar)
import { updateUserSession } from "@/lib/updateUserSessions"

// Existing tennis court components
// Make sure this path points to src/app/tennis-courts/components/TennisCourtList.tsx
import TennisCourtList from "./tennis-courts/components/TennisCourtList"

export default function TennisCourtsPage() {
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    // Generate or retrieve userId from localStorage
    let userId = localStorage.getItem("userId")
    if (!userId) {
      userId = crypto.randomUUID()
      localStorage.setItem("userId", userId)
    }

    // Increment session count in Supabase
    updateUserSession(userId).then(async () => {
      // Check if we should show the paywall
      const res = await fetch(`/api/check-paywall?userId=${userId}`)
      const data = await res.json()
      if (data?.showPaywall) {
        setShowPaywall(true)
      }
    })
  }, [])

  // If user has exceeded free limit, show paywall
  if (showPaywall) {
    return <Paywall />
  }

  // Otherwise, show normal UI
  return (
    <div className="container mx-auto px-4 py-6 md:p-4 max-w-4xl">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            className="w-20 h-20"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1">
              <span className="text-[#0c372b]">First Serve</span>{" "}
              <span className="text-[#0c372b]">Seattle</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-semibold">
              Today's Open Tennis and Pickleball Courts
            </p>
          </div>
        </div>
        <Button variant="outline">Sign In</Button>
      </header>

      {/* If you have a TennisCourtSearch component somewhere, import & place it here. */}

      <Suspense fallback={<div className="text-center mt-8">Loading courts...</div>}>
        <TennisCourtList />
      </Suspense>

      <div className="mt-8 text-center">
        <Button asChild className="gap-2">
          <a
            href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            For future reservations, book here
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <footer className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4">
          <a href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}
