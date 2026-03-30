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

      const userEmail = data.user.email || ''

      // For link mode, just redirect - user is adding a new auth method to existing account
      if (mode === 'link') {
        console.log('🔗 Identity link completed for:', userEmail)
        return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
      }

      // Block Apple's private relay emails - they break login for subscriptions
      // (Skip this check for link mode - handled above)
      if (userEmail.endsWith('@privaterelay.appleid.com')) {
        console.log('❌ Private relay email detected, blocking signup:', userEmail)
        return NextResponse.redirect(
          new URL('/signup?error=private_email', requestUrl.origin)
        )
      }

      // Get provider IDs from OAuth identities
      const appleIdentity = data.user.identities?.find(i => i.provider === 'apple')
      const googleIdentity = data.user.identities?.find(i => i.provider === 'google')
      const appleProviderId = appleIdentity?.id || null
      const googleProviderId = googleIdentity?.id || null

      // If this is signup mode, handle trial creation or existing user
      if (mode === 'signup' || redirectTo === '/signup') {
        console.log('🔄 Checking if user needs trial setup')

        // Check if user exists in subscribers table (use admin client to bypass RLS)
        const { data: subscriber, error: checkError } = await supabaseAdmin
          .from('subscribers')
          .select('id, status, user_id')
          .eq('email', data.user.email)
          .maybeSingle()

        if (checkError) {
          console.error('❌ Error checking subscriber:', checkError)
        }

        if (!subscriber) {
          console.log('🆕 New user signup - creating 5-day trial')

          // Calculate trial end date (5 days from now, in epoch seconds)
          const trialEndDate = new Date()
          trialEndDate.setDate(trialEndDate.getDate() + 5)
          const trialEndEpoch = Math.floor(trialEndDate.getTime() / 1000)

          // Create trial subscriber record - use upsert to handle edge cases
          const insertData: Record<string, unknown> = {
            user_id: data.user.id,
            email: data.user.email,
            status: 'trialing',
            trial_end: trialEndEpoch,
            has_card: false,
            plan: 'trial', // Required field - will be updated to 'monthly' or 'annual' on checkout
          }
          if (appleProviderId) {
            insertData.apple_provider_id = appleProviderId
          }
          if (googleProviderId) {
            insertData.google_provider_id = googleProviderId
          }

          // Try insert first
          const { error: insertError } = await supabaseAdmin
            .from('subscribers')
            .insert(insertData)

          if (insertError) {
            console.error('❌ Insert failed, trying upsert:', insertError)

            // If insert fails (maybe duplicate user_id), try upsert by email
            const { error: upsertError } = await supabaseAdmin
              .from('subscribers')
              .upsert(insertData, { onConflict: 'email' })

            if (upsertError) {
              console.error('❌ Upsert also failed:', upsertError)
              const errorMsg = encodeURIComponent(upsertError.message || insertError.message || 'unknown')
              return NextResponse.redirect(new URL(`/testworkflow?error=trial_creation_failed&details=${errorMsg}`, requestUrl.origin))
            }
          }

          console.log('✅ Trial created for user:', data.user.email, 'expires:', trialEndDate.toISOString())

          // Redirect to testworkflow with welcome flag - user now has 5-day trial access
          return NextResponse.redirect(new URL('/testworkflow?welcome=true', requestUrl.origin))
        } else {
          // Existing user - update provider IDs and user_id if needed
          const updateData: Record<string, unknown> = {
            user_id: data.user.id,
          }
          if (appleProviderId) {
            updateData.apple_provider_id = appleProviderId
          }
          if (googleProviderId) {
            updateData.google_provider_id = googleProviderId
          }

          console.log('🔄 Updating existing subscriber with provider info')
          await supabaseAdmin
            .from('subscribers')
            .update(updateData)
            .eq('email', userEmail)

          console.log('✅ Existing subscriber found, redirecting to app')
          return NextResponse.redirect(new URL('/testworkflow', requestUrl.origin))
        }
      }

      // For login mode (not signup), update provider IDs if present
      if (appleProviderId || googleProviderId) {
        console.log('🔄 Storing provider IDs for login')
        const updateData: Record<string, unknown> = { user_id: data.user.id }
        if (appleProviderId) updateData.apple_provider_id = appleProviderId
        if (googleProviderId) updateData.google_provider_id = googleProviderId

        await supabaseAdmin
          .from('subscribers')
          .update(updateData)
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