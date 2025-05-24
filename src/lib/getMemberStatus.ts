/* --------------------------------------------------------------------------
   lib/getMemberStatus.ts
   --------------------------------------------------------------------------
   Server-only helper that returns `true` when the signed-in user has an
   **active** Stripe subscription recorded in `public.subscribers`.

   – Uses @supabase/ssr so the query runs on the server and bypasses RLS
     (requires `SUPABASE_SERVICE_ROLE_KEY` in the environment).
   – Returns            ▸ `true`   … user is active
                        ▸ `false`  … user not found / not active / not signed in
   – No exceptions leak; caller just handles a boolean.
  -------------------------------------------------------------------------- */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/** TRUE ⇢ user’s row exists and `status = 'active'` */
export async function getMemberStatus(): Promise<boolean> {
  /* ----------------------- initialise server client ---------------------- */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only key, bypasses RLS
    { cookies },
  );

  /* --------------------- identify currently signed-in user -------------- */
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user?.email) return false;   // not signed in

  /* -------------------- look up subscription status --------------------- */
  const { data, error: subErr } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();                                 // LIMIT 1

  if (subErr) return false;                    // row missing or other error

  return data?.status === 'active' || data?.status === 'trialing';
}