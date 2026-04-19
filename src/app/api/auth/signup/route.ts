import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ 
      email, 
      password, 
      data: { full_name: name } 
    })
  })

  const data = await res.json()
  
  if (data.error) return NextResponse.json({ error: data.error.message })
  if (data.id) return NextResponse.json({ success: true })
  return NextResponse.json({ error: 'Signup failed, please try again.' })
}