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

    const hasComps = form.comps && form.comps.some((c: any) => c.address)
    const validComps = hasComps ? form.comps.filter((c: any) => c.address) : []

    const prompt = `You are an expert real estate agent coach. Create a complete seller meeting preparation kit for this listing appointment. Respond ONLY with valid JSON, no markdown, no backticks.

Property: ${form.type}, ${form.beds}, ${form.sqft ? form.sqft + ' sq ft,' : ''} ${form.address}
Location: ${form.city ? form.city + ', ' : ''}${form.state || 'not specified'}
Estimated Price: ${form.estimatedPrice || 'unknown'}
Condition: ${form.propertyCondition}
Seller Goals: ${form.sellerGoals || 'unknown'}
Timeframe: ${form.timeframe || 'unknown'}
Agent Name: ${form.agentName || 'Agent'}
Notes: ${form.notes || 'none'}
${hasComps ? `Comparable Sales: ${JSON.stringify(validComps)}` : 'Comparable Sales: None provided.'}

For "cma_analysis":${hasComps ? `
The seller provided comparable sales. Include all of the following:
1. COMPARABLE SALES SUMMARY: A narrative paragraph analyzing the comps and what they suggest about the subject property's value.
   Comps: ${validComps.map((c: any) => `${c.address} — $${c.salePrice}, ${c.beds} bed / ${c.baths} bath, ${c.sqft} sqft, ${c.dom} DOM`).join('; ')}
   Subject: ${form.address}, ${form.estimatedPrice}, ${form.beds} bed/${form.baths} bath, ${form.sqft} sqft, condition: ${form.propertyCondition}
2. RECOMMENDED LIST PRICE: Based on the comps, a recommended price range with clear reasoning.
3. PRICE PER SQFT ANALYSIS: Calculate and compare price per sqft across the comps and subject property.
4. SELLER OBJECTION RESPONSES (data-backed using comp data): Confident responses to "My neighbor got more for their home" / "Zillow says my home is worth more" / "Let's start high and reduce if needed" / "I need to net a specific amount"` : `
Generate general pricing strategy talking points based on the estimated price range of ${form.estimatedPrice || 'unknown'} and current market conditions. No comps were provided so keep it strategic and general.`}

For "objection_responses": Always write confident, conversational responses in the agent's voice to ALL 4 of these common seller objections, using the property details and estimated price. Format each with the objection as a header followed by the response.
1. "My neighbor got more for their home"
2. "Zillow says my home is worth more"
3. "Let's start high and reduce if needed"
4. "I need to net a specific amount"

For "followup_email": Write a complete follow-up email with subject line. Start the greeting with exactly "Hi [Seller Name]," (use that exact bracket placeholder — do not leave it blank). Include a section titled "WHAT I HEARD FROM YOU TODAY:" with exactly these three bullet points filled in with relevant details from the conversation:
- [Key point from discovery conversation]
- [Their primary motivation and timeline]
- [Their main concern or hesitation]

Return exactly this JSON:
{
"meeting_outline": "Complete step-by-step meeting outline with timing for each section",
"talking_points": "5-7 key talking points the agent should make during the appointment",
"seller_questions": "10 important questions the agent should ask the seller during the meeting",
"marketing_preview": "A preview of the marketing plan the agent can present to the seller",
"selling_angles": "3-5 strongest likely selling angles for this property based on what we know",
"followup_email": "Complete follow-up email as described above — greeting must use [Seller Name] placeholder, include WHAT I HEARD FROM YOU TODAY section with the three bracket placeholders",
"presentation_intro": "A strong 2-3 paragraph opening statement for the listing presentation",
"cma_analysis": "Detailed CMA analysis and pricing narrative as described above",
"objection_responses": "Confident responses to all 4 seller objections, each with the objection as a header followed by the agent's response"
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
      return NextResponse.json({ error: 'Could not generate meeting prep' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
