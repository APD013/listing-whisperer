import { NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { propertyNotes, videoGoal, platform, brandVoice } = await request.json()

    const bv = brandVoice || {}
    const agentName = bv.agentName || 'the agent'
    const brokerage = bv.brokerage || ''
    const phone = bv.phone || ''
    const preferredTone = bv.preferredTone || 'professional and warm'
    const uniqueStyle = bv.uniqueStyle || ''
    const ctaStyle = bv.ctaStyle || ''
    const targetBuyers = bv.targetBuyers || ''
    const avoidWords: string[] = Array.isArray(bv.avoidWords) ? bv.avoidWords : []

    const platformStyle =
      platform === 'TikTok'
        ? 'casual, punchy, and trend-aware — fast hooks, energetic pacing'
        : platform === 'Instagram Reels'
        ? 'visual, aspirational, and story-driven — emotion first, then details'
        : platform === 'Facebook Reels'
        ? 'conversational and community-focused — warm, trustworthy, local feel'
        : 'fast, direct, and value-focused — clear benefit in the first 2 seconds'

    const userPrompt = `Generate a complete short-form video ad kit for this real estate listing.

Agent: ${agentName}${brokerage ? ` at ${brokerage}` : ''}${phone ? ` | ${phone}` : ''}
Property Notes: ${propertyNotes}
Video Goal: ${videoGoal}
Platform: ${platform} — style: ${platformStyle}
Agent's Preferred Tone: ${preferredTone}
Agent's Unique Style: ${uniqueStyle || 'authentic and relatable'}
Agent's CTA Style: ${ctaStyle || 'direct and confident'}
Target Buyers: ${targetBuyers || 'motivated local buyers'}
Words to NEVER use: ${avoidWords.length ? avoidWords.join(', ') : 'none specified'}

Rules:
- Every output must sound like ${agentName} personally wrote it — not generic real estate copy
- Match the platform style exactly: ${platformStyle}
- Never mention Listing Whisperer, Claude, or any AI tool name
- Never use any of the avoid words
- The script must be under 130 characters and feel natural when spoken aloud
- The motion prompt must be cinematic and specific — written for Kling, Luma, or Runway AI video tools
- The caption must match the ${platform} platform voice
- Hashtags must be relevant to this property and goal (not generic)
- The voiceover line is what the agent records — keep it conversational, under 15 seconds

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "script": "8-second spoken script, under 130 characters, punchy and natural",
  "motion_prompt": "cinematic motion prompt for Kling/Luma/Runway — specific camera movement, lighting, subject, mood",
  "caption": "platform-optimized social media caption with line breaks where natural",
  "hashtags": "#relevant #hashtags #for #this #listing",
  "voiceover": "conversational voiceover line for the agent to record",
  "audio_suggestion": "specific music genre, tempo, and mood suggestion for background audio",
  "cover_text": "short bold text overlay for the cover frame — 3-5 words max"
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
        system: 'You are a real estate video marketing expert. Return ONLY valid JSON, no markdown, no backticks.',
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }
    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
