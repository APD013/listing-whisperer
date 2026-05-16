import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL = 'Adrian at Listing Whisperer <adrian@listingwhisperer.com>'

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  })
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Get profiles with trial_ends_at
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_ends_at, plan, trial_ending_email_sent, trial_expired_email_sent')
      .eq('plan', 'starter')
      .not('trial_ends_at', 'is', null)

    if (!profiles) return NextResponse.json({ message: 'No profiles found' })

    let endingSoonCount = 0
    let expiredCount = 0

    for (const profile of profiles) {
      const trialEnds = new Date(profile.trial_ends_at)
      const name = profile.full_name?.split(' ')[0] || 'there'

      // TRIAL ENDING SOON — expires within 24 hours
      if (
        trialEnds > now &&
        trialEnds < in24Hours &&
        !profile.trial_ending_email_sent
      ) {
        await sendEmail(
          profile.email,
          '⏰ Your Listing Whisperer trial ends tomorrow',
          `
          <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h1 style="font-size: 24px; font-weight: 700; color: #111;">Listing<span style="color: #1D9E75;">Whisperer</span></h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 1rem;">Hey ${name}, your trial ends tomorrow ⏰</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 1.5rem;">
              Your 7-day Pro trial is almost up. Don't lose access to your AI assistant, scripts, seller prep tools, and everything else you've been using.
            </p>
            <div style="background: #f0fdf8; border: 1px solid #bbf0d9; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
              <p style="font-size: 14px; color: #085041; font-weight: 700; margin: 0 0 10px;">Everything you keep with Pro:</p>
              <p style="font-size: 14px; color: #333; line-height: 2; margin: 0;">
                ✅ Unlimited listings<br/>
                ✅ AI chat assistant<br/>
                ✅ Scripts library<br/>
                ✅ Seller prep & pricing tools<br/>
                ✅ 11 copy formats<br/>
                ✅ Launch kit & social planner
              </p>
            </div>
            <a href="https://listingwhisperer.com/pricing" style="display: block; text-align: center; padding: 14px; background: linear-gradient(135deg, #1D9E75, #085041); color: #fff; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700; margin-bottom: 1rem;">
              Upgrade to Pro — $20/month →
            </a>
            <p style="text-align: center; font-size: 13px; color: #aaa;">Use code <strong style="color: #1D9E75;">WELCOME50</strong> for 50% off your first month</p>
          </div>
          `
        )
        await supabase.from('profiles').update({ trial_ending_email_sent: true }).eq('id', profile.id)
        endingSoonCount++
      }

      // TRIAL EXPIRED — ended in the last hour
      if (
        trialEnds < now &&
        trialEnds > oneHourAgo &&
        !profile.trial_expired_email_sent
      ) {
        await sendEmail(
          profile.email,
          '🔒 Your Listing Whisperer trial has ended',
          `
          <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h1 style="font-size: 24px; font-weight: 700; color: #111;">Listing<span style="color: #1D9E75;">Whisperer</span></h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #111; margin-bottom: 1rem;">Hey ${name}, your trial has ended 🔒</h2>
            <p style="font-size: 15px; color: #555; line-height: 1.7; margin-bottom: 1.5rem;">
              Your 7-day Pro trial has expired. Upgrade now to keep using your AI assistant, scripts, seller prep, and all your tools — just $20/month.
            </p>
            <div style="background: #f0fdf8; border: 1px solid #bbf0d9; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
              <p style="font-size: 14px; color: #085041; font-weight: 700; margin: 0 0 10px;">What you get with Pro:</p>
              <p style="font-size: 14px; color: #333; line-height: 2; margin: 0;">
                ✅ Unlimited listings<br/>
                ✅ AI chat assistant<br/>
                ✅ Scripts library<br/>
                ✅ Seller prep & pricing tools<br/>
                ✅ 11 copy formats<br/>
                ✅ Launch kit & social planner
              </p>
            </div>
            <a href="https://listingwhisperer.com/pricing" style="display: block; text-align: center; padding: 14px; background: linear-gradient(135deg, #1D9E75, #085041); color: #fff; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700; margin-bottom: 1rem;">
              Upgrade to Pro — $20/month →
            </a>
            <p style="text-align: center; font-size: 13px; color: #aaa;">Use code <strong style="color: #1D9E75;">WELCOME50</strong> for 50% off your first month</p>
            <p style="text-align: center; font-size: 12px; color: #ccc; margin-top: 1rem;">Questions? Reply to this email — I read every one. — Adrian</p>
          </div>
          `
        )
        await supabase.from('profiles').update({ trial_expired_email_sent: true }).eq('id', profile.id)
        expiredCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      ending_soon: endingSoonCount,
      expired: expiredCount
    })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}