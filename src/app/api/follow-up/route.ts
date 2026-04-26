import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form } = await request.json()

    const prompt = `You are a real estate relationship expert. Generate a complete follow-up kit for a real estate agent after a meeting or showing. Use ALL the specific details provided. Respond ONLY with valid JSON, no markdown, no backticks.

Meeting Details:
- Contact Name: ${form.contactName}
- Contact Type: ${form.contactType}
- Meeting Type: ${form.meetingType}
- Property: ${form.propertyAddress || 'Not specified'}
- Key Points: ${form.keyPoints || 'Not specified'}
- Next Step: ${form.nextStep || 'Not specified'}
- Agent: ${form.agentName || 'Your Agent'} | Phone: ${form.phone || ''}

IMPORTANT: Use the contact name, meeting details, and next steps in every output. Make it feel personal and specific, not generic.

Return exactly this JSON with no line breaks inside string values:
{"emailFollowUp":"Subject line then full professional follow-up email to send within 24 hours of the meeting","textFollowUp":"Casual friendly SMS to send same day as the meeting - under 160 characters","linkedinMessage":"Short professional LinkedIn connection or follow-up message","reminderNote":"CRM notes to add for this contact including key details, concerns, timeline, and follow-up tasks","nextStepEmail":"Subject line then email to confirm and advance the agreed next step"}`

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