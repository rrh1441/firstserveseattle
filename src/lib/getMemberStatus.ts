/* --------------------------------------------------------------------------
   Returns TRUE when the signed-in user’s row in `subscribers`
   has status = 'active' OR 'trialing'.  Uses @supabase/ssr + service role.
   -------------------------------------------------------------------------- */
import { cookies } from 'next/headers';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';

export async function getMemberStatus(): Promise<boolean> {
  /* ----- Next-15: cookies() is async ----------------------------------- */
  const store = await cookies();                 // RequestCookies (read-only)

  /* read-only adapter just for Supabase --------------------------------- */
  const cookieMethods: CookieMethodsServer = {
    get   : (name) => store.get(name)?.value,
    set   : () => {/* no-op – we don’t mutate cookies on the server */},
    remove: () => {/* no-op */},
  };

  /* Supabase client (bypasses RLS with service role key) ---------------- */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieMethods },
  );

  /* identify user ------------------------------------------------------- */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  /* check subscription row --------------------------------------------- */
  const { data, error } = await supabase
    .from('subscribers')
    .select('status')
    .eq('email', user.email)
    .single();

  if (error) return false;
  return data?.status === 'active' || data?.status === 'trialing';
}