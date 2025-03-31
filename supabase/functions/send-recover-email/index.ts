// supabase/functions/send-recovery-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe?target=deno&no-check'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- Configuration ---
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!

if (!STRIPE_SECRET_KEY || !SENDGRID_API_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error("CRITICAL ERROR: Missing required environment variables.")
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  // Use the required API version
  apiVersion: '2025-02-24.acacia', // <<<< UPDATED API Version
})

sgMail.setApiKey(SENDGRID_API_KEY)
const SENDGRID_FROM_EMAIL = 'support@firstserveseattle.com'

const MONTHLY_PRICE_ID = 'price_1Qbm96KSaqiJUYkj7SWySbjU' // Verify this Price ID
const RECOVERY_COUPON_ID = 'zctzOBTE'
const SUCCESS_URL = 'https://www.firstserveseattle.com/members'
const CANCEL_URL = 'https://www.firstserveseattle.com/'

const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('Function "send-recovery-email" initialized.')

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    } })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userId, email, fullName } = await req.json()
    console.log(`Processing recovery for: ${email} (User ID: ${userId})`)

    if (!userId || !email) {
      console.error('Missing userId or email in request body')
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // --- Create Stripe Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      customer_email: email,
      discounts: [{ coupon: RECOVERY_COUPON_ID }],
      allow_promotion_codes: false,
      metadata: { userId: userId, recoveryFlow: 'true' },
    })

    if (!session.url) {
      throw new Error('Failed to create Stripe checkout session URL.')
    }
    const checkoutUrl = session.url
    console.log(`Stripe Checkout URL created for ${email}: ${checkoutUrl}`)

    // --- Send Email via SendGrid ---
    const emailSubject = "Still thinking about First Serve Seattle? Here's 75% off!"
    const emailHtml = `
      <p>Hi ${fullName || 'there'},</p>
      <p>We noticed you started signing up for First Serve Seattle but didn't get a chance to finish.</p>
      <p>Stop guessing if courts are free and start playing more tennis (or pickleball)! First Serve Seattle gives you today's availability for public courts across the city.</p>
      <p>To make it easier to get started, here's a special offer: **Get 75% off your first month!**</p>
      <p>Click below to complete your subscription with the discount applied:</p>
      <p><a href="${checkoutUrl}" style="background-color: #0c372b; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Subscription (75% Off First Month)</a></p>
      <p>This link is unique to you and includes the discount.</p>
      <p>See you on the courts!</p>
      <p>The First Serve Seattle Team</p>
      <p><small>If you've already subscribed or aren't interested, please ignore this email. Coupon applies to the first month of the monthly plan only.</small></p>
    `

    const msg = { to: email, from: SENDGRID_FROM_EMAIL, subject: emailSubject, html: emailHtml }
    console.log(`Attempting to send recovery email via SendGrid to ${email}`)
    await sgMail.send(msg)
    console.log(`Recovery email successfully sent to ${email}`)

    // --- Update subscriber record ---
    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({ recovery_email_sent: true })
      .eq('id', userId)

    if (updateError) {
      console.error(`Failed to update recovery_email_sent for user ${userId}:`, updateError.message)
    } else {
      console.log(`Successfully marked recovery_email_sent=true for user ${userId}`)
    }

    return new Response(JSON.stringify({ success: true, message: `Recovery email sent to ${email}` }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in send-recovery-email function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})