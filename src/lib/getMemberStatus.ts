import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/** true = user has an active subscription */
export async function getMemberStatus(): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,    // server only, bypasses RLS
    { cookies },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const { data } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  return data?.status === 'active';
}