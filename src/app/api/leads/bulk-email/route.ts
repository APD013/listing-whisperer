import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(body: string, agentName: string, brokerage: string): string {
  const paragraphs = body
    .split('\n')
    .map(line =>
      line.trim()
        ? `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${escapeHtml(line)}</p>`
        : ''
    )
    .join('')

  const brokerageLine = brokerage
    ? `<p style="margin:4px 0 0;font-size:13px;color:#666;">${escapeHtml(brokerage)}</p>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#222;">

  ${paragraphs}

  <div style="border-top:2px solid #1D9E75;padding-top:20px;margin-top:32px;">
    <p style="margin:0;font-weight:600;font-size:15px;color:#111;">${escapeHtml(agentName)}</p>
    ${brokerageLine}
    <p style="margin:4px 0 0;font-size:13px;color:#666;">Sent via <a href="https://listingwhisperer.com" style="color:#1D9E75;text-decoration:none;">Listing Whisperer</a></p>
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
  <p style="color:#aaa;font-size:11px;text-align:center;margin:0;">
    You're receiving this from your real estate agent.<br/>
    <a href="https://listingwhisperer.com" style="color:#aaa;">listingwhisperer.com</a>
  </p>

</div>
</body>
</html>`
}

export async function POST(request: Request) {
  try {
    const { leadIds, subject, message, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 })
    }

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    if (leadIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 recipients per blast' }, { status: 400 })
    }

    // Fetch agent brand voice and email once for all sends
    let agentName = 'Your Agent'
    let brokerage = ''
    let agentEmail: string | undefined

    const [{ data: profile }, { data: authData }] = await Promise.all([
      supabase.from('profiles').select('brand_voice').eq('id', userId).single(),
      supabase.auth.admin.getUserById(userId),
    ])

    if (profile?.brand_voice) {
      try {
        const bv = typeof profile.brand_voice === 'string'
          ? JSON.parse(profile.brand_voice)
          : profile.brand_voice
        if (bv.agentName) agentName = bv.agentName
        if (bv.brokerage) brokerage = bv.brokerage
      } catch {}
    }

    if (authData?.user?.email) {
      agentEmail = authData.user.email
    }

    const fromHeader = `${agentName} via Listing Whisperer <notifications@listingwhisperer.com>`

    // Fetch only leads that belong to this user
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, email')
      .in('id', leadIds)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ error: 'No valid leads found' }, { status: 404 })
    }

    let sent = 0
    let failed = 0
    const today = new Date().toISOString().split('T')[0]

    for (const lead of leads) {
      if (!lead.email) continue

      const firstName = (lead.name || 'there').split(' ')[0]
      const personalizedMessage = (message || '').replace(/\{\{name\}\}/gi, firstName)

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: fromHeader,
            to: lead.email,
            ...(agentEmail ? { reply_to: agentEmail } : {}),
            subject,
            html: buildHtml(personalizedMessage, agentName, brokerage),
          }),
        })

        if (res.ok) {
          await supabase
            .from('leads')
            .update({ last_contacted: today })
            .eq('id', lead.id)
          sent++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }

    return NextResponse.json({ sent, failed })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
