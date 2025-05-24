/* -------------------------------------------------------------------------- */
/*  src/app/members/page.tsx                                                  */
/* -------------------------------------------------------------------------- */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

import TennisCourtList from '../tennis-courts/components/TennisCourtList';
import { Button } from '@/components/ui/button';

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

  /* ---------------- session + membership gate ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        setToken(session.access_token);

        const ok = await fetchMemberStatus(session.user.email);
        if (!ok) {
          const res  = await fetch('/api/create-checkout-session', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ email: session.user.email, plan: 'monthly' }),
          });
          const { url } = (await res.json()) as { url: string };
          window.location.href = url;
          return;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setChecking(false);
      }
    })();
  }, [router, supabase]);

  /* ---------------- customer-portal handler ------------------ */
  async function manageSub() {
    if (!token) { setError('No session'); return; }
    setLP(true);
    try {
      const r = await fetch('/api/create-portal-link', {
        method : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization : `Bearer ${token}`,
        },
      });
      if (!r.ok) throw new Error(await r.text());
      const { url } = (await r.json()) as { url: string };
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Portal error');
    } finally {
      setLP(false);
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
    <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 md:pt-10 md:pb-8">
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
              Today’s Open Tennis &amp; Pickleball Courts
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
  );
}