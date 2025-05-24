/* --------------------------------------------------------------------------
   lib/getMemberStatus.ts
   --------------------------------------------------------------------------
   Server-only helper that returns `true` when the currently signed-in user has
   an **active OR trialing** subscription in `public.subscribers`.

   – Uses @supabase/ssr (needs SUPABASE_SERVICE_ROLE_KEY in the env)
   – Works with Next.js 15 cookie API
   -------------------------------------------------------------------------- */

import { cookies as nextCookies, type CookieOptions } from 'next/headers';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

/* --------------------------- cookie wrapper ----------------------------- */
/* convert Next’s cookie-store to the interface @supabase/ssr expects       */
const cookieStore = nextCookies(); // RequestCookies
const cookieAdapter: CookieMethodsServer = {
  get:  (name)                       => cookieStore.get(name)?.value,
  set:  (name, value, opts: CookieOptions = {}) =>
         cookieStore.set({ name, value, ...opts }),
  remove: (name, opts: CookieOptions = {}) =>
         cookieStore.delete({ name, ...opts }),
};

/* ----------------------- initialise Supabase client --------------------- */
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // service-role key, bypasses RLS
  { cookies: cookieAdapter },
);

/* ------------------------- main exported helper ------------------------- */
export async function getMemberStatus(): Promise<boolean> {
  /* identify user */
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user?.email) return false;

  /* look up subscription row */
  const { data, error: subErr } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  if (subErr) return false;

  return data?.status === 'active' || data?.status === 'trialing';
}