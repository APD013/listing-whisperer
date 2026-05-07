import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendEmail(to: string, subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Adrian from Listing Whisperer <adrian@listingwhisperer.com>',
      to,
      subject,
      html
    })
  })
}

function emailShell(body: string, unsubLink: string): string {
  return `<!DOCTYPE html><html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 16px;">
  <div style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
    <div style="padding:24px 36px;border-bottom:1px solid #f0f0f0;">
      <p style="margin:0;font-size:18px;font-weight:700;color:#111;">Listing<span style="color:#1D9E75;">Whisperer</span></p>
    </div>
    <div style="padding:32px 36px;">${body}</div>
    <div style="padding:16px 36px;background:#f9fafb;border-top:1px solid #f0f0f0;">
      <p style="margin:0;font-size:11px;color:#bbb;text-align:center;">
        Listing Whisperer &middot; <a href="https://listingwhisperer.com" style="color:#bbb;text-decoration:none;">listingwhisperer.com</a>
        &nbsp;&middot;&nbsp;
        <a href="${unsubLink}" style="color:#bbb;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</div>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<div style="margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;">${label}</a>
  </div>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">${text}</p>`
}

function buildDay1Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`A lot of agents spend hours writing listing descriptions, social captions, and emails. You don't have to.`)}
    ${p(`Upload one photo of any property — even one you're about to pitch — and Listing Whisperer will create everything: the description, social captions, email copy, text messages, and more.`)}
    ${ctaButton('https://listingwhisperer.com/quick-listing', 'Try It Now →')}
    ${p('Takes less than 60 seconds.')}
    <p style="margin:24px 0 2px;font-size:15px;color:#333;">Adrian</p>
  `
  return emailShell(body, unsubLink)
}

function buildDay3Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`The agents winning the most listings right now aren't just better at their job — they show up more prepared.`)}
    ${p(`Listing Whisperer has a Seller Prep tool that creates everything you need before a listing appointment: pricing strategy, objection responses, presentation outline, and a follow-up plan.`)}
    ${p('Next time you have a listing appointment, try it. Takes 2 minutes.')}
    ${ctaButton('https://listingwhisperer.com/seller-prep', 'Prep My Next Appointment →')}
    ${p('The AI assistant is also great for on-the-spot questions. Ask it anything.')}
    <p style="margin:24px 0 2px;font-size:15px;color:#333;">Adrian</p>
  `
  return emailShell(body, unsubLink)
}

function buildDay5Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p('Quick update on what Pro agents are doing with Listing Whisperer:')}
    <ul style="margin:0 0 20px;padding-left:20px;font-size:15px;color:#333;line-height:2;">
      <li>Generating full listing marketing in under 2 minutes</li>
      <li>Walking into seller appointments with complete prep kits</li>
      <li>Using the AI to handle objections and write follow-ups on the spot</li>
      <li>Creating 7-day social media calendars for every listing</li>
    </ul>
    ${p('All of this is available in your free trial. Pro unlocks unlimited listings, saved history, and advanced tools.')}
    ${ctaButton('https://listingwhisperer.com/pricing', 'Upgrade to Pro — $20/mo →')}
    <p style="margin:-12px 0 24px;font-size:13px;color:#888;">Use code <strong style="color:#1D9E75;">WELCOME50</strong> for 50% off your first month.</p>
    <p style="margin:0 0 2px;font-size:15px;color:#333;">Adrian</p>
  `
  return emailShell(body, unsubLink)
}

function buildDay7Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p("Your free trial period is wrapping up. Before it does, I want to make sure you've seen the most valuable part of Listing Whisperer.")}
    ${p("The AI assistant isn't just a chatbot — it's a real estate business partner. Ask it to price a listing, write a follow-up, handle a seller objection, or plan your next open house.")}
    ${p("If you've gotten value from the trial, Pro is $20/month — less than a tank of gas and it pays for itself the first time you win a listing.")}
    ${ctaButton('https://listingwhisperer.com/pricing', 'Upgrade to Pro →')}
    <p style="margin:-12px 0 24px;font-size:13px;color:#888;">Use code <strong style="color:#1D9E75;">WELCOME50</strong> for 50% off your first month.</p>
    ${p("Either way — I'm glad you tried it. Good luck out there.")}
    <p style="margin:0 0 2px;font-size:15px;color:#333;">Adrian</p>
    <p style="margin:0 0 20px;font-size:13px;color:#888;">Listing Whisperer</p>
    <p style="margin:0;font-size:13px;color:#888;font-style:italic;">PS — Reply to this email anytime if you have questions. I read every reply.</p>
  `
  return emailShell(body, unsubLink)
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sequences, error } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('unsubscribed', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!sequences?.length) return NextResponse.json({ processed: 0 })

  const now = new Date()
  let processed = 0

  for (const seq of sequences) {
    const hoursElapsed = (now.getTime() - new Date(seq.signed_up_at).getTime()) / (1000 * 60 * 60)
    const unsubLink = `https://listingwhisperer.com/api/email-sequence/unsubscribe?userId=${seq.user_id}`

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', seq.user_id)
      .maybeSingle()
    const firstName = (profile?.full_name as string)?.split(' ')[0] || seq.email.split('@')[0] || 'there'

    if (hoursElapsed >= 24 && !seq.day1_sent) {
      const res = await sendEmail(seq.email, 'Create your first listing in 60 seconds 🏠', buildDay1Html(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day1_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 72 && !seq.day3_sent) {
      const res = await sendEmail(seq.email, 'Your secret weapon for listing appointments 📋', buildDay3Html(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day3_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 120 && !seq.day5_sent) {
      const res = await sendEmail(seq.email, 'Agents using this are winning more listings 🏆', buildDay5Html(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day5_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 168 && !seq.day7_sent) {
      const res = await sendEmail(seq.email, 'Before your trial ends — one thing to try 👀', buildDay7Html(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day7_sent: true }).eq('id', seq.id)
        processed++
      }
    }
  }

  return NextResponse.json({ processed })
}
