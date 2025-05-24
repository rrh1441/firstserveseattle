/* -------------------------------------------------------------------------- *
 *  getMemberStatus()                                                         *
 *  – Server-only helper                                                     *
 *  – Returns TRUE when the signed-in user has status = 'active' | 'trialing' *
 *    in public.subscribers.                                                  *
 *  – Uses @supabase/ssr + SERVICE_ROLE key → bypasses RLS.                   *
 * -------------------------------------------------------------------------- */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getMemberStatus(): Promise<boolean> {
  /* Supabase client (server-side, no cookie adapter needed) */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // server-only key
    { cookies },                              // just pass Next.js helper
  );

  /* Identify signed-in user */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  /* Look up subscription status */
  const { data, error } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  if (error) return false;
  return data?.status === 'active' || data?.status === 'trialing';
}