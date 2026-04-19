import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const res = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key!,
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ email, password, data: { full_name: name } })
  })

  const data = await res.json()
  if (data.error) return NextResponse.json({ error: data.error.message || data.error })
  return NextResponse.json({ success: true })
}