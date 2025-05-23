// public/sw-kill.js
// This file is intentionally empty or minimal.
// Its purpose is just to exist so it can be registered and then unregistered
// by the <Script id="sw-kill" strategy="beforeInteractive"> in layout.tsx.
// It helps ensure all service workers are fully removed.
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', () => { self.clients.claim(); });