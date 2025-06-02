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
      return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_error`)
    }

    const user = data.user
    if (!user || !user.email) {
      console.error('❌ No user or email from OAuth')
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`)
    }

    console.log('✅ OAuth successful for:', user.email)

    // For signup mode, check if this is a new user who needs to go through checkout
    if (mode === 'signup') {
      // Check if user already has a subscription
      const memberCheckResponse = await fetch(
        `${requestUrl.origin}/api/member-status?email=${encodeURIComponent(user.email)}`,
        { cache: 'no-store' }
      )

      if (memberCheckResponse.ok) {
        const { isMember } = await memberCheckResponse.json()
        
        if (!isMember) {
          // New user needs to go through signup flow
          console.log('🔀 New Apple user, redirecting to signup with prefilled email')
          return NextResponse.redirect(
            `${requestUrl.origin}/signup?email=${encodeURIComponent(user.email)}&apple_user=true`
          )
        }
      }
    }

    // Existing user or login mode - go to intended destination
    console.log('🔀 Redirecting to:', redirectTo)
    return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
  }

  // No code means something went wrong
  console.error('❌ No code in OAuth callback')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=oauth_failed`)
} 