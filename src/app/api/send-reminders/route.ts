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

    return NextResponse.json({ message: `Sent ${sent} reminders` })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}