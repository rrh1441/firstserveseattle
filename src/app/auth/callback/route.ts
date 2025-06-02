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
      
      // If this is signup mode, we need to check if user has completed payment
      if (mode === 'signup' || redirectTo === '/signup') {
        console.log('🔄 Checking if Apple user needs to complete payment setup')
        
        // Check if user exists in subscribers table (has completed payment)
        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('id, status')
          .eq('email', data.user.email)
          .maybeSingle()

        if (!subscriber) {
          console.log('💳 Apple user needs payment setup, creating Stripe checkout with prefilled email')
          
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
              console.log('✅ Redirecting Apple user to Stripe checkout with prefilled email')
              return NextResponse.redirect(url)
            } else {
              console.error('❌ Failed to create checkout session for Apple user')
              return NextResponse.redirect(new URL('/signup?apple_user=true&error=checkout_failed', requestUrl.origin))
            }
          } catch (checkoutError) {
            console.error('❌ Error creating checkout session:', checkoutError)
            return NextResponse.redirect(new URL('/signup?apple_user=true&error=checkout_failed', requestUrl.origin))
          }
        } else {
          console.log('✅ Apple user has payment setup, redirecting to members')
          // Existing user with payment - redirect to members
          return NextResponse.redirect(new URL('/members', requestUrl.origin))
        }
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  }

  // No code - redirect to error page
  console.error('❌ No authorization code received')
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
} 