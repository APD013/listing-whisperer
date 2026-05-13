import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== 'Bearer lw-cron-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('profiles')
    .update({ staging_credits: 3, staging_credits_reset_at: today })
    .eq('plan', 'pro')
    .select('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reset: true, count: data?.length ?? 0 })
}
