import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia'
})

export async function POST(request: Request) {
  try {
    const { priceId, userId } = await request.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://listingwhisperer.com/virtual-staging?credits=added',
      cancel_url: 'https://listingwhisperer.com/virtual-staging',
      metadata: {
        userId: userId || '',
        type: 'staging_credits',
        priceId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
