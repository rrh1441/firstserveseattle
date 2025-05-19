import type { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'node:stream'
import Stripe from 'stripe'
import { analytics } from '@/lib/serverAnalytics'

async function readBuffer(readable: Readable) {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  let event: Stripe.Event
  try {
    const buf = await readBuffer(req)
    const sig = req.headers['stripe-signature'] as string
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err) {
    console.error('Invalid webhook signature', err)
    res.status(400).send('Invalid signature')
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await analytics.track({ event: 'trial_started' })
        break
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        if (sub.status === 'active') {
          await analytics.track({ event: 'plan_activated' })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason === 'subscription_create') {
          await analytics.track({ event: 'plan_activated' })
        }
        break
      }
      case 'customer.subscription.deleted':
        await analytics.track({ event: 'trial ended w/o payment' })
        break
      default:
        break
    }

    res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook handler error', err)
    res.status(500).json({ error: 'Webhook handler error' })
  }
}
