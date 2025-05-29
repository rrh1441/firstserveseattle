/* src/app/billing/page.tsx
 * When visited, immediately redirects the user to Stripe's portal.
 */
import { cookies } from 'next/headers';
import { createBillingPortal } from '@/lib/createBillingPortal';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';            // never cache

export default async function BillingRedirectPage() {
  const authCookie = cookies().get('sb-access-token')?.value; // Supabase client cookie

  try {
    const url = await createBillingPortal(authCookie);
    redirect(url);                                   // 302 to Stripe
  } catch (err) {
    console.error('[billing] redirect failed', err);
    // Fallback: show an error page or redirect to /members with error
    redirect('/members?billingError=1');
  }
} 