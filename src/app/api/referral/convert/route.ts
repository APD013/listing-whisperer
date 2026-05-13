import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('referred_by')
      .eq('id', userId)
      .single()

    if (!profile?.referred_by) {
      return NextResponse.json({ credited: false, reason: 'no_referrer' })
    }

    const { data: referrer } = await supabase
      .from('profiles')
      .select('referral_credits')
      .eq('id', profile.referred_by)
      .single()

    const current = referrer?.referral_credits ?? 0
    await supabase
      .from('profiles')
      .update({ referral_credits: current + 1 })
      .eq('id', profile.referred_by)

    return NextResponse.json({ credited: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
