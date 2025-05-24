/* -------------------------------------------------------------------------- *
 *  Login page                                                                *
 *  – Supabase <Auth> component (email-link)                                  *
 *  – After SIGNED_IN it redirects to /check-membership                       *
 * -------------------------------------------------------------------------- */

'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

/* -------------------------------------------------------------------------- */
/*  Inner component – needs hooks                                             */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router   = useRouter();
  const supabase = createClientComponentClient();

  /* Post-login redirect */
  useEffect(() => {
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) router.push('/check-membership');
      });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  /* Render Supabase Auth UI */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle logo"
            width={80}
            height={80}
            priority
          />
          <h1 className="text-2xl font-bold">Sign in to First Serve Seattle</h1>
        </div>

        {/* Supabase <Auth> */}
        <Auth
          supabaseClient={supabase}
          view="sign_in"
          providers={[]}
          magicLink={false}
          onlyThirdPartyProviders={false}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: { colors: { brand: '#0c372b', brandAccent: '#0c372b' } },
            },
          }}
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Wrapper with Suspense                                                     */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}