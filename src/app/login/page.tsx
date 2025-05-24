/* -------------------------------------------------------------------------- */
/*  src/app/login/page.tsx – no auto-redirect on first paint                  */
/* -------------------------------------------------------------------------- */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Button } from '@/components/ui/button';

/* -------------------------------------------------------------------------- */
/*  Inner component – needs hooks                                             */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClientComponentClient();

  /* `null`  = still checking, `true/false` = result */
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  /* 1️⃣  Check once on mount whether a session cookie already exists */
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => setHasSession(Boolean(session)));
  }, [supabase]);

  /* 2️⃣  Listen for a fresh sign-in and redirect *after* it happens */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.replace('/check-membership');   // continues normal flow
        }
      },
    );
    return () => listener.subscription.unsubscribe();
  }, [router, supabase]);

  /* -------------------------------------------------------------- */
  /*  Loading placeholder while we check for an existing session    */
  /* -------------------------------------------------------------- */
  if (hasSession === null) {
    return <div className="min-h-screen" />;     // silent flash
  }

  /* -------------------------------------------------------------- */
  /*  Already signed-in – let the user choose what to do            */
  /* -------------------------------------------------------------- */
  if (hasSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
          alt="First Serve Seattle Logo"
          width={80}
          height={80}
          priority
        />

        <h1 className="text-2xl font-bold">You’re already signed in</h1>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="bg-[#0c372b] text-white hover:bg-[#0c372b]/90"
            onClick={() => router.replace('/members')}
          >
            Continue to members
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              setHasSession(false);             // show login form next
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------- */
  /*  No session – render Supabase Auth UI                          */
  /* -------------------------------------------------------------- */
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
          providers={[]}                 /* email-only for now */
          magicLink={false}
          onlyThirdPartyProviders={false}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0c372b',
                  brandAccent: '#0c372b',
                },
              },
            },
          }}
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Wrapper with Suspense (matches your app structure)                        */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}