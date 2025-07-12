"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const postHogKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY
    console.log('PostHog Key:', postHogKey ? 'Found' : 'Missing')

    if (!postHogKey) {
      console.warn('NEXT_PUBLIC_POSTHOG_API_KEY is not set!')
      return
    }

    posthog.init(postHogKey, {
      api_host: "https://us.i.posthog.com",
      ui_host: "https://us.posthog.com", 
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
      loaded: (posthog) => {
        console.log('PostHog loaded successfully')
        if (process.env.NODE_ENV === 'development') {
          posthog.debug()
        }
      }
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}