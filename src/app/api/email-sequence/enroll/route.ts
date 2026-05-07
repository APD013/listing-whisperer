import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function buildDay0Html(firstName: string, userId: string): string {
  const unsubLink = `https://listingwhisperer.com/api/email-sequence/unsubscribe?userId=${userId}`
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
    <div style="padding:32px 36px;">
      <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">Hey ${firstName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#333;line-height:1.7;">
        You just unlocked something most agents don't have — an AI assistant built specifically for real estate.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#333;line-height:1.7;">
        Here's what I'd do first: create your first listing. Upload one photo, add a few notes, and watch what happens.
      </p>
      <div style="margin:0 0 28px;">
        <a href="https://listingwhisperer.com/quick-listing"
           style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;">
          Create My First Listing
        </a>
      </div>
      <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.7;">
        Or ask the AI anything — pricing strategy, seller objections, follow-up messages. It's all in there.
      </p>
      <p style="margin:0 0 2px;font-size:15px;color:#333;">Adrian</p>
      <p style="margin:0;font-size:13px;color:#888;">Listing Whisperer</p>
    </div>
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
    const firstName = fullName.split(' ')[0] || email.split('@')[0] || 'there'

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Adrian from Listing Whisperer <adrian@listingwhisperer.com>',
        to: email,
        subject: 'Welcome to Listing Whisperer 👋',
        html: buildDay0Html(firstName, userId)
      })
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
