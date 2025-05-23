/* -------------------------------------------------------------------------- */
/*  src/app/layout.tsx                                                        */
/*  Adds <ClientStorageInit /> so every visit runs initLocalStorage(),        */
/*  repairing corrupted localStorage keys before the rest of the UI mounts.   */
/* -------------------------------------------------------------------------- */

import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

import SiteFooter      from '../components/SiteFooter'
import ClientIdsInit   from '../components/ClientIdsInit'
import ClientStorageInit from '../components/ClientStorageInit'   // ← NEW

import './globals.css'

export const metadata = {
  title      : 'First Serve Seattle',
  description: "Today's Open Tennis and Pickleball Courts",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="flex min-h-screen flex-col">
        {/* --- client-side boot-straps ----------------------------------- */}
        <ClientIdsInit />        {/* ensures anonymous userId */}
        <ClientStorageInit />    {/* repairs / versions localStorage */}

        {/* --- Datafast tracking ---------------------------------------- */}
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="67e42faaad4cc8e626767b22"
          data-domain="firstserveseattle.com"
          strategy="afterInteractive"
        />

        {/* --- Main content --------------------------------------------- */}
        <main className="flex-grow">{children}</main>

        {/* --- Site-wide footer & analytics ----------------------------- */}
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}