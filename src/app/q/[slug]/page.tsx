/** @file /q/[slug]/page.tsx — record scan then redirect immediately */
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

/* ------------------------------------------------------------------ */
/* Updated props type for Next.js 15 */
/* ------------------------------------------------------------------ */
type QRProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic' // always server-render

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side key
)

/* ------------------------------------------------------------------ */
/* Handler */
/* ------------------------------------------------------------------ */
export default async function QRRedirect({ params }: QRProps) {
  /* 0️⃣ Await the params promise */
  const { slug } = await params
  
  /* 1️⃣ Look up facility details */
  const { data: facility } = await supabase
    .from('tennis_facilities')
    .select('id, title')
    .eq('slug', slug)
    .single()

  /* 2️⃣ Record the scan (ignore failure so redirect is never blocked) */
  if (facility) {
    const hdr = await headers()
    try {
      await supabase
        .from('qr_scans')
        .insert({
          facility_id: facility.id,
          user_agent: hdr.get('user-agent') ?? null,
          referer: hdr.get('referer') ?? null,
        })
    } catch {
      // swallow DB errors - don't block redirect
    }
  }

  /* 3️⃣ Redirect with court name filter */
  const baseUrl = 'https://firstserveseattle.com'
  
  if (facility?.title) {
    // Redirect with court name as search parameter
    const courtParam = encodeURIComponent(facility.title)
    console.log(`🎾 QR scan for ${facility.title}, redirecting with filter`)
    redirect(`${baseUrl}?court=${courtParam}`)
  } else {
    // Fallback to regular redirect if no facility found
    console.log(`❓ QR scan for unknown facility ${slug}, regular redirect`)
    redirect(baseUrl)
  }
}