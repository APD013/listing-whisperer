import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // Get all unsent reminders that are due
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*, profiles(email, full_name)')
      .eq('sent', false)
      .lte('remind_at', new Date().toISOString())

    if (error) throw error
    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No reminders to send' })
    }

    let sent = 0

    for (const reminder of reminders) {
      const userEmail = (reminder.profiles as any)?.email
      if (!userEmail) continue

      // Send email via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Listing Whisperer <reminders@listingwhisperer.com>',
          to: userEmail,
          subject: `⏰ Reminder: ${reminder.subject || 'Follow up with ' + reminder.contact_name}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9fafb;">
              <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
                <div style="margin-bottom: 24px;">
                  <h1 style="font-size: 20px; font-weight: 700; color: #111; margin: 0 0 8px;">
                    ⏰ Time to follow up
                  </h1>
                  <p style="font-size: 14px; color: #666; margin: 0;">
                    You set a reminder for <strong>${reminder.contact_name}</strong>
                  </p>
                </div>
                
                <div style="background: #f0fdf8; border: 1px solid #bbf0d9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <p style="font-size: 12px; font-weight: 700; color: #085041; margin: 0 0 8px; letter-spacing: 0.5px; text-transform: uppercase;">${reminder.reminder_type}</p>
                  <p style="font-size: 14px; color: #333; margin: 0; white-space: pre-wrap; line-height: 1.7;">${reminder.content}</p>
                </div>

                <a href="https://listingwhisperer.com/dashboard" 
                  style="display: inline-block; background: #1D9E75; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  Open Dashboard →
                </a>

                <p style="font-size: 12px; color: #aaa; margin-top: 24px; margin-bottom: 0;">
                  Listing Whisperer · <a href="https://listingwhisperer.com" style="color: #aaa;">listingwhisperer.com</a>
                </p>
              </div>
            </div>
          `
        })
      })

      if (res.ok) {
        // Mark as sent
        await supabase
          .from('reminders')
          .update({ sent: true })
          .eq('id', reminder.id)
        sent++
      }
    }

    // TRIAL EMAILS
    const now = new Date()
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_ends_at, plan, trial_ending_email_sent, trial_expired_email_sent')
      .eq('plan', 'starter')
      .not('trial_ends_at', 'is', null)

    let endingSoonCount = 0
    let expiredCount = 0

    if (profiles) {
      for (const profile of profiles) {
        const trialEnds = new Date(profile.trial_ends_at)
        const name = profile.full_name?.split(' ')[0] || 'there'

        // TRIAL ENDING SOON
        if (trialEnds > now && trialEnds < in2Hours && !profile.trial_ending_email_sent) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({
              from: 'Adrian at Listing Whisperer <adrian@listingwhisperer.com>',
              to: profile.email,
              subject: '⏰ Your Listing Whisperer trial ends soon',
              html: `
                <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem;">
                  <h1 style="font-size: 24px; font-weight: 700; color: #111;">Listing<span style="color: #1D9E75;">Whisperer</span></h1>
                  <h2 style="font-size: 20px; font-weight: 700; color: #111;">Hey ${name}, your trial ends in 2 hours ⏰</h2>
                  <p style="font-size: 15px; color: #555; line-height: 1.7;">Don't lose access to your AI assistant, scripts, seller prep tools, and everything else.</p>
                  <div style="background: #f0fdf8; border: 1px solid #bbf0d9; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
                    <p style="font-size: 14px; color: #333; line-height: 2; margin: 0;">
                      ✅ Unlimited listings<br/>✅ AI chat assistant<br/>✅ Seller prep & pricing tools<br/>✅ 11 copy formats<br/>✅ Launch kit & social planner
                    </p>
                  </div>
                  <a href="https://listingwhisperer.com/pricing" style="display: block; text-align: center; padding: 14px; background: #1D9E75; color: #fff; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700;">Upgrade to Pro — $20/month →</a>
                  <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 1rem;">Use code <strong style="color: #1D9E75;">WELCOME50</strong> for 50% off your first month</p>
                </div>
              `
            })
          })
          await supabase.from('profiles').update({ trial_ending_email_sent: true }).eq('id', profile.id)
          endingSoonCount++
        }

        // TRIAL EXPIRED
        if (trialEnds < now && trialEnds > oneHourAgo && !profile.trial_expired_email_sent) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({
              from: 'Adrian at Listing Whisperer <adrian@listingwhisperer.com>',
              to: profile.email,
              subject: '🔒 Your Listing Whisperer trial has ended',
              html: `
                <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem;">
                  <h1 style="font-size: 24px; font-weight: 700; color: #111;">Listing<span style="color: #1D9E75;">Whisperer</span></h1>
                  <h2 style="font-size: 20px; font-weight: 700; color: #111;">Hey ${name}, your trial has ended 🔒</h2>
                  <p style="font-size: 15px; color: #555; line-height: 1.7;">Upgrade now to keep using your AI assistant, scripts, seller prep, and all your tools — just $20/month.</p>
                  <div style="background: #f0fdf8; border: 1px solid #bbf0d9; border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0;">
                    <p style="font-size: 14px; color: #333; line-height: 2; margin: 0;">
                      ✅ Unlimited listings<br/>✅ AI chat assistant<br/>✅ Seller prep & pricing tools<br/>✅ 11 copy formats<br/>✅ Launch kit & social planner
                    </p>
                  </div>
                  <a href="https://listingwhisperer.com/pricing" style="display: block; text-align: center; padding: 14px; background: #1D9E75; color: #fff; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 700;">Upgrade to Pro — $20/month →</a>
                  <p style="text-align: center; font-size: 13px; color: #aaa; margin-top: 1rem;">Use code <strong style="color: #1D9E75;">WELCOME50</strong> for 50% off your first month</p>
                  <p style="text-align: center; font-size: 12px; color: #ccc; margin-top: 1rem;">Questions? Reply to this email — I read every one. — Adrian</p>
                </div>
              `
            })
          })
          await supabase.from('profiles').update({ trial_expired_email_sent: true }).eq('id', profile.id)
          expiredCount++
        }
      }
    }

    return NextResponse.json({ message: `Sent ${sent} reminders, ${endingSoonCount} trial ending soon, ${expiredCount} trial expired` })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}