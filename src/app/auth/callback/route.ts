import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect_to') || '/members'
  const mode = requestUrl.searchParams.get('mode') || 'login'

  console.log('🔄 OAuth callback received:', { code: !!code, redirectTo, mode })

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ OAuth exchange error:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_error', requestUrl.origin))
    }

    if (data.user) {
      console.log('✅ OAuth user authenticated:', data.user.email)
      
      // Always check if user is an existing subscriber, regardless of mode
      console.log('🔄 Checking if user is an existing subscriber')
      
      // Check if user exists in subscribers table (has completed payment)
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('id, status')
        .eq('email', data.user.email)
        .maybeSingle()

      if (subscriber) {
        console.log('✅ Existing subscriber detected, redirecting to members page')
        // Track successful login for existing customer
        // Note: Server-side tracking would go here if needed
        return NextResponse.redirect(new URL('/members', requestUrl.origin))
      }

      // New user - only proceed with signup flow if this was a signup attempt
      if (mode === 'signup' || redirectTo === '/signup') {
        console.log('💳 New user needs payment setup, creating Stripe checkout with prefilled email')
        
        // Create Stripe checkout session with prefilled email
        try {
          const checkoutResponse = await fetch(`${requestUrl.origin}/api/create-checkout-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.user.email,
              plan: 'monthly' // default to monthly
            })
          })

          if (checkoutResponse.ok) {
            const { url } = await checkoutResponse.json()
            console.log('✅ Redirecting new user to Stripe checkout with prefilled email')
            return NextResponse.redirect(url)
          } else {
            console.error('❌ Failed to create checkout session for new user')
            return NextResponse.redirect(new URL('/signup?apple_user=true&error=checkout_failed', requestUrl.origin))
          }
        } catch (checkoutError) {
          console.error('❌ Error creating checkout session:', checkoutError)
          return NextResponse.redirect(new URL('/signup?apple_user=true&error=checkout_failed', requestUrl.origin))
        }
      } else {
        // This was a login attempt for a user without subscription
        console.log('🚫 User tried to login but has no subscription - redirecting to signup')
        return NextResponse.redirect(new URL('/signup?apple_user=true&email=' + encodeURIComponent(data.user.email), requestUrl.origin))
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  }

  // No code - redirect to error page
  console.error('❌ No authorization code received')
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
} 