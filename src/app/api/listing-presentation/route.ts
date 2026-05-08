import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate coach. Generate a listing presentation kit. Be concise. Respond ONLY with valid JSON, no markdown, no backticks.

Agent: ${form.agentName || 'Agent'} | Brokerage: ${form.brokerage || ''} | Experience: ${form.agentExperience || ''}
Seller: ${form.sellerName} | Property: ${form.propertyAddress}
Location: ${form.city ? form.city + ', ' : ''}${form.state || 'not specified'}
Price: ${form.targetPrice || 'TBD'} | Goal: ${form.sellerGoals || ''} | Timeframe: ${form.timeframe || ''}
Unique Value: ${form.uniqueValue || ''}
Competition: ${form.competition || 'None specified'}

Return this JSON with concise but high quality content:
{"openingStatement":"2 paragraph warm confident opening statement using seller name and property","marketingPlan":"Marketing plan covering photography, MLS, social, email, open house","whyListWithMe":"3 paragraphs on why choose this agent using their experience and unique value","pricingStrategy":"Pricing strategy and how to maximize value","objectionHandling":"4 objections with responses covering commission, price, and competition","closingScript":"Closing script to ask for the listing agreement","followUpPlan":"3 step follow-up plan if they don't sign that day"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
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