/* --------------------------------------------------------------------------
 lib/getMemberStatus.ts
 --------------------------------------------------------------------------
 Returns true when the signed-in user has an **active OR trialing**
 subscription in `public.subscribers`. Uses @supabase/ssr and the
 service-role key (bypasses RLS).
 -------------------------------------------------------------------------- */
import { cookies as nextCookies } from 'next/headers';
import {
  createServerClient,
  type CookieMethodsServer,
} from '@supabase/ssr';

/* ----------------------------- main helper ------------------------------ */
export async function getMemberStatus(): Promise<boolean> {
  /* ---------- wrap Next.js cookie store into the shape Supabase expects --- */
  const store = await nextCookies(); // RequestCookies (awaited for Next.js 15)
  const cookieAdapter: CookieMethodsServer = {
    getAll: () => store.getAll(),
    setAll: (cookiesToSet) => {
      cookiesToSet.forEach(({ name, value, options }) =>
        store.set(name, value, options)
      );
    },
  };

  /* --------------------------- Supabase client ---------------------------- */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only key
    { cookies: cookieAdapter },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const { data, error } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  if (error) return false;
  return data?.status === 'active' || data?.status === 'trialing';
}