/* --------------------------------------------------------------------------
   lib/getMemberStatus.ts                — SERVER-ONLY HELPER
   Returns TRUE when the signed-in user has status = 'active' OR 'trialing'
   in public.subscribers.  Uses the service-role key → bypasses RLS.
   -------------------------------------------------------------------------- */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function getMemberStatus(): Promise<boolean> {
  /* -------------------- Supabase client wired to Next cookies ----------- */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,              // server-only
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value
        },
        set(name, value, options) {
          cookies().set({ name, value, ...options })
        },
        remove(name, options) {
          cookies().delete({ name, ...options })
        },
      },
    },
  )

  /* -------------------- identify logged-in user (if any) ---------------- */
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return false

  /* -------------------- subscription row lookup ------------------------- */
  const { data } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single()

  return data?.status === 'active' || data?.status === 'trialing'
}