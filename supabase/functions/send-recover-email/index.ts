// supabase/functions/send-recovery-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// Consider pinning Stripe version for Deno if needed: e.g., stripe@11.1.0?target=deno&no-check
import Stripe from 'https://esm.sh/stripe?target=deno&no-check'
import sgMail from 'https://esm.sh/@sendgrid/mail@7.7.0'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- Configuration ---
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!
const SUPABASE_URL = Deno.env.get('NEXT_PUBLIC_SUPABASE_URL')!

// Check if essential environment variables are loaded
if (!STRIPE_SECRET_KEY || !SENDGRID_API_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error("CRITICAL ERROR: Missing required environment variables (Stripe SK, SendGrid Key, Service Role Key, Supabase URL). Function cannot operate.")
  // Consider throwing an error to prevent initialization if secrets are missing
  // throw new Error("Missing required environment variables.");
}

let stripe: Stripe | null = null;
try {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      httpClient: Stripe.createFetchHttpClient(), // Required for Deno compatibility
      // Use the API version required by the installed/imported Stripe library
      apiVersion: '2025-02-24.acacia',
    })
} catch(e) {
    console.error("Failed to initialize Stripe:", e);
    // Handle initialization failure - maybe the function should exit?
}


try {
    sgMail.setApiKey(SENDGRID_API_KEY)
} catch(e) {
    console.error("Failed to set SendGrid API key:", e);
     // Handle initialization failure
}

const SENDGRID_FROM_EMAIL = 'support@firstserveseattle.com' // Your verified SendGrid sender email

// Verify these IDs are correct in your Stripe account
const MONTHLY_PRICE_ID = 'price_1Qbm96KSaqiJUYkj7SWySbjU'
const RECOVERY_COUPON_ID = 'zctzOBTE' // 75% off coupon

const SUCCESS_URL = 'https://www.firstserveseattle.com/members' // Redirect on successful payment
const CANCEL_URL = 'https://www.firstserveseattle.com/'     // Redirect if checkout is cancelled

let supabaseAdmin: SupabaseClient | null = null;
try {
    supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        // Recommended settings for server-side/admin clients
        autoRefreshToken: false,
        persistSession: false
      }
    });
} catch(e) {
    console.error("Failed to initialize Supabase Admin Client:", e);
     // Handle initialization failure
}


console.log('Function "send-recovery-email" initialization attempted.');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
        'Access-Control-Allow-Origin': '*', // Adjust for production if needed
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    } })
  }
  // Only allow POST method for actual execution
  if (req.method !== 'POST') {
    console.warn(`Received non-POST request: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check if clients initialized correctly before proceeding
  if (!stripe || !supabaseAdmin) {
      console.error("Aborting: Stripe or Supabase client not initialized.");
      return new Response(JSON.stringify({ error: 'Internal Server Configuration Error' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
  }


  try {
    // Safely parse JSON body
    let payload;
    try {
        payload = await req.json();
    } catch (e) {
        console.error("Failed to parse request body:", e);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400, headers: { 'Content-Type': 'application/json' },
        });
    }

    const { userId, email, fullName } = payload;
    console.log(`Processing recovery email request for: ${email} (User ID: ${userId})`);

    if (!userId || !email) {
      console.error('Validation Error: Missing userId or email in request payload');
      return new Response(JSON.stringify({ error: 'Missing required user information (userId or email)' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      })
    }

    // --- Create a new Stripe Checkout Session with the 75% discount ---
    let session;
    try {
        session = await stripe.checkout.sessions.create({
          line_items: [{ price: MONTHLY_PRICE_ID, quantity: 1 }],
          mode: 'subscription',
          success_url: SUCCESS_URL,
          cancel_url: CANCEL_URL,
          customer_email: email, // Pre-fill customer email
          discounts: [{ coupon: RECOVERY_COUPON_ID }], // Apply the 75% off coupon
          allow_promotion_codes: false, // Prevent stacking other codes
          metadata: {
            userId: userId, // Link Stripe session back to your internal user ID
            recoveryFlow: 'true', // Flag this as a recovery session
          },
        });
    } catch (stripeError) {
        console.error(`Stripe checkout session creation failed for ${email}:`, stripeError);
        throw new Error(`Stripe API error: ${stripeError.message || 'Failed to create session'}`);
    }


    if (!session?.url) {
      console.error(`Stripe session created but URL is missing for ${email}`);
      throw new Error('Failed to retrieve Stripe checkout session URL after creation.');
    }
    const checkoutUrl = session.url;
    console.log(`Stripe Checkout URL created successfully for ${email}`);

    // --- Send Email via SendGrid ---
    const emailSubject = "Still thinking about First Serve Seattle? Here's 75% off!";
    // Using template literals for easier multiline HTML
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
    `;

    const msg = {
      to: email,
      from: SENDGRID_FROM_EMAIL,
      subject: emailSubject,
      html: emailHtml,
    };

    console.log(`Attempting to send recovery email via SendGrid to ${email}`);
    try {
        await sgMail.send(msg);
        console.log(`Recovery email successfully sent to ${email}`);
    } catch (sendgridError) {
        console.error(`SendGrid failed to send email to ${email}:`, sendgridError?.response?.body || sendgridError);
        // Decide if you should still attempt the DB update or throw
        throw new Error(`SendGrid error: ${sendgridError.message || 'Failed to send email'}`);
    }


    // --- Update subscriber record to prevent re-sending ---
    // This runs even if SendGrid failed in the above block unless an error was thrown
    console.log(`Attempting to update recovery_email_sent flag for user ID: ${userId}`);
    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({ recovery_email_sent: true })
      .eq('id', userId); // Match the user ID

    if (updateError) {
      // Log the error but don't necessarily fail the whole function response
      // The email might have sent, failing here is less critical than failing the send
      console.error(`DATABASE UPDATE FAILED for recovery_email_sent flag for user ${userId}:`, updateError.message);
    } else {
      console.log(`Successfully marked recovery_email_sent=true for user ${userId}`);
    }

    // Return success response to the invoking database function
    return new Response(JSON.stringify({ success: true, message: `Recovery email processed for ${email}` }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Catch errors from Stripe, SendGrid, or DB update attempts
    console.error('Unhandled error in send-recovery-email function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    // Return a generic server error response
    return new Response(JSON.stringify({ error: 'An internal error occurred while processing the request.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
})