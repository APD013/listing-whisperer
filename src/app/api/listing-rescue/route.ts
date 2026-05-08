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
- Be specific and honest — generic advice is useless
- Root cause must name the actual problem, not just "pricing" or "marketing"
- Buyer profile must be detailed and specific to this property
- New listing copy must be ready to publish with no placeholders
- Content strategy must name specific platforms and content types
- Price & offer strategy must include concrete recommendations
- Never mention Listing Whisperer, Claude, or any AI tool
- Never use any of the avoid words
- Write as if ${agentName} is your client and you are their trusted advisor

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "root_cause": "Honest, specific diagnosis of why this listing is sitting — 2-3 sentences naming the real problem",
  "buyer_profile": "Detailed description of the most likely buyer: who they are, what they need, what motivates them, and how to reach them",
  "repositioning_strategy": "Specific strategy to reframe and reposition this listing — angle, narrative, and key changes to make",
  "new_listing_copy": "Complete rewritten listing description with fresh angle — ready to publish on MLS",
  "content_strategy": "Specific platform-by-platform marketing recommendations (TikTok, Instagram, email, open house, etc.) with content ideas",
  "price_offer_strategy": "Pricing analysis and recommended offer language — specific numbers, ranges, or strategies based on the days on market and price history"
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
        max_tokens: 2000,
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
