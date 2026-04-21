import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '@/app/lib/auth'

export async function POST(request: Request) {
  try {
    const { property, userId } = await request.json()

    // Block unauthorized requests
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting - max 5 launch kits per minute
    const { allowed } = checkRateLimit(`launchkit_${userId}`, 5, 60000)
    if (!allowed) return rateLimitResponse()

    const prompt = `You are a real estate marketing expert. Create a complete 7-day listing launch marketing plan for this property. Respond ONLY with valid JSON, no markdown, no backticks.

Property: ${property.type}, ${property.beds}, ${property.sqft} sq ft, ${property.neighborhood}${property.price ? ', ' + property.price : ''}
Features: ${property.features}
Notes: ${property.notes || 'none'}

Return exactly this JSON:
{
"day1": "Day 1 - Launch Day: Specific actions and post ideas for the first day",
"day2": "Day 2 - Follow Up: Specific actions and content ideas",
"day3": "Day 3 - Mid Week Push: Specific actions and content ideas",
"day4": "Day 4 - Feature Spotlight: Specific actions and content ideas",
"day5": "Day 5 - Open House Promo: Specific actions and content ideas",
"day6": "Day 6 - Weekend Push: Specific actions and content ideas",
"day7": "Day 7 - Final Push: Specific actions and content ideas",
"email_sequence": "3-email follow up sequence for leads, separated by ---",
"social_calendar": "Summary of all social posts for the week",
"pro_tips": "3 pro tips for marketing this specific property"
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
      const plan = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ plan })
    } catch(e) {
      return NextResponse.json({ error: 'Could not generate launch kit' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}