/** @file /q/[slug]/page.tsx — record scan then redirect immediately */
import { createClient } from '@supabase/supabase-js'
import { redirect }     from 'next/navigation'
import { headers }      from 'next/headers'

/* ------------------------------------------------------------------ */
/* 1.  Type expected by Next’s type-generator                          */
/* ------------------------------------------------------------------ */
export type PageProps = {
  params: {
    slug: string
  }
}

/* ------------------------------------------------------------------ */
/* 2.  Supabase client (service-role key → server only)                */
/* ------------------------------------------------------------------ */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* Force this page to run on the server every request */
export const dynamic = 'force-dynamic'

/* ------------------------------------------------------------------ */
/* 3.  Handler                                                         */
/* ------------------------------------------------------------------ */
export default async function QRRedirect ({ params }: PageProps) {
  /* look up facility id */
  const { data: facility, error } = await supabase
    .from('tennis_facilities')
    .select('id')
    .eq('slug', params.slug)
    .single()

  /* insert scan record (ignore failures so redirect never blocks) */
  if (facility && !error) {
    const hdr = headers()

    await supabase
      .from('qr_scans')
      .insert({
        facility_id: facility.id,
        user_agent : hdr.get('user-agent') ?? null,
        referer    : hdr.get('referer')    ?? null,
      })
      .catch(() => {})             // swallow any DB errors
  }

  /* final redirect */
  redirect('https://firstserveseattle.com')
}