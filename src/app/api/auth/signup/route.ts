import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  
const supabase = createClient(
  'https://jddkpjokevdaocovauay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZGtwanNrZXZkc2Fvb3ZhdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjQwOTYsImV4cCI6MjA5MjIwMDA5Nn0.15WHU93W8kpMrT7E_GKsZRJQVZBlDDFbDbB1PiSDlcE'
)

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  })

  if (error) return NextResponse.json({ error: error.message })
  return NextResponse.json({ success: true })
}