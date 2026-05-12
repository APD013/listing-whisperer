import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { contactName, situationType, notes, touchpoints, tone, brandVoice, userId } = await request.json()

    const bv = brandVoice || {}
    const agentName = bv.agentName || 'the agent'
    const brokerage = bv.brokerage || ''
    const phone = bv.phone || ''
    const preferredTone = bv.preferredTone || tone || 'warm and conversational'
    const uniqueStyle = bv.uniqueStyle || ''
    const avoidWords: string[] = Array.isArray(bv.avoidWords) ? bv.avoidWords : []

    const numTouchpoints = parseInt(touchpoints) || 5

    const systemPrompt = 'You are a real estate follow-up expert who writes personalized, non-salesy follow-up sequences for real estate agents. Return ONLY valid JSON, no markdown, no backticks.'

    const userPrompt = `Generate a ${numTouchpoints}-touchpoint follow-up sequence for a real estate agent.

Agent: ${agentName}${brokerage ? ` at ${brokerage}` : ''}${phone ? ` | ${phone}` : ''}
Contact Name: ${contactName}
Situation: ${situationType}
Notes: ${notes || 'No additional notes'}
Tone: ${tone} — also match: ${preferredTone}
Agent Unique Style: ${uniqueStyle || 'authentic and relationship-focused'}
Words to NEVER use: ${avoidWords.length ? avoidWords.join(', ') : 'none specified'}

Rules:
- Every touchpoint must sound like ${agentName} personally wrote it — not a template
- The tone should be ${tone.toLowerCase()} throughout
- Emails: compelling subject line + 3-5 sentence body
- Text messages: under 160 characters, conversational
- Voicemail scripts: under 30 seconds when spoken
- Each touchpoint has a clear purpose (check-in, value-add, re-engagement, etc.)
- Space the sequence naturally based on ${numTouchpoints} touchpoints (Day 1, 3, 7, 14, 21, 30, 45)
- Personalize specifically to ${contactName} and the "${situationType}" context
- Never mention Listing Whisperer, Claude, or any AI tool name
- Never use any of the avoid words

Respond ONLY with valid JSON:
{
  "sequence": [
    {
      "day": 1,
      "email_subject": "subject line here",
      "email_body": "full email body here",
      "text_message": "short text message here",
      "voicemail_script": "voicemail script here"
    }
  ]
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    const parsed = JSON.parse(jsonMatch[0])
    const sequence = parsed.sequence || []

    if (userId) {
      const { error: insertError } = await supabase.from('follow_up_sequences').insert({
        user_id: userId,
        contact_name: contactName,
        situation_type: situationType,
        notes,
        touchpoints: numTouchpoints,
        tone,
        sequence,
      })
      if (insertError) console.error('follow_up_sequences insert error:', insertError.message)
    }

    return NextResponse.json({ sequence })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
