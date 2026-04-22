import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        const userId = session.metadata?.userId
        const mode = session.metadata?.mode

        if (!userId) break

        if (mode === 'subscription') {
          // Upgrade user to Pro
          await supabase
            .from('profiles')
            .update({ plan: 'pro', stripe_customer_id: session.customer as string })
            .eq('id', userId)
        } else if (mode === 'payment') {
          // Add 1 listing credit
          const { data: profile } = await supabase
            .from('profiles')
            .select('listing_credits')
            .eq('id', userId)
            .single()

          await supabase
            .from('profiles')
            .update({ listing_credits: (profile?.listing_credits || 0) + 1 })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade user to starter
        await supabase
          .from('profiles')
          .update({ plan: 'starter' })
          .eq('stripe_customer_id', customerId)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}