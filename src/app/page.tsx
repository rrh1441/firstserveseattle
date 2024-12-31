// src/app/page.tsx
"use client"

import { useEffect, useState, Suspense } from "react"
import { ExternalLink } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"

// We'll assume Paywall is at "src/app/tennis-courts/components/paywall.tsx"
import Paywall from "./tennis-courts/components/paywall"

// For updating session counts
import { updateUserSession } from "@/lib/updateUserSessions"

// The tennis court list
import TennisCourtList from "./tennis-courts/components/TennisCourtList"

export default function HomePage() {
  const [showPaywall, setShowPaywall] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Generate or retrieve userId from localStorage
    let storedId = localStorage.getItem("userId")
    if (!storedId) {
      storedId = crypto.randomUUID()
      localStorage.setItem("userId", storedId)
      console.log("[page.tsx] New userId created:", storedId)
    } else {
      console.log("[page.tsx] Existing userId found:", storedId)
    }
    setUserId(storedId)
  }, [])

  useEffect(() => {
    // Once userId is known, increment session
    if (!userId) return
    console.log("[page.tsx] Calling updateUserSession with userId:", userId)

    updateUserSession(userId)
      .then(async () => {
        // Check if we should show paywall
        console.log("[page.tsx] updateUserSession done, checking paywall")
        const res = await fetch(`/api/check-paywall?userId=${userId}`)
        const data = await res.json()
        console.log("[page.tsx] /api/check-paywall response:", data)
        if (data?.showPaywall) {
          setShowPaywall(true)
        }
      })
      .catch((err) => {
        console.error("[page.tsx] updateUserSession error:", err)
      })
  }, [userId])

  if (showPaywall) {
    return <Paywall />
  }

  return (
    <div className="container mx-auto px-4 py-6 md:p-4 max-w-4xl bg-white text-black">
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
            <h1 className="text-3xl md:text-4xl font-extrabold mb-1 text-[#0c372b]">
              <span>First Serve</span>{" "}
              <span>Seattle</span>
            </h1>
            <p className="text-base md:text-lg font-semibold">
              Today&#39;s Open Tennis and Pickleball Courts
            </p>
          </div>
        </div>
        <Button variant="outline">Sign In</Button>
      </header>

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

      <footer className="mt-12 border-t pt-6 text-center text-sm">
        <div className="flex justify-center gap-4">
          <a href="/privacy" className="hover:text-black transition-colors">
            Privacy Policy
          </a>
          <a href="/terms" className="hover:text-black transition-colors">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}
