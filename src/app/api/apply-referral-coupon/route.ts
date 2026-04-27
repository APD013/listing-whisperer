import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any
})

export async function POST(request: Request) {
  try {
    const { referralCode } = await request.json()

    // Find the referrer
    const { data: referrer } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('referral_code', referralCode)
      .single()

    if (!referrer) {
      return NextResponse.json({ error: 'Referrer not found' }, { status: 404 })
    }

    // Apply coupon to their Stripe customer
    if (referrer.stripe_customer_id) {
      await stripe.customers.update(referrer.stripe_customer_id, {
        coupon: process.env.STRIPE_REFERRAL_COUPON_ID
      })
    }

    // Update referral credits in Supabase
    await supabase
      .from('profiles')
      .update({ referral_credits_earned: supabase.rpc('increment', { x: 1 }) })
      .eq('id', referrer.id)

    // Send notification email via Resend
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Listing Whisperer <rewards@listingwhisperer.com>',
        to: referrer.email,
        subject: '🎉 You earned a referral reward!',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb;">
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
              <h1 style="font-size: 24px; font-weight: 700; color: #111; margin: 0 0 16px;">You earned a referral reward! 🎉</h1>
              <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 16px;">
                Someone you referred just signed up for Listing Whisperer Pro. As a thank you, we've applied a <strong>25% discount</strong> to your next month's subscription.
              </p>
              <p style="font-size: 15px; color: #555; line-height: 1.7; margin: 0 0 24px;">
                The discount will be automatically applied at your next billing date. No action needed on your part.
              </p>
              <a href="https://listingwhisperer.com/dashboard" style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Go to Dashboard →
              </a>
              <p style="font-size: 12px; color: #aaa; margin-top: 24px;">Listing Whisperer · listingwhisperer.com</p>
            </div>
          </div>
        `
      })
    })

    return NextResponse.json({ success: true })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}