import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { form, userId } = await req.json()

    const prompt = `You are a real estate social media expert. Create a 7-day social media content calendar for this listing.

Property Details:
- Address: ${form.address || 'Not provided'}
- Neighborhood: ${form.neighborhood}
- Price: ${form.price || 'Not provided'}
- Beds/Baths: ${form.beds || 'Not provided'}
- Features: ${form.features}
- Tone: ${form.tone}

Generate a 7-day content calendar. For each day provide:
1. A theme for the day
2. Instagram post (with hashtags, max 2200 chars)
3. Facebook post (conversational, max 500 chars)
4. LinkedIn post (professional, max 700 chars)
5. Twitter/X post (max 280 chars)
6. SMS blast (max 160 chars)

Keep each post concise. Instagram max 300 chars, Facebook max 200 chars, LinkedIn max 300 chars, Twitter max 250 chars, SMS max 140 chars.

Respond ONLY with valid JSON in this exact format, no other text:
{
  "days": [
    {
      "theme": "Day 1 theme here",
      "instagram": "Instagram post here",
      "facebook": "Facebook post here",
      "linkedin": "LinkedIn post here",
      "twitter": "Twitter post here",
      "sms": "SMS post here"
    }
  ]
}

Generate all 7 days. Make each day feel fresh and different. Vary the angles: lifestyle, features, neighborhood, investment value, open house, price/value, and emotional story.`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = content.replace(/```json|```/g, '').trim()
    const calendar = JSON.parse(clean)

    return NextResponse.json({ calendar })
  } catch (e: any) {
    console.error('Social planner error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}