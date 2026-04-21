import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit, rateLimitResponse } from '../lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { listing, style, userId } = await request.json()

    // Block requests with no userId
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 10 rewrites per minute
    const { allowed } = checkRateLimit(`rewrite_${userId}`, 10, 60000)
    if (!allowed) return rateLimitResponse()

    // Check rewrite limit for free users
    const { data: profile } = await supabase
      .from('profiles')
      .select('rewrites_used, plan')
      .eq('id', userId)
      .single()

    if (profile?.plan === 'starter' && (profile?.rewrites_used || 0) >= 3) {
      return NextResponse.json({ error: 'REWRITE_LIMIT_REACHED' }, { status: 403 })
    }

    const prompt = `You are an expert real estate copywriter. Rewrite the following listing description in a more compelling, polished way. Respond ONLY with valid JSON, no markdown, no backticks.

Original listing:
${listing}

Rewrite style: ${style || 'Professional and compelling'}

Return exactly this JSON:
{"standard":"Rewritten standard MLS version (150-200 words)","luxury":"Luxury/aspirational rewrite (150-200 words)","short":"Short punchy version (50-75 words)","social":"Instagram caption version with hashtags","headline":"5 headline options separated by ---","improvements":"• Improvement 1\n• Improvement 2\n• Improvement 3"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const outputs = JSON.parse(text.replace(/```json|```/g, '').trim())

      // Increment rewrites_used
      await supabase
        .from('profiles')
        .update({ rewrites_used: (profile?.rewrites_used || 0) + 1 })
        .eq('id', userId)

      return NextResponse.json({ outputs })
    } catch(e) {
      return NextResponse.json({ error: 'Parse error: ' + text.substring(0, 200) }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}