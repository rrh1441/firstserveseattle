/* -------------------------------------------------------------------------- */
/*  src/app/members/page.tsx                                                  */
/* -------------------------------------------------------------------------- */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { ExternalLink, AlertTriangle, X } from 'lucide-react';

import TennisCourtList from '../tennis-courts/components/TennisCourtList';
import { Button } from '@/components/ui/button';
import ReAuthModal from '@/app/components/ReAuthModal';
import AppleMigrationBanner, { useAppleMigrationBanner } from '@/app/components/AppleMigrationBanner';

/* ---------- tiny fetcher hits the server-side API, not Supabase ---------- */
async function fetchMemberStatus(email: string | null | undefined) {
  if (!email) return false;
  try {
    const r = await fetch(`/api/member-status?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    if (!r.ok) return false;
    const { isMember } = (await r.json()) as { isMember: boolean };
    return isMember === true;
  } catch {
    return false;
  }
}

export default function MembersPage() {
  const router   = useRouter();
  const supabase = createClientComponentClient();

  const [checking, setChecking]     = useState(true);
  const [error,    setError]        = useState<string | null>(null);
  const [token,    setToken]        = useState<string | null>(null);
  const [loadingPortal, setLP]      = useState(false);
  const [userEmail, setUserEmail]   = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [authProvider, setAuthProvider] = useState<'apple' | 'google' | 'email' | null>(null);
  const { dismissed: appleBannerDismissed, dismiss: dismissAppleBanner } = useAppleMigrationBanner();

  const isPrivateRelay = userEmail?.endsWith('@privaterelay.appleid.com') ?? false;
  const showAppleMigrationBanner = authProvider === 'apple' && !appleBannerDismissed;

  console.log('🏠 Members page component loaded');

  /* ---------------- helper to open billing portal ---------------- */
  const openBillingPortal = useCallback(async (accessToken: string) => {
    setLP(true);
    try {
      const r = await fetch('/api/create-portal-link', {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization : `Bearer ${accessToken}`,
        },
      });
      if (!r.ok) throw new Error(await r.text());
      const { url } = (await r.json()) as { url: string };
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Portal error');
      setLP(false);
    }
  }, []);

  /* ---------------- session + membership gate ---------------- */
  useEffect(() => {
    console.log('🔄 Members page useEffect running...');
    (async () => {
      try {
        console.log('🧪 Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('❌ No session found, redirecting to login');
          router.replace(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        console.log('✅ Session found for:', session.user.email);
        setToken(session.access_token);
        setUserEmail(session.user.email ?? null);

        // Detect auth provider from user identities
        const identities = session.user.identities || [];
        const appleIdentity = identities.find(i => i.provider === 'apple');
        const googleIdentity = identities.find(i => i.provider === 'google');

        if (appleIdentity) {
          setAuthProvider('apple');
        } else if (googleIdentity) {
          setAuthProvider('google');
        } else {
          setAuthProvider('email');
        }

        console.log('🧪 Checking membership status...');
        const ok = await fetchMemberStatus(session.user.email);
        console.log('📊 Membership status:', ok);
        if (!ok) {
          console.log('❌ No membership found, redirecting to paywall');
          router.replace('/signup');
          return;
        }
        console.log('✅ Membership confirmed, showing members content');

        // Check if user just completed re-auth for billing
        const pendingAction = localStorage.getItem('reauth_pending_action');
        if (pendingAction === 'billing') {
          console.log('🔄 Completing pending billing action after re-auth');
          localStorage.removeItem('reauth_pending_action');
          // Small delay to ensure state is set
          setTimeout(() => openBillingPortal(session.access_token), 100);
        }
      } catch (e) {
        console.error('💥 Error in members page:', e);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        console.log('🏁 Members page check complete');
        setChecking(false);
      }
    })();
  }, [router, supabase, openBillingPortal]);

  /* ---------------- customer-portal handler ------------------ */
  function manageSub() {
    if (!token) { setError('No session'); return; }
    // Show re-auth modal before allowing access to billing
    setShowReAuthModal(true);
  }

  function handleReAuthSuccess() {
    setShowReAuthModal(false);
    if (token) {
      openBillingPortal(token);
    }
  }

  /* ---------------------------- UI --------------------------- */
  if (checking) {
    return <div className="flex min-h-screen items-center justify-center">Checking membership…</div>;
  }
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="rounded border border-red-300 bg-red-100 p-4 text-red-500">
          {error} — please refresh or contact support.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 md:pt-10 md:pb-8">
      {/* Apple Sign-In migration banner */}
      {showAppleMigrationBanner && (
        <AppleMigrationBanner onDismiss={dismissAppleBanner} />
      )}

      {/* Private relay warning banner (only show if Apple banner not shown) */}
      {isPrivateRelay && !bannerDismissed && !showAppleMigrationBanner && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">Your account uses Apple&apos;s private email</p>
              <p className="mt-1 text-sm text-amber-700">
                This can make it hard to log back in. Add a backup email in your Stripe billing settings so you can always access your account.
              </p>
              <button
                onClick={manageSub}
                className="mt-3 text-sm font-medium text-amber-800 underline hover:text-amber-900"
              >
                Update email in billing settings
              </button>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-amber-600 hover:text-amber-800"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* header */}
      <header className="mb-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle"
            width={80}
            height={80}
            priority
          />
          <div>
            <h1 className="mb-1 text-3xl font-extrabold text-[#0c372b] md:text-4xl">
              First&nbsp;Serve&nbsp;Seattle
            </h1>
            <p className="text-base font-semibold md:text-lg">
              Today&apos;s Open Tennis &amp; Pickleball Courts
            </p>
          </div>
        </div>

        <Button
          onClick={manageSub}
          className="w-full whitespace-nowrap bg-[#0c372b] text-white hover:bg-[#0c372b]/90 md:w-auto"
          disabled={loadingPortal}
        >
          {loadingPortal ? 'Loading…' : 'Manage Subscription'}
        </Button>
      </header>

      <TennisCourtList />

      <div className="mt-8 space-y-3 text-center sm:space-y-0 sm:space-x-4">
        <Button asChild className="w-full gap-2 sm:w-auto">
          <a
            href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book Future Reservations <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button asChild className="w-full gap-2 sm:w-auto">
          <a
            href="http://www.tennis-seattle.com?From=185415"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join a Local League <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>

    {/* Re-authentication modal for billing actions */}
    <ReAuthModal
      open={showReAuthModal}
      onClose={() => setShowReAuthModal(false)}
      onSuccess={handleReAuthSuccess}
      userEmail={userEmail || ''}
      authProvider={authProvider}
    />
    </>
  );
}