import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getFirstName(name: string | undefined, email: string): string {
  const raw = (name || email.split('@')[0].split('.')[0]).split(' ')[0]
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Adrian Dabek <adrian@listingwhisperer.com>',
      reply_to: 'adrian@listingwhisperer.com',
      to,
      subject,
      html,
      text
    })
  })
}

function emailShell(body: string, unsubLink: string): string {
  return `<!DOCTYPE html><html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#1D9E75;">ListingWhisperer</p>
  ${body}
  <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
    <a href="${unsubLink}" style="color:#999999;text-decoration:underline;">Unsubscribe</a>
  </p>
</div>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<div style="margin:0 0 32px;">
    <a href="${href}" style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:12px 24px;border-radius:8px;">${label}</a>
  </div>`
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;color:#333333;line-height:1.6;">${text}</p>`
}

function sig(): string {
  return `<p style="margin:0 0 4px;font-size:16px;color:#333333;">Adrian</p>
  <p style="margin:0 0 48px;font-size:14px;color:#999999;">Listing Whisperer</p>`
}

function buildDay1Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`Most agents I talk to spend way too long on listing descriptions, captions, and emails.`)}
    ${p(`Listing Whisperer cuts that down to about 60 seconds. Upload any listing photo, add some notes, and it creates the description, social captions, email copy, and more.`)}
    ${p(`Worth trying if you haven't yet.`)}
    ${ctaButton('https://listingwhisperer.com/quick-listing', 'Try It Now')}
    ${sig()}
  `
  return emailShell(body, unsubLink)
}

function buildDay1Text(firstName: string, unsubLink: string): string {
  return `Hey ${firstName},

Most agents I talk to spend way too long on listing descriptions, captions, and emails.

Listing Whisperer cuts that down to about 60 seconds. Upload any listing photo, add some notes, and it creates the description, social captions, email copy, and more.

Worth trying if you haven't yet:
https://listingwhisperer.com/quick-listing

Adrian
Listing Whisperer

---
Unsubscribe: ${unsubLink}`
}

function buildDay3Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`One thing agents tell me makes a big difference — showing up to listing appointments more prepared than the seller expects.`)}
    ${p(`There's a Seller Prep tool in Listing Whisperer that puts together your pricing strategy, objection responses, and presentation outline in a couple of minutes.`)}
    ${p(`Might be worth trying before your next one.`)}
    ${ctaButton('https://listingwhisperer.com/seller-prep', 'Open Seller Prep')}
    ${sig()}
  `
  return emailShell(body, unsubLink)
}

function buildDay3Text(firstName: string, unsubLink: string): string {
  return `Hey ${firstName},

One thing agents tell me makes a big difference — showing up to listing appointments more prepared than the seller expects.

There's a Seller Prep tool in Listing Whisperer that puts together your pricing strategy, objection responses, and presentation outline in a couple of minutes.

Might be worth trying before your next one:
https://listingwhisperer.com/seller-prep

Adrian
Listing Whisperer

---
Unsubscribe: ${unsubLink}`
}

function buildDay5Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`A lot of agents use Listing Whisperer for listings — but the follow-up tools are where it really pays off.`)}
    ${p(`There's a Follow-Up Sequence tool that writes a complete series of emails, texts, and voicemail scripts for any lead situation. After a showing, an open house, a cold lead — it handles all of it.`)}
    ${ctaButton('https://listingwhisperer.com/follow-up-sequence', 'See Follow-Up Sequences')}
    ${sig()}
  `
  return emailShell(body, unsubLink)
}

function buildDay5Text(firstName: string, unsubLink: string): string {
  return `Hey ${firstName},

A lot of agents use Listing Whisperer for listings — but the follow-up tools are where it really pays off.

There's a Follow-Up Sequence tool that writes a complete series of emails, texts, and voicemail scripts for any lead situation. After a showing, an open house, a cold lead — it handles all of it.

https://listingwhisperer.com/follow-up-sequence

Adrian
Listing Whisperer

---
Unsubscribe: ${unsubLink}`
}

function buildDay7Html(firstName: string, unsubLink: string): string {
  const body = `
    ${p(`Hey ${firstName},`)}
    ${p(`Just checking in — have you had a chance to try Listing Whisperer yet?`)}
    ${p(`If something got in the way or you have questions, just reply to this email. I read every one.`)}
    ${p(`If you have tried it and want to keep going, the Pro plan is $20/month. Use WELCOME50 for 50% off your first month.`)}
    ${ctaButton('https://listingwhisperer.com/pricing', 'Continue with Pro')}
    ${sig()}
  `
  return emailShell(body, unsubLink)
}

function buildDay7Text(firstName: string, unsubLink: string): string {
  return `Hey ${firstName},

Just checking in — have you had a chance to try Listing Whisperer yet?

If something got in the way or you have questions, just reply to this email. I read every one.

If you have tried it and want to keep going, the Pro plan is $20/month. Use WELCOME50 for 50% off your first month.

https://listingwhisperer.com/pricing

Adrian
Listing Whisperer

---
Unsubscribe: ${unsubLink}`
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
    const firstName = getFirstName(profile?.full_name || undefined, seq.email)

    if (hoursElapsed >= 24 && !seq.day1_sent) {
      const res = await sendEmail(seq.email, 'One photo is all you need', buildDay1Html(firstName, unsubLink), buildDay1Text(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day1_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 72 && !seq.day3_sent) {
      const res = await sendEmail(seq.email, 'Before your next listing appointment', buildDay3Html(firstName, unsubLink), buildDay3Text(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day3_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 120 && !seq.day5_sent) {
      const res = await sendEmail(seq.email, 'The part most agents miss', buildDay5Html(firstName, unsubLink), buildDay5Text(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day5_sent: true }).eq('id', seq.id)
        processed++
      }
    }

    if (hoursElapsed >= 168 && !seq.day7_sent) {
      const res = await sendEmail(seq.email, 'Quick question', buildDay7Html(firstName, unsubLink), buildDay7Text(firstName, unsubLink))
      if (res.ok) {
        await supabase.from('email_sequences').update({ day7_sent: true }).eq('id', seq.id)
        processed++
      }
    }
  }

  return NextResponse.json({ processed })
}
