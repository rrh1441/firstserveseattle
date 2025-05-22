/** /q/<slug> – record scan then redirect */
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-side key
)

export const dynamic = 'force-dynamic' // always run on the server

type PageProps = { params: { slug: string } }

export default async function QRRedirect({ params }: PageProps): Promise<never> {
  /* 1 ─ look-up facility id (keeps table normalised) */
  const { data: facility } = await supabase
    .from('tennis_facilities')
    .select('id')
    .eq('slug', params.slug)
    .maybeSingle() // returns null when not found without throwing
    .throwOnError()

  /* 2 ─ insert scan record (ignore failures so redirect is never blocked) */
  if (facility?.id) {
    const hdr = headers()
    void supabase
      .from('qr_scans')
      .insert({
        facility_id: facility.id,
        user_agent : hdr.get('user-agent') ?? null,
        referer    : hdr.get('referer') ?? null,
      })
      .catch(() => {
        /* swallow – logging isn’t critical to UX */
      })
  }

  /* 3 ─ send user on their way */
  redirect('https://firstserveseattle.com')
}