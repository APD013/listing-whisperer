import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@listingwhisperer.com',
    password: 'Demo1234!',
  })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Demo login failed' }, { status: 500 })
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
