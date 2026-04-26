import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are an expert real estate coach helping a top agent prepare a winning listing presentation. Use ALL the specific details provided. Respond ONLY with valid JSON, no markdown, no backticks.

Agent Details:
- Agent: ${form.agentName || 'Your Agent'}
- Brokerage: ${form.brokerage || 'Not specified'}
- Experience: ${form.agentExperience || 'Not specified'}
- Unique Value: ${form.uniqueValue || 'Not specified'}

Seller & Property:
- Seller: ${form.sellerName}
- Address: ${form.propertyAddress}
- Type: ${form.propertyType} | Beds/Baths: ${form.beds} | Sqft: ${form.sqft}
- Target Price: ${form.targetPrice || 'Not specified'}
- Seller Goal: ${form.sellerGoals || 'Not specified'}
- Timeframe: ${form.timeframe || 'Not specified'}
- Competition: ${form.competition || 'Not specified'}

IMPORTANT: Make everything specific to this agent, seller, and property. Use their names. Make it feel personal and prepared, not generic.

Return exactly this JSON with no line breaks inside string values:
{"openingStatement":"A warm, confident 2-3 paragraph opening statement the agent delivers at the start of the presentation to build rapport and set the tone","marketingPlan":"Complete marketing plan for this listing including photography, MLS, social media, email, open house, and digital strategy — specific and impressive","whyListWithMe":"Compelling 3-4 paragraph section on why this seller should choose this agent over the competition — use the agent's experience and unique value","pricingStrategy":"Clear pricing strategy explanation including how the agent will price the home, what factors matter, and how to get maximum value","objectionHandling":"5 common seller objections with confident professional responses — include objections about commission, price, and competition","closingScript":"Word-for-word closing script the agent uses at the end of the presentation to ask for the listing agreement confidently","followUpPlan":"Step by step follow-up plan if seller doesn't sign that day — what to send, when to call, how to stay top of mind"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Anthropic error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    if (!text) return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    const clean = text.replace(/```json|```/g, '').trim()
    try {
      const result = JSON.parse(clean)
      return NextResponse.json({ result })
    } catch(parseError) {
      return NextResponse.json({ error: 'Parse failed: ' + clean.substring(0, 200) }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}