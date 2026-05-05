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
  "market_summary": "3–4 sentences summarizing current market conditions, demand, and what buyers or sellers can expect in this area.",
  "price_trends": "2–3 paragraphs covering recent price movement, year-over-year changes, and where prices appear to be heading based on current indicators.",
  "inventory_analysis": "2–3 paragraphs covering current inventory levels, typical days on market, absorption rate, and whether supply is rising or falling.",
  "buyer_seller_assessment": "2–3 paragraphs assessing whether this is a buyer's or seller's market, negotiation leverage, and strategic advice for each side.",
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
