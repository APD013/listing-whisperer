import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const { userId, title, description, startDateTime, endDateTime } = await request.json()

  if (!userId || !title || !startDateTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_refresh_token')
    .eq('id', userId)
    .single()

  if (!profile?.google_refresh_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 403 })
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: profile.google_refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    console.error('[calendar/add-event] Token exchange failed:', JSON.stringify(tokenData))
    return NextResponse.json(
      { error: 'Failed to get access token', detail: tokenData.error_description || tokenData.error || null },
      { status: 500 }
    )
  }

  const end = endDateTime || new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString()

  const eventRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        description: description || '',
        start: { dateTime: new Date(startDateTime).toISOString() },
        end: { dateTime: new Date(end).toISOString() },
      }),
    }
  )

  const event = await eventRes.json()

  if (!eventRes.ok) {
    console.error('[calendar/add-event] Google Calendar API error:', JSON.stringify(event))
    return NextResponse.json(
      { error: 'Failed to create event', detail: event.error?.message || null, googleError: event.error || null },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, eventId: event.id, htmlLink: event.htmlLink })
}
