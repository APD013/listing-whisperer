import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const from = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, email, notes, user_id, followup_sent, created_at')
    .eq('source', 'open_house')
    .neq('user_id', 'c8c428ac-eca7-487f-af9d-576544dc8e12')
    .or('followup_sent.is.null,followup_sent.eq.false')
    .neq('email', '')
    .not('email', 'is', null)
    .or(`created_at.lte.${from},created_at.is.null`)

  if (error) {
    console.error('open-house-followup query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const lead of leads) {
    // Leads with no created_at are legacy records — only send if followup_sent was explicitly set to false
    if (lead.created_at === null && lead.followup_sent !== false) continue

    try {
      let agentEmail: string | null = null
      let agentName = 'Your Agent'

      if (lead.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(lead.user_id)
        if (userData?.user?.email) agentEmail = userData.user.email

        const { data: profile } = await supabase
          .from('profiles')
          .select('brand_voice')
          .eq('id', lead.user_id)
          .single()

        if (profile?.brand_voice) {
          try {
            const bv = typeof profile.brand_voice === 'string'
              ? JSON.parse(profile.brand_voice)
              : profile.brand_voice
            if (bv.agentName) agentName = bv.agentName
          } catch {}
        }
      }

      // Extract property name from notes: "Open House: 123 Main St | ..."
      const propertyMatch = lead.notes?.match(/^Open House:\s*([^|]+)/)
      const propertyName = propertyMatch ? propertyMatch[1].trim() : 'the open house'

      const replyTo = agentEmail
        ? `${agentName} <${agentEmail}>`
        : undefined

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Listing Whisperer <notifications@listingwhisperer.com>',
          to: lead.email,
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject: `Thanks for stopping by — ${propertyName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #333;">
              <h2 style="color: #1D9E75; margin-bottom: 8px;">Thanks for visiting!</h2>
              <p>Hi ${lead.name},</p>
              <p>It was great having you at <strong>${propertyName}</strong>. I hope you enjoyed the home — I'd love to answer any questions you have or arrange a private showing if you'd like to take another look.</p>
              <p>Feel free to reply to this email or reach out directly. I'm here to help you find the right home.</p>
              <p style="margin-top: 32px;">Best,<br/><strong>${agentName}</strong></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
              <p style="color: #aaa; font-size: 12px;">Sent via <a href="https://listingwhisperer.com" style="color: #aaa;">Listing Whisperer</a></p>
            </div>
          `,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error(`open-house-followup Resend error for lead ${lead.id}:`, err)
        failed++
        continue
      }

      await supabase
        .from('leads')
        .update({ followup_sent: true })
        .eq('id', lead.id)

      sent++
    } catch (e: any) {
      console.error(`open-house-followup error for lead ${lead.id}:`, e.message)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
