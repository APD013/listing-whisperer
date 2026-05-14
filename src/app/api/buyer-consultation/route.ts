import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/app/lib/auth'

export async function POST(request: Request) {
  try {
    const { form, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { allowed } = checkRateLimit(`buyerconsultation_${userId}`, 10, 60000)
    if (!allowed) return rateLimitResponse()

    const prompt = `You are an expert real estate agent coach. Create a complete buyer consultation kit for this buyer appointment. Respond ONLY with valid JSON, no markdown, no backticks.

Buyer Name: ${form.buyerName || 'Buyer'}
Budget / Price Range: ${form.budget || 'unknown'}
Desired Neighborhood: ${form.neighborhood || 'unknown'}
Property Type: ${form.type}
Beds Needed: ${form.beds || 'unknown'}
Baths Needed: ${form.baths || 'unknown'}
Sq Ft Needed: ${form.sqft || 'not specified'}
Timeline to Buy: ${form.timeline || 'unknown'}
Pre-Approval Status: ${form.preApproval}
Must-Have Features: ${form.mustHaves || 'none specified'}
Deal Breakers: ${form.dealBreakers || 'none specified'}
Agent Name: ${form.agentName || 'Agent'}
Notes: ${form.notes || 'none'}

Return exactly this JSON:
{
"consultation_outline": "Complete step-by-step meeting outline with timing for each section, covering rapport building, needs discovery, process overview, and next steps",
"questions_to_ask": "10-12 important questions the agent should ask the buyer during the consultation to fully understand their needs, lifestyle, priorities, and concerns",
"needs_assessment": "A structured summary of this buyer's needs, wants, and priorities based on the information provided — formatted so the agent can reference it quickly during the search",
"financing_talking_points": "How to discuss pre-approval status and financing with this buyer — including what to cover if they are not yet approved, how to explain the importance of getting pre-approved, and lender referral talking points",
"property_search_strategy": "A tailored search strategy for this buyer — which areas to focus on, what to watch for in listings, how to approach showings, and how to set realistic expectations given their budget and criteria",
"followup_email": "Complete follow-up email to send after the meeting with subject line — thanking them for their time, recapping their key criteria, outlining next steps, and reinforcing your value as their agent"
}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
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
      return NextResponse.json({ error: 'Could not generate consultation kit' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
