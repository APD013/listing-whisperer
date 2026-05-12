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

function buildHtml(body: string): string {
  const paragraphs = body
    .split('\n')
    .map(line => line.trim()
      ? `<p style="margin:0 0 14px;line-height:1.7;">${escapeHtml(line)}</p>`
      : ''
    )
    .join('')

  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#ffffff;color:#333333;">
  ${paragraphs}
  <hr style="border:none;border-top:1px solid #eeeeee;margin:32px 0;" />
  <p style="color:#aaaaaa;font-size:12px;margin:0;">Sent via <a href="https://listingwhisperer.com" style="color:#aaaaaa;">Listing Whisperer</a></p>
</div>`
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

      const personalized = message.replace(/\{\{name\}\}/gi, lead.name || 'there')

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'Listing Whisperer <notifications@listingwhisperer.com>',
            to: lead.email,
            subject,
            html: buildHtml(personalized),
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
