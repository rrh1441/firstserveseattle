'use client'

import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="py-6 text-center text-xs text-gray-400">
      <p className="mb-2">
        First Serve Seattle is an independent community resource and is not
        associated with Seattle Parks &amp; Recreation.
      </p>

      <nav aria-label="Footer navigation" className="space-x-4">
        <Link
          href="/faq"
          className="underline hover:text-gray-500 transition-colors"
        >
          FAQ
        </Link>
        <span aria-hidden="true">|</span>
        <Link
          href="/contact"
          className="underline hover:text-gray-500 transition-colors"
        >
          Contact
        </Link>
      </nav>
    </footer>
  )
}
