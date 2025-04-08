import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!
const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')!
const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!
const COUPON_ID = Deno.env.get('STRIPE_COUPON_ID')!
const APP_URL = 'https://firstserveseattle.com'
const SUPPORT_EMAIL = 'support@firstserveseattle.com'

serve(async () => {
  const { data: users, error } = await supabase
    .from('subscribers')
    .select('id, email')
    .eq('status', 'pending')
    .eq('recovery_email_sent', false)
    .lte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error || !users || users.length === 0) {
    console.log('No eligible users found or error:', error)
    return new Response('No eligible users', { status: 200 })
  }

  for (const user of users) {
    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer_email: user.email,
          mode: 'subscription',
          'line_items[0][price]': PRICE_ID,
          'line_items[0][quantity]': '1',
          'discounts[0][coupon]': COUPON_ID,
          success_url: `${APP_URL}/success`,
          cancel_url: `${APP_URL}/cancel`,
        }),
      })

      const session = await stripeRes.json()
      if (!stripeRes.ok || !session.url) {
        console.error(`Stripe error for ${user.email}:`, session)
        continue
      }

      const emailText = `
Hi there,

I noticed you didn’t get a chance to finish signing up — no pressure at all.

I just wanted to say thanks for checking out the app. I built it to make life easier for folks in the Seattle tennis community who are tired of guessing which courts are open. It’s a simple tool, but I hope it saves you time and helps you play more.

Since you're one of the first to try it out, here's a 75% off code if you decide to give it a shot:
${session.url}

The app's still growing, and every early subscriber helps me keep improving it. Either way, I’m really glad you stopped by.

Hope to see you out on the courts,  
Ryan Heger  
Creator of First Serve Seattle

—
This is a one-time message. You won’t receive any further emails unless you subscribe.

      `

      const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: user.email }] }],
          from: { email: SUPPORT_EMAIL, name: 'First Serve Seattle' },
          subject: 'Your early support means the world (so here’s 75% off)',
          content: [{ type: 'text/plain', value: emailText }],
        }),
      })

      if (!sendRes.ok) {
        const err = await sendRes.text()
        console.error(`SendGrid error for ${user.email}:`, err)
        continue
      }

      const { error: updateError } = await supabase
        .from('subscribers')
        .update({ recovery_email_sent: true })
        .eq('id', user.id)

      if (updateError) {
        console.error(`Failed to update ${user.email}:`, updateError)
      }
    } catch (err) {
      console.error(`Unexpected error for ${user.email}:`, err)
    }
  }

  return new Response('Recovery emails processed', { status: 200 })
})
