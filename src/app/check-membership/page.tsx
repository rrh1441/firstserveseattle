/* --------------------------------------------------------------------------
   src/app/check-membership/page.tsx
   --------------------------------------------------------------------------
   Server component that:
     1. Ensures the user is signed-in
     2. Hits /api/member-status (relative path → works in dev, preview, prod)
     3. Redirects based on the result
   -------------------------------------------------------------------------- */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CheckMembershipPage() {
  const supabase = createServerComponentClient({ cookies });

  /* ---------- 1️⃣  require login ---------------------------------------- */
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    redirect('/login');
  }

  console.log('🔍 Checking membership for:', user.email);

  /* ---------- 2️⃣  hit the membership API ------------------------------- */
  try {
    const response = await fetch(
      `/api/member-status?email=${encodeURIComponent(user.email)}`,
      { cache: 'no-store' }, // never cache auth checks
    );

    if (!response.ok) {
      console.error('Member-status API failed:', response.status);
      redirect('/signup');
    }

    const { isMember } = (await response.json()) as { isMember: boolean };

    console.log('📊 Member status result:', isMember);

    /* ---------- 3️⃣  route based on result ------------------------------ */
    if (isMember) {
      redirect('/members');
    } else {
      redirect('/signup');
    }
  } catch (err) {
    console.error('Membership check error:', err);
    redirect('/signup');
  }
}