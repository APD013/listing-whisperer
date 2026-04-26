import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { form } = await req.json()

    const prompt = `You are an expert real estate pricing strategist helping a licensed real estate agent prepare for a seller listing appointment.

Property Details:
- Type: ${form.propertyType}
- Beds: ${form.beds} | Baths: ${form.baths}
- Square Footage: ${form.sqft}
- Condition: ${form.condition}
- Neighborhood: ${form.neighborhood}
- Upgrades/Features: ${form.upgrades || 'None specified'}
- Comparable Sales: ${form.comps || 'None provided'}
- Additional Notes: ${form.notes || 'None'}

Generate a comprehensive pricing strategy report for the agent. Return ONLY a valid JSON object with these exact keys:

{
  "priceRange": "e.g. $875,000 – $925,000",
  "confidence": "e.g. Moderate confidence — limited comp data provided",
  "strategy": "2-3 paragraphs on how to price and position this listing strategically",
  "sellerTalkingPoints": "Bullet points the agent can use to explain the recommended price to the seller. Should be persuasive, clear, and seller-friendly.",
  "keyFactors": "Bullet points listing the key factors that drove this price recommendation — condition, location, upgrades, market, comps, etc.",
  "objectionResponses": "3-4 common seller objections (e.g. 'I think it's worth more') with smart, professional agent responses",
  "marketPositioning": "How this home compares to the current market — is it priced to move fast, priced at market, or priced for max value? What buyer profile is this targeting?"
}

Be specific, professional, and genuinely useful for a real estate agent. Do not include any text outside the JSON object.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('Pricing assistant error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}