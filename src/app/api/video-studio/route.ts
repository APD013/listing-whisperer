import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { propertyNotes, videoGoal, platform, brandVoice, userId, imageBase64, imageType } = await request.json()

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

    const systemPrompt = imageBase64
      ? 'You are a real estate video marketing expert. A listing photo has been provided — analyze its visual details carefully: dominant colors, architectural style, interior/exterior features, lighting, mood, and any standout elements visible. Use these specific visual observations to make every output more vivid and compelling. Return ONLY valid JSON, no markdown, no backticks.'
      : 'You are a real estate video marketing expert. Return ONLY valid JSON, no markdown, no backticks.'

    const userContent: any[] = []
    if (imageBase64 && imageType) {
      userContent.push({
        type: 'image',
        source: { type: 'base64', media_type: imageType, data: imageBase64 },
      })
    }
    userContent.push({ type: 'text', text: userPrompt })

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
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
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

    let saved = false
    if (userId) {
      const { error: insertError } = await supabase.from('video_kits').insert({
        user_id: userId,
        property_notes: propertyNotes,
        video_goal: videoGoal,
        platform,
        result,
      })
      if (insertError) console.error('video_kits insert error:', insertError.message)
      else saved = true
    }

    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
