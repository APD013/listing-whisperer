import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: alreadyEnrolled } = await supabase
    .from('email_sequences')
    .select('user_id')

  const enrolledIds = new Set((alreadyEnrolled || []).map((r: any) => r.user_id))

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, created_at')

  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })

  const unenrolled = (profiles || []).filter((p: any) => !enrolledIds.has(p.id))

  let enrolled = 0
  const now = new Date()

  for (const profile of unenrolled) {
    const { data: authData } = await supabase.auth.admin.getUserById(profile.id)
    const email = authData?.user?.email
    if (!email) continue

    const signedUpAt = profile.created_at || new Date().toISOString()
    const hoursElapsed = (now.getTime() - new Date(signedUpAt).getTime()) / (1000 * 60 * 60)

    const { error: insertError } = await supabase
      .from('email_sequences')
      .insert({
        user_id: profile.id,
        email,
        signed_up_at: signedUpAt,
        day1_sent: hoursElapsed >= 24,
        day3_sent: hoursElapsed >= 72,
        day5_sent: hoursElapsed >= 120,
        day7_sent: hoursElapsed >= 168
      })

    if (!insertError) enrolled++
  }

  return NextResponse.json({ enrolled })
}
