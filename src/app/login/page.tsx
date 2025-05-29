/* -------------------------------------------------------------------------- */
/*  src/app/login/page.tsx – client-side sign-in                              */
/*                                                                            */
/*  • After a successful sign-in it looks for ?redirect_to=<path>              */
/*      – if it's a safe, absolute-path link it uses that                     */
/*      – otherwise it falls back to /members                                 */
/*  • Supports email pre-filling via ?email=<email> parameter                 */
/* -------------------------------------------------------------------------- */

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginFormClient from './LoginFormClient';

/* -------------------------------------------------------------------------- */
/*  Inner component – needs hooks                                             */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const searchParams = useSearchParams();

  /* -------- compute safe redirect target (default → /members) ------------ */
  const rawRedirect = searchParams.get('redirect_to');
  const redirectTo =
    rawRedirect &&
    rawRedirect.startsWith('/') &&          // not absolute URL
    !rawRedirect.startsWith('//') &&        // not protocol-relative
    !rawRedirect.includes(':')              // not scheme
      ? rawRedirect
      : '/members';

  /* -------- get email from URL params ------------------------------------ */
  const emailParam = searchParams.get('email') || '';
  const fromCheckout = searchParams.get('from') === 'checkout';

  /* ---------------------------- render ----------------------------------- */
  return <LoginFormClient redirectTo={redirectTo} initialEmail={emailParam} showTrialMessage={fromCheckout} />;
}

/* -------------------------------------------------------------------------- */
/*  Export with Suspense wrapper                                              */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  );
}