import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { userId, contactName, reminderType, content, subject, remindAt } = await request.json()

    if (!userId || !remindAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        contact_name: contactName,
        reminder_type: reminderType,
        content: content,
        subject: subject,
        remind_at: remindAt,
        sent: false
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, reminder: data })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('sent', false)
      .gte('remind_at', new Date().toISOString())
      .order('remind_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ reminders: data })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}