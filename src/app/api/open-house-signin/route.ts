import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { name, email, phone, source_detail, listing_id } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Look up listing to get agent's user_id and listing name
    let agentUserId = null
    let listingName = 'your open house'
    let agentEmail = null

    if (listing_id) {
      const { data: listing } = await supabase
        .from('listings')
        .select('user_id, name')
        .eq('id', listing_id)
        .single()

      if (listing) {
        agentUserId = listing.user_id
        listingName = listing.name || 'your open house'

        // Get agent email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(listing.user_id)
        if (userData?.user?.email) {
          agentEmail = userData.user.email
        }
      }
    }

    // Save lead
    const { error } = await supabase.from('leads').insert({
      name: name.trim(),
      email: email?.trim() || '',
      phone: phone?.trim() || '',
      source: 'open_house',
      notes: source_detail ? `Open House: ${listingName} | How they heard: ${source_detail}` : `Open House: ${listingName}`,
      user_id: agentUserId,
      status: 'New Lead',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email notification to agent via Resend
    if (agentEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Listing Whisperer <notifications@listingwhisperer.com>',
          to: agentEmail,
          subject: `🏡 New Open House Visitor — ${listingName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1D9E75;">New Open House Visitor</h2>
              <p style="color: #555;">Someone just signed in at <strong>${listingName}</strong>.</p>
              <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Name:</strong> ${name.trim()}</p>
                ${email ? `<p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>` : ''}
                ${phone ? `<p style="margin: 4px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
                ${source_detail ? `<p style="margin: 4px 0;"><strong>How they heard:</strong> ${source_detail}</p>` : ''}
              </div>
              <p style="color: #555;">This lead has been saved to your <a href="https://listingwhisperer.com/leads" style="color: #1D9E75;">Leads & Clients</a> automatically.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #aaa; font-size: 12px;">Listing Whisperer · AI Assistant for Real Estate Agents</p>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
