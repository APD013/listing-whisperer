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

function buildDay0Html(firstName: string, userId: string): string {
  const unsubLink = `https://listingwhisperer.com/api/email-sequence/unsubscribe?userId=${userId}`
  return `<!DOCTYPE html><html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <p style="margin:0 0 32px;font-size:20px;font-weight:700;color:#1D9E75;">ListingWhisperer</p>
  <p style="margin:0 0 16px;font-size:16px;color:#333333;line-height:1.6;">Hey ${firstName},</p>
  <p style="margin:0 0 16px;font-size:16px;color:#333333;line-height:1.6;">Glad you're here.</p>
  <p style="margin:0 0 16px;font-size:16px;color:#333333;line-height:1.6;">The fastest way to see what Listing Whisperer can do is to create a listing. Takes about 60 seconds. Just upload a photo and add a few notes — the AI handles the rest.</p>
  <p style="margin:0 0 28px;font-size:16px;color:#333333;line-height:1.6;">Give it a try when you have a minute.</p>
  <div style="margin:0 0 32px;">
    <a href="https://listingwhisperer.com/quick-listing"
       style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:12px 24px;border-radius:8px;">
      Create a Listing
    </a>
  </div>
  <p style="margin:0 0 4px;font-size:16px;color:#333333;">Adrian</p>
  <p style="margin:0 0 48px;font-size:14px;color:#999999;">Listing Whisperer</p>
  <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
    <a href="${unsubLink}" style="color:#999999;text-decoration:underline;">Unsubscribe</a>
  </p>
</div>
</body>
</html>`
}

function buildDay0Text(firstName: string, userId: string): string {
  const unsubLink = `https://listingwhisperer.com/api/email-sequence/unsubscribe?userId=${userId}`
  return `Hey ${firstName},

Glad you're here.

The fastest way to see what Listing Whisperer can do is to create a listing. Takes about 60 seconds. Just upload a photo and add a few notes — the AI handles the rest.

Give it a try when you have a minute:
https://listingwhisperer.com/quick-listing

Adrian
Listing Whisperer

---
Unsubscribe: ${unsubLink}`
}

export async function POST(request: Request) {
  try {
    const { userId, email, signedUpAt } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email required' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('email_sequences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, alreadyEnrolled: true })
    }

    const { error: insertError } = await supabase
      .from('email_sequences')
      .insert({
        user_id: userId,
        email,
        signed_up_at: signedUpAt || new Date().toISOString()
      })

    if (insertError) throw insertError

    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const fullName = (authUser?.user?.user_metadata?.full_name as string) || ''
    const firstName = getFirstName(fullName || undefined, email)

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Adrian Dabek <adrian@listingwhisperer.com>',
        reply_to: 'adrian@listingwhisperer.com',
        to: email,
        subject: "You're in — here's where to start",
        html: buildDay0Html(firstName, userId),
        text: buildDay0Text(firstName, userId)
      })
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
