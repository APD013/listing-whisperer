import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { neighborhood, propertyType, bedrooms, priceMin, priceMax, notes } = await request.json()

    const userPrompt = `Generate a real estate market snapshot for the following:

- Neighborhood / City: ${neighborhood}
- Property Type: ${propertyType}
- Bedrooms: ${bedrooms || 'Not specified'}
- Price Range: ${priceMin && priceMax ? `${priceMin} – ${priceMax}` : priceMin || priceMax || 'Not specified'}
- Additional Notes: ${notes || 'None'}

Respond ONLY with valid JSON, no markdown, no backticks. Return exactly this structure:

{
  "market_summary": "2–3 sentences summarizing current market conditions and what buyers or sellers can expect.",
  "price_trends": "1–2 short paragraphs covering recent price movement and where prices appear to be heading.",
  "inventory_analysis": "1–2 short paragraphs covering inventory levels, days on market, and whether supply is rising or falling.",
  "buyer_seller_assessment": "1–2 short paragraphs on whether this is a buyer's or seller's market and strategic advice.",
  "client_email": "A complete, professional, ready-to-send email from the agent to their client summarizing the market snapshot. Use a warm but professional tone. Address the client as 'Hi [First Name],' and close with '[Your Name]'. Do not use any placeholder company names or mention any specific AI tools — attribute all insights to your market analysis and local expertise."
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
        max_tokens: 1000,
        system: 'You are a real estate market analyst. Return ONLY valid JSON.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: cleaned }, { status: 500 })
    }
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
