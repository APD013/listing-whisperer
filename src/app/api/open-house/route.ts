import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate marketing expert. Generate a complete open house kit for an agent. Use ALL the specific details provided below. Respond ONLY with valid JSON, no markdown, no backticks.

Open House Details:
- Address: ${form.address}
- Date: ${form.date}
- Time: ${form.time}
- Beds: ${form.beds} | Baths: ${form.baths} | Sqft: ${form.sqft}
- Price: ${form.price}
- Highlights: ${form.highlights}
- Agent Name: ${form.agentName || 'Your Agent'}
- Agent Phone: ${form.phone || ''}

IMPORTANT: Use the exact address, date, time, price, beds, baths, sqft, highlights, and agent name in every output. Do not use placeholder text like "Contact Agent" or "TBA".

Return exactly this JSON with no line breaks inside string values:
{"flyerCopy":"Full print-ready flyer copy with the exact address, date, time, price, beds, baths, sqft, highlights and agent contact info","socialPost":"Instagram and Facebook post with the exact date, time, address, price and highlights — include emojis and hashtags","reminderText":"Short SMS reminder with the exact date, time and address to send the day before","emailInvite":"Subject: [write subject here]\n\n[Full email body with exact date, time, address, price and highlights]","followUpEmail":"Subject: [write subject here]\n\n[Thank you follow-up email to send to open house attendees]"}`

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