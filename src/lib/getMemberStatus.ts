/* --------------------------------------------------------------------------
   getMemberStatus()
   – Runs on the server only (uses @supabase/ssr + service-role key).
   – Returns TRUE when the signed-in user has status = 'active' | 'trialing'.
   – No cookie “adapter” helper; we just implement the 3 methods inline.
   -------------------------------------------------------------------------- */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getMemberStatus(): Promise<boolean> {
  /* cookie helpers that match CookieMethodsServer ------------------------ */
  const store = cookies();                       // RequestCookies
  const cookieMethods = {
    get   : (name: string)                => store.get(name)?.value,
    set   : (name: string,
             value: string,
             opts?: Parameters<typeof store.set>[0] & { value?: never }) =>
             store.set({ name, value, ...opts }),
    remove: (name: string,
             opts?: Parameters<typeof store.delete>[0]) =>
             store.delete({ name, ...opts }),
  };

  /* Supabase client (service role = bypasses RLS) ------------------------ */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieMethods },
  );

  /* Identify current user ------------------------------------------------ */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  /* Query subscription status ------------------------------------------- */
  const { data, error } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  if (error) return false;
  return data?.status === 'active' || data?.status === 'trialing';
}