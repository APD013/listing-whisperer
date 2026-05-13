import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { referralCode, newUserId } = await request.json()
    if (!referralCode || !newUserId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    }

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single()

    if (!referrer) {
      return NextResponse.json({ success: false, reason: 'referrer_not_found' })
    }

    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
