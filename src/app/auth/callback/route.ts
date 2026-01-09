import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Service role client for updating subscribers table
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

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

      // Block Apple's private relay emails - they break login for subscriptions
      const userEmail = data.user.email || ''
      if (userEmail.endsWith('@privaterelay.appleid.com')) {
        console.log('❌ Private relay email detected, blocking signup:', userEmail)
        return NextResponse.redirect(
          new URL('/signup?error=private_email', requestUrl.origin)
        )
      }

      // Get Apple provider ID if this is an Apple OAuth user
      const appleIdentity = data.user.identities?.find(i => i.provider === 'apple')
      const appleProviderId = appleIdentity?.id || null

      // If this is signup mode, handle trial creation or existing user
      if (mode === 'signup' || redirectTo === '/signup') {
        console.log('🔄 Checking if user needs trial setup')

        // Check if user exists in subscribers table
        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('id, status')
          .eq('email', data.user.email)
          .maybeSingle()

        if (!subscriber) {
          console.log('🆕 New user signup - creating 7-day trial')

          // Calculate trial end date (7 days from now, in epoch seconds)
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 7)
          const trialEndEpoch = Math.floor(trialEndDate.getTime() / 1000)

          // Create trial subscriber record (include Apple provider ID if present)
          const insertData: Record<string, unknown> = {
            user_id: data.user.id,
            email: data.user.email,
            status: 'trialing',
            trial_end: trialEndEpoch,
            has_card: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          if (appleProviderId) {
            insertData.apple_provider_id = appleProviderId
          }

          const { error: insertError } = await supabaseAdmin
            .from('subscribers')
            .insert(insertData)

          if (insertError) {
            console.error('❌ Failed to create trial subscriber:', insertError)
            return NextResponse.redirect(new URL('/signup?error=trial_creation_failed', requestUrl.origin))
          }

          console.log('✅ Trial created for user:', data.user.email, 'expires:', trialEndDate.toISOString())

          // Redirect to the app - user now has 7-day trial access
          return NextResponse.redirect(new URL('/testc', requestUrl.origin))
        } else {
          // Existing user - update Apple provider ID if needed
          if (appleProviderId) {
            console.log('🍎 Updating Apple provider ID for existing user')
            await supabaseAdmin
              .from('subscribers')
              .update({
                apple_provider_id: appleProviderId,
                user_id: data.user.id,
              })
              .eq('email', userEmail)
          }

          console.log('✅ Existing subscriber found, redirecting to app')
          return NextResponse.redirect(new URL('/testc', requestUrl.origin))
        }
      }

      // For login mode (not signup), update Apple provider ID if present
      if (appleProviderId) {
        console.log('🍎 Storing Apple provider ID for login')
        await supabaseAdmin
          .from('subscribers')
          .update({
            apple_provider_id: appleProviderId,
            user_id: data.user.id,
          })
          .eq('email', userEmail)
      }
    }

    // Default redirect
    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  }

  // No code - redirect to error page
  console.error('❌ No authorization code received')
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
} 