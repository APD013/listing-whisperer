import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate marketing expert. Generate a complete open house kit for an agent. Respond ONLY with valid JSON, no markdown, no backticks.

Open House Details:
- Address: ${form.address}
- Date: ${form.date}
- Time: ${form.time}
- Beds: ${form.beds} | Baths: ${form.baths} | Sqft: ${form.sqft}
- Price: ${form.price}
- Highlights: ${form.highlights}
- Agent: ${form.agentName || 'Agent'} | Phone: ${form.phone || ''}

Return exactly this JSON:
{"flyerCopy":"Full print-ready flyer copy with headline, subheadline, property details, and agent contact","socialPost":"Instagram and Facebook post announcing the open house with emojis and hashtags","reminderText":"Short SMS reminder to send the day before the open house","emailInvite":"Full email invite with subject line to send to the agent's list","followUpEmail":"Thank you follow-up email to send to open house attendees"}`

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
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ result })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}