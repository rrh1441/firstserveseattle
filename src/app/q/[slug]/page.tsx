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
/* Helper to convert slug to potential court name */
/* ------------------------------------------------------------------ */
function slugToCourtName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/* ------------------------------------------------------------------ */
/* Handler */
/* ------------------------------------------------------------------ */
export default async function QRRedirect({ params }: QRProps) {
  /* 0️⃣ Await the params promise */
  const { slug } = await params
  
  let facilityTitle: string | null = null
  let facilityId: number | null = null

  /* 1️⃣ Try tennis_facilities table first */
  const { data: facility } = await supabase
    .from('tennis_facilities')
    .select('id, facility_name')
    .eq('slug', slug)
    .maybeSingle()

  if (facility) {
    facilityTitle = facility.facility_name
    facilityId = facility.id
    console.log(`🎾 Found facility in tennis_facilities: ${facilityTitle}`)
  } else {
    /* 2️⃣ Fallback: try to find in tennis_courts by converting slug to name */
    const potentialName = slugToCourtName(slug)
    console.log(`🔍 Searching tennis_courts for: ${potentialName}`)
    
    const { data: court } = await supabase
      .from('tennis_courts')
      .select('id, title')
      .ilike('title', `%${potentialName}%`)
      .maybeSingle()

    if (court) {
      facilityTitle = court.title
      facilityId = court.id
      console.log(`🎾 Found court in tennis_courts: ${facilityTitle}`)
    }
  }

  /* 3️⃣ Record the scan (ignore failure so redirect is never blocked) */
  if (facilityId) {
    const hdr = await headers()
    try {
      await supabase
        .from('qr_scans')
        .insert({
          facility_id: facilityId,
          user_agent: hdr.get('user-agent') ?? null,
          referer: hdr.get('referer') ?? null,
        })
    } catch {
      // swallow DB errors - don't block redirect
    }
  }

  /* 4️⃣ Redirect with court name filter */
  const baseUrl = 'https://firstserveseattle.com'
  
  if (facilityTitle) {
    // Redirect with court name as search parameter
    const courtParam = encodeURIComponent(facilityTitle)
    console.log(`🎾 QR scan for ${facilityTitle}, redirecting with filter`)
    redirect(`${baseUrl}?court=${courtParam}`)
  } else {
    // Fallback to main page if no facility found
    console.log(`❓ QR scan for unknown facility ${slug}, regular redirect`)
    redirect(baseUrl)
  }
}