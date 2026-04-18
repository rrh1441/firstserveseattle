import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seattle Tennis Courts - All Locations | First Serve Seattle',
  description:
    'Browse all 100+ public tennis and pickleball courts in Seattle. Find courts by neighborhood, see amenities like lights and hitting walls, and discover which courts have availability today.',
  keywords:
    'seattle tennis courts, public tennis courts seattle, tennis courts near me, seattle pickleball courts, free tennis courts, walk-on tennis seattle',
  openGraph: {
    title: 'Seattle Tennis Courts - All Locations | First Serve Seattle',
    description:
      'Browse all 100+ public tennis and pickleball courts in Seattle. Find courts by neighborhood with lights, hitting walls, and more.',
    url: 'https://www.firstserveseattle.com/courts',
    siteName: 'First Serve Seattle',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seattle Tennis Courts - All Locations',
    description:
      'Browse all 100+ public tennis and pickleball courts in Seattle. Find courts by neighborhood.',
  },
  alternates: {
    canonical: '/courts',
  },
};

export default function CourtsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
