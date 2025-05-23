/* -------------------------------------------------------------------------- */
/*  src/app/layout.tsx                                                        */
/*  – Unregisters any legacy service-worker before React loads                */
/*  – Bootstraps anonymous-ID and localStorage repair                         */
/* -------------------------------------------------------------------------- */

import type { ReactNode } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'

import SiteFooter from '../components/SiteFooter'
import ClientIdsInit from '../components/ClientIdsInit'
import ClientStorageInit from '../components/ClientStorageInit'

import './globals.css'

export const metadata = {
  title      : 'First Serve Seattle',
  description: "Today's Open Tennis and Pickleball Courts",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* --- one-time SW cleanup: removes stale service-worker that      */}
        {/*     caused blank screens for returning visitors                 */}
        <Script id="sw-sunset" strategy="beforeInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations()
                .then(regs => regs.forEach(r => r.unregister()))
                .catch(() => {});
            }
          `}
        </Script>
      </head>

      <body className="flex min-h-screen flex-col">
        {/* client-side boot-strap */}
        <ClientIdsInit />
        <ClientStorageInit />

        {/* Datafast tracking */}
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="67e42faaad4cc8e626767b22"
          data-domain="firstserveseattle.com"
          strategy="afterInteractive"
        />

        {/* Main content */}
        <main className="flex-grow">{children}</main>

        {/* Footer & analytics */}
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}