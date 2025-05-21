// src/app/layout.tsx
import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Script from 'next/script'
import SiteFooter from '../components/SiteFooter'
import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata = {
  title: 'First Serve Seattle',
  description: "Today's Open Tennis and Pickleball Courts",
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        {/* Datafast tracking */}
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="67e42faaad4cc8e626767b22"
          data-domain="firstserveseattle.com"
          strategy="afterInteractive"
        />

        {/* Main content */}
        <main className="flex-grow">{children}</main>

        {/* Site-wide footer */}
        <SiteFooter />

        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  )
}
