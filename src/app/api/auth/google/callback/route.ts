import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect('https://listingwhisperer.com/settings?google=error')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: 'https://listingwhisperer.com/api/auth/google/callback',
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()

  if (!tokens.refresh_token) {
    return NextResponse.redirect('https://listingwhisperer.com/settings?google=error')
  }

  await supabase
    .from('profiles')
    .update({ google_refresh_token: tokens.refresh_token, google_connected: true })
    .eq('id', userId)

  return NextResponse.redirect('https://listingwhisperer.com/settings?google=connected')
}
