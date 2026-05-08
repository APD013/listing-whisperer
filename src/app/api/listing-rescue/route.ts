import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const {
      address, propertyType, beds, baths, listPrice, daysOnMarket,
      originalListPrice, triedSoFar, sellerSituation,
      imageBase64, imageType, brandVoice, userId,
    } = await request.json()

    const bv = brandVoice || {}
    const agentName = bv.agentName || 'the agent'
    const preferredTone = bv.preferredTone || 'professional and direct'
    const avoidWords: string[] = Array.isArray(bv.avoidWords) ? bv.avoidWords : []

    const priceChange = originalListPrice && originalListPrice !== listPrice
      ? `Original list price: ${originalListPrice} → Current: ${listPrice}`
      : `List price: ${listPrice || 'not provided'}`

    const userPrompt = `Diagnose this stale listing and prescribe a complete rescue plan.

Agent: ${agentName}
Property: ${address}
Type: ${propertyType}${beds ? ` · ${beds} bed` : ''}${baths ? ` / ${baths} bath` : ''}
${priceChange}
Days on Market: ${daysOnMarket}
What's been tried: ${triedSoFar || 'Not specified'}
Seller situation: ${sellerSituation || 'Not provided'}
Agent's preferred tone: ${preferredTone}
Words to NEVER use: ${avoidWords.length ? avoidWords.join(', ') : 'none specified'}

Rules:
- Be concise — 2-3 punchy sentences per section, no long essays
- Name the real problem specifically, not vague generalities
- New listing copy: 3-4 sentences max, ready to publish
- Content strategy: 2-3 specific platform actions, no fluff
- Price strategy: one concrete recommendation with a number or range
- Never mention Listing Whisperer, Claude, or any AI tool
- Never use any of the avoid words

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "root_cause": "2-3 sentences — specific honest diagnosis of why this listing is sitting",
  "buyer_profile": "2-3 sentences — who the most likely buyer is and how to reach them",
  "repositioning_strategy": "2-3 sentences — the new angle and key changes to make",
  "new_listing_copy": "3-4 sentence MLS description with a fresh hook — ready to publish",
  "content_strategy": "2-3 specific platform actions with content ideas (e.g. TikTok walkthrough, Instagram before/after, email to past clients)",
  "price_offer_strategy": "1-2 sentences with a concrete price recommendation or offer strategy"
}`

    const systemPrompt = imageBase64
      ? 'You are a senior real estate strategist and listing advisor. A listing photo has been provided — analyze its visual details: condition, curb appeal, staging, and any issues visible. Factor these observations into your diagnosis and recommendations. Return ONLY valid JSON, no markdown, no backticks.'
      : 'You are a senior real estate strategist and listing advisor. Return ONLY valid JSON, no markdown, no backticks.'

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

    if (userId) {
      const { error: insertError } = await supabase.from('listing_rescues').insert({
        user_id: userId,
        address,
        property_type: propertyType,
        days_on_market: parseInt(daysOnMarket) || 0,
        result,
      })
      if (insertError) console.error('listing_rescues insert error:', insertError.message)
    }

    return NextResponse.json({ result })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
