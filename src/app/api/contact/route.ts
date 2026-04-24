import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { name, email, subject, message, type } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Listing Whisperer <hello@listingwhisperer.com>',
        to: ['apd013@yahoo.com'],
        subject: `[${type}] ${subject || 'New Contact Form Submission'}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1D9E75;">New Contact Form Submission</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #666;">Type:</td>
                <td style="padding: 8px;">${type}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 8px; font-weight: bold; color: #666;">Name:</td>
                <td style="padding: 8px;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 8px; font-weight: bold; color: #666;">Subject:</td>
                <td style="padding: 8px;">${subject || 'N/A'}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 16px; background: #f0fdf8; border-radius: 8px; border-left: 4px solid #1D9E75;">
              <p style="font-weight: bold; color: #085041; margin: 0 0 8px;">Message:</p>
              <p style="color: #333; margin: 0; line-height: 1.7;">${message}</p>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Sent from listingwhisperer.com contact form
            </p>
          </div>
        `
      })
    })

    if (res.ok) {
      return NextResponse.json({ success: true })
    } else {
      const err = await res.text()
      console.error('Resend error:', err)
      return NextResponse.json({ success: true }) // Still show success to user
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}