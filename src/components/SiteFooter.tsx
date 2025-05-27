// src/components/SiteFooter.tsx
'use client'

import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t py-8 text-center text-xs text-gray-400">
      <nav
        aria-label="Footer navigation"
        className="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-700"
      >
        <Link href="/privacy-policy" className="underline hover:text-gray-500">
          Privacy Policy
        </Link>
        <span aria-hidden="true">|</span>

        <Link href="/terms-of-service" className="underline hover:text-gray-500">
          Terms of Service
        </Link>
        <span aria-hidden="true">|</span>

        <Link href="/faq" className="underline hover:text-gray-500">
          FAQ
        </Link>
        <span aria-hidden="true">|</span>

        <Link href="/contact" className="underline hover:text-gray-500">
          Contact
        </Link>
        <span aria-hidden="true">|</span>

        <Link href="/login" className="underline hover:text-gray-500">
          Sign In
        </Link>
        <span aria-hidden="true">|</span>

        <Link href="/signup" className="underline hover:text-gray-500">
          Sign Up
        </Link>
      </nav>

      <p className="mb-1">
        First&nbsp;Serve&nbsp;Seattle is an independent community resource and
        is not associated with Seattle Parks&nbsp;&amp;&nbsp;Recreation.
      </p>
      <p>&copy; {new Date().getFullYear()} Simple Apps LLC.</p>
    </footer>
  )
}
