// supabase/functions/send-recovery-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno&no-check'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- Configuration ---
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')! // UPDATED Key Name
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')! // Assumes NEXT_PUBLIC_ prefix, adjust if different

if (!STRIPE_SECRET_KEY || !SENDGRID_API_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error("Missing required environment variables (Stripe, SendGrid, Supabase Service Role, Supabase URL)")
  // Optional: throw an error during initialization if critical secrets are missing
}


const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2024-12-18.acacia', // Match your API version
})

sgMail.setApiKey(SENDGRID_API_KEY)
const SENDGRID_FROM_EMAIL = 'support@firstserveseattle.com' // Your verified SendGrid sender

const MONTHLY_PRICE_ID = 'price_1Qbm96KSaqiJUYkj7SWySbjU' // Ensure this is your correct MONTHLY price ID
const RECOVERY_COUPON_ID = 'zctzOBTE' // UPDATED 75% off Coupon ID
const SUCCESS_URL = 'https://www.firstserveseattle.com/members'
const CANCEL_URL = 'https://www.firstserveseattle.com/'

// Initialize Supabase client for DB updates
// Use SERVICE_ROLE_KEY for admin operations like updating any user row
const supabaseAdmin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('Function "send-recovery-email" initialized.')

serve(async (req: Request) => {
  // Immediately return options pre-flight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
        'Access-Control-Allow-Origin': '*', // Adjust CORS as needed for security
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    } })
  }
  // Only allow POST requests for actual invocation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { userId, email, fullName } = await req.json()
    console.log(`Processing recovery for: ${email} (User ID: ${userId})`)

    if (!userId || !email) {
      console.error('Missing userId or email in request body')
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // --- Create a new Stripe Checkout Session with the 75% discount ---
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      customer_email: email, // Pre-fill email
      discounts: [{ coupon: RECOVERY_COUPON_ID }], // Apply 75% off
      allow_promotion_codes: false,
      metadata: {
        userId: userId,
        recoveryFlow: 'true',
      },
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
      <p>Ryan from First Serve Seattle</p>
      <p><small>If you've already subscribed or aren't interested, please ignore this email. Coupon applies to the first month of the monthly plan only.</small></p>
    ` // Using the same email body as before

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      subject: emailSubject,
      html: emailHtml,
    }

    // Log before sending
    console.log(`Attempting to send recovery email via SendGrid to ${email}`)
    await sgMail.send(msg)
    console.log(`Recovery email successfully sent to ${email}`)

    // --- Update subscriber record to prevent re-sending ---
    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({ recovery_email_sent: true })
      .eq('id', userId) // Use the ID passed to the function

    if (updateError) {
      // Log the error but don't necessarily fail the whole function if email sent
      console.error(`Failed to update recovery_email_sent for user ${userId}:`, updateError.message)
    } else {
      console.log(`Successfully marked recovery_email_sent=true for user ${userId}`)
    }

    return new Response(JSON.stringify({ success: true, message: `Recovery email sent to ${email}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in send-recovery-email function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})