import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Service role client for updating subscribers table (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { mode } = await request.json() as { mode: 'signin' | 'signup' }

    // Get the authenticated user from session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ link-subscriber: No authenticated user', userError)
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userEmail = user.email
    if (!userEmail) {
      console.error('❌ link-subscriber: User has no email')
      return NextResponse.json(
        { success: false, error: 'User has no email' },
        { status: 400 }
      )
    }

    console.log('🔄 link-subscriber: Processing for', userEmail, 'mode:', mode)

    // Check if subscriber exists by email (use admin client to bypass RLS)
    const { data: subscriber, error: checkError } = await supabaseAdmin
      .from('subscribers')
      .select('id, status, user_id, trial_end')
      .eq('email', userEmail)
      .maybeSingle()

    if (checkError) {
      console.error('❌ link-subscriber: Error checking subscriber:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }

    if (subscriber) {
      // Existing subscriber found - update user_id to link the account
      console.log('🔄 link-subscriber: Updating existing subscriber with user_id')

      const { error: updateError } = await supabaseAdmin
        .from('subscribers')
        .update({ user_id: user.id })
        .eq('email', userEmail)

      if (updateError) {
        console.error('❌ link-subscriber: Error updating subscriber:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to link account' },
          { status: 500 }
        )
      }

      console.log('✅ link-subscriber: Linked user_id to existing subscriber')
      return NextResponse.json({
        success: true,
        status: subscriber.status,
        isNew: false
      })
    }

    // No subscriber found
    if (mode === 'signup') {
      // Create a new trial subscriber for signups
      console.log('🆕 link-subscriber: Creating 5-day trial for new user')

      // Calculate trial end date (5 days from now, in epoch seconds)
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 5)
      const trialEndEpoch = Math.floor(trialEndDate.getTime() / 1000)

      const insertData = {
        user_id: user.id,
        email: userEmail,
        status: 'trialing',
        trial_end: trialEndEpoch,
        has_card: false,
        plan: 'trial',
      }

      // Try insert first
      const { error: insertError } = await supabaseAdmin
        .from('subscribers')
        .insert(insertData)

      if (insertError) {
        console.error('❌ link-subscriber: Insert failed, trying upsert:', insertError)

        // If insert fails (maybe duplicate), try upsert by email
        const { error: upsertError } = await supabaseAdmin
          .from('subscribers')
          .upsert(insertData, { onConflict: 'email' })

        if (upsertError) {
          console.error('❌ link-subscriber: Upsert also failed:', upsertError)
          return NextResponse.json(
            { success: false, error: 'Failed to create trial' },
            { status: 500 }
          )
        }
      }

      console.log('✅ link-subscriber: Trial created for', userEmail, 'expires:', trialEndDate.toISOString())
      return NextResponse.json({
        success: true,
        status: 'trialing',
        isNew: true
      })
    }

    // Sign-in mode but no subscriber exists - this user has no subscription
    console.log('⚠️ link-subscriber: No subscriber found for sign-in user')
    return NextResponse.json({
      success: true,
      status: null,
      isNew: false
    })

  } catch (error) {
    console.error('❌ link-subscriber: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
