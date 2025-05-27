/* --------------------------------------------------------------------------
   /check-membership
   --------------------------------------------------------------------------
   • Forces sign-in
   • Queries /api/member-status
   • Routes:
       ─ active | trial   → /members
       ─ inactive | error → /paywall
   -------------------------------------------------------------------------- */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies }                     from 'next/headers';
import { redirect }                    from 'next/navigation';

export default async function CheckMembershipPage(): Promise<never> {
  const supabase = createServerComponentClient({ cookies });

  /* ---------- 1️⃣  require authentication ------------------------------ */
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) redirect('/login');

  /* ---------- 2️⃣  membership lookup ----------------------------------- */
  try {
    const res = await fetch(
      `/api/member-status?email=${encodeURIComponent(user.email)}`,
      { cache: 'no-store' },              // never cache auth checks
    );

    if (!res.ok) redirect('/paywall');

    const { isMember } = (await res.json()) as { isMember: boolean };

    /* ---------- 3️⃣  route --------------------------------------------- */
    redirect(isMember ? '/members' : '/paywall');
  } catch {
    /* network / JSON error → safest fallback */
    redirect('/paywall');
  }
}
