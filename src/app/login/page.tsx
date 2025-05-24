/* -------------------------------------------------------------------------- */
/*  src/app/login/page.tsx – client-side sign-in                              */
/*                                                                            */
/*  • After a successful sign-in it looks for ?redirect_to=<path>              */
/*      – if it’s a safe, absolute-path link it uses that                     */
/*      – otherwise it falls back to /members                                 */
/*  • No more intermediate /check-membership redirect                         */
/* -------------------------------------------------------------------------- */

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

/* -------------------------------------------------------------------------- */
/*  Inner component – needs hooks                                             */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClientComponentClient();

  /* -------- compute safe redirect target (default → /members) ------------ */
  const rawRedirect = searchParams.get('redirect_to');
  const redirectTo =
    rawRedirect &&
    rawRedirect.startsWith('/') &&          // not absolute URL
    !rawRedirect.startsWith('//') &&        // not protocol-relative
    !rawRedirect.includes(':')              // not scheme
      ? rawRedirect
      : '/members';

  /* -------- listen for auth state changes -------------------------------- */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace(redirectTo);       // 👈 go straight to target
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [router, redirectTo, supabase]);

  /* ---------------------------- render ----------------------------------- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            priority
          />
          <h1 className="text-2xl font-bold">Sign in to First Serve Seattle</h1>
        </div>

        {/* Supabase pre-built form */}
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          providers={[]}             /* email-only for now */
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: { colors: { brand: '#0c372b', brandAccent: '#0c372b' } },
            },
          }}
          magicLink={false}
          onlyThirdPartyProviders={false}
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Export with Suspense wrapper (unchanged)                                  */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}