import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/app/lib/auth'

export async function POST(request: Request) {
  try {
    const { form, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 10 per minute
    const { allowed } = checkRateLimit(`sellerprep_${userId}`, 10, 60000)
    if (!allowed) return rateLimitResponse()

    const prompt = `You are an expert real estate agent coach. Create a complete seller meeting preparation kit for this listing appointment. Respond ONLY with valid JSON, no markdown, no backticks.

Property: ${form.type}, ${form.beds}, ${form.sqft ? form.sqft + ' sq ft,' : ''} ${form.address}
Estimated Price: ${form.estimatedPrice || 'unknown'}
Condition: ${form.propertyCondition}
Seller Goals: ${form.sellerGoals || 'unknown'}
Timeframe: ${form.timeframe || 'unknown'}
Agent Name: ${form.agentName || 'Agent'}
Notes: ${form.notes || 'none'}

Return exactly this JSON:
{
"meeting_outline": "Complete step-by-step meeting outline with timing for each section",
"talking_points": "5-7 key talking points the agent should make during the appointment",
"seller_questions": "10 important questions the agent should ask the seller during the meeting",
"marketing_preview": "A preview of the marketing plan the agent can present to the seller",
"selling_angles": "3-5 strongest likely selling angles for this property based on what we know",
"followup_email": "Complete follow-up email to send after the meeting with subject line",
"presentation_intro": "A strong 2-3 paragraph opening statement for the listing presentation"
}`

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
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const outputs = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ outputs })
    } catch(e) {
      return NextResponse.json({ error: 'Could not generate meeting prep' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}