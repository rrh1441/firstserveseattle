import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/** TRUE ⇢ user is active or trialing */
export async function getMemberStatus(): Promise<boolean> {
  /* 1️⃣  client with service-role key */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies },            // ← just this
  );

  /* 2️⃣  identify user */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  /* 3️⃣  look up subscription */
  const { data } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  return data?.status === 'active' || data?.status === 'trialing';
}