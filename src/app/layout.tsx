/* -------------------------------------------------------------------------- */
/*  src/app/layout.tsx                                                        */
/*  - Force-unregister any legacy service-worker (before React or SW caches)  */
/*  - Run anonymous-ID and localStorage repair boot-straps                    */
/* -------------------------------------------------------------------------- */

import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

import SiteFooter from '../components/SiteFooter';
import ClientIdsInit from '../components/ClientIdsInit';
import ClientStorageInit from '../components/ClientStorageInit';

import './globals.css';

export const metadata = {
  title: 'First Serve Seattle',
  description: "Today's Open Tennis and Pickleball Courts",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* ---------------------------------------------------------------- */}
        {/*  HARD KILL: unregister any existing SW, then register a dummy one */}
        {/*  and immediately unregister it; guarantees full removal even if  */}
        {/*  a previous SW blocked getRegistrations().                        */}
        {/* ---------------------------------------------------------------- */}
        <Script id="sw-kill" strategy="beforeInteractive">
          {`
            if ('serviceWorker' in navigator) {
              // 1. Unregister any current SWs we can see
              navigator.serviceWorker.getRegistrations()
                .then(regs => regs.forEach(r => r.unregister()))
                .catch(() => {});

              // 2. Register a no-op worker, then immediately unregister it.
              //    This removes controllers the firstRegistrations call can't reach.
              navigator.serviceWorker
                .register('/sw-kill.js', { scope: '/' })
                .then(r => r.unregister())
                .catch(() => {});
            }
          `}
        </Script>
      </head>

      <body className="flex min-h-screen flex-col">
        {/* ---------- client boot-straps ---------------------------------- */}
        <ClientIdsInit />
        <ClientStorageInit />

        {/* ---------- 3rd-party analytics -------------------------------- */}
        <Script
          src="https://datafa.st/js/script.js"
          data-website-id="67e42faaad4cc8e626767b22"
          data-domain="firstserveseattle.com"
          strategy="afterInteractive"
        />

        {/* ---------- Main content --------------------------------------- */}
        <main className="flex-grow">{children}</main>

        {/* ---------- Footer & Vercel analytics -------------------------- */}
        <SiteFooter />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}