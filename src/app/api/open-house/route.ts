import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate marketing expert. Generate a complete open house kit for an agent.

Open House Details:
- Address: ${form.address}
- Date: ${form.date}
- Time: ${form.time}
- Beds: ${form.beds} | Baths: ${form.baths} | Sqft: ${form.sqft}
- Price: ${form.price}
- Highlights: ${form.highlights}
- Agent Name: ${form.agentName || 'Your Agent'}
- Agent Phone: ${form.phone || ''}

CRITICAL: You MUST use the exact agent name and phone number provided above in every single output. Never write "Your Agent", "Contact Agent", or any placeholder. If agent name is provided, use it exactly. Same for phone number.

Respond ONLY with valid JSON. All string values must be on a single line with no newline characters. Use \\n for line breaks within strings.

Return exactly this JSON:
{"flyerCopy":"flyer copy here","socialPost":"social post here","reminderText":"sms reminder here","emailInvite":"email invite here","followUpEmail":"follow up email here"}`

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
    const clean = text.replace(/```json|```/g, '').trim()
    
    // Fix any unescaped newlines in JSON strings
    const fixed = clean.replace(/(?<=":"|,\s*"[^"]*":\s*")([^"]*)\n([^"]*)/g, '$1\\n$2')
    const result = JSON.parse(fixed)
    return NextResponse.json({ result })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}