import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate marketing expert. Generate a complete price improvement announcement kit for an agent. Use ALL the specific details provided. Respond ONLY with valid JSON, no markdown, no backticks.

Listing Details:
- Address: ${form.address}
- Location: ${form.city ? form.city + ', ' : ''}${form.state || 'not specified'}
- Original Price: ${form.originalPrice}
- New Price: ${form.newPrice}
- Beds: ${form.beds} | Baths: ${form.baths} | Sqft: ${form.sqft}
- Days on Market: ${form.daysOnMarket}
- Highlights: ${form.highlights}
- Agent: ${form.agentName || 'Your Agent'} | Phone: ${form.phone || ''}

IMPORTANT: Use the exact address, prices, and property details in every output. Frame the price change positively as a "price improvement" or "new price" — never as desperation.

Return exactly this JSON with no line breaks inside string values:
{"mlsUpdate":"Updated MLS description highlighting the new price and value opportunity","socialPost":"Instagram and Facebook post announcing the price improvement with emojis and urgency","emailBlast":"Subject line then full email blast to the agent list announcing the new price","smsAlert":"Short SMS alert under 160 characters to send to interested buyers","agentNotes":"Bullet points on how to position this price improvement positively to buyers and buyer agents"}`

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
    const result = JSON.parse(clean)
    return NextResponse.json({ result })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}