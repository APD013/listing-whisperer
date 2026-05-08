import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { neighborhood, state, propertyType, bedrooms, priceMin, priceMax, notes } = await request.json()

    const userPrompt = `Generate a real estate market snapshot for the following:

- Neighborhood / City: ${neighborhood}${state ? ', ' + state : ''}
- Property Type: ${propertyType}
- Bedrooms: ${bedrooms || 'Not specified'}
- Price Range: ${priceMin && priceMax ? `${priceMin} – ${priceMax}` : priceMin || priceMax || 'Not specified'}
- Additional Notes: ${notes || 'None'}

Respond ONLY with valid JSON, no markdown, no backticks. Return exactly this structure:

{
  "market_summary": "2 sentences max on current market conditions.",
  "price_trends": "2 sentences max on recent price movement and direction.",
  "inventory_analysis": "2 sentences max on inventory levels and days on market.",
  "buyer_seller_assessment": "2 sentences max on buyer vs seller leverage and one tip.",
  "client_email": "A short 3–4 sentence professional email to the client summarizing the market. Address as 'Hi [First Name],' and close with '[Your Name]'."
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
