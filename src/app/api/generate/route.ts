import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { property, userId } = await request.json()

    // Check usage limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('listings_used, plan')
      .eq('id', userId)
      .single()

    if (profile?.plan === 'starter' && profile?.listings_used >= 3) {
      return NextResponse.json({ error: 'LIMIT_REACHED' }, { status: 403 })
    }

    // Get brand voice
    let brandVoiceText = ''
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('brand_voice')
        .eq('id', userId)
        .single()
      if (profile?.brand_voice) {
        try {
          const bv = JSON.parse(profile.brand_voice)
          if (bv.agentName) brandVoiceText += `Agent: ${bv.agentName}\n`
          if (bv.brokerage) brandVoiceText += `Brokerage: ${bv.brokerage}\n`
          if (bv.phone) brandVoiceText += `Phone: ${bv.phone}\n`
          if (bv.website) brandVoiceText += `Website: ${bv.website}\n`
          if (bv.preferredTone) brandVoiceText += `Preferred tone: ${bv.preferredTone}\n`
          if (bv.targetBuyers) brandVoiceText += `Target buyers: ${bv.targetBuyers}\n`
          if (bv.uniqueStyle) brandVoiceText += `Writing style: ${bv.uniqueStyle}\n`
          if (bv.ctaStyle) brandVoiceText += `CTA style: ${bv.ctaStyle}\n`
          if (bv.avoidWords) brandVoiceText += `Words to avoid: ${bv.avoidWords}\n`
        } catch(e) {}
      }
    }

    const prompt = `You are a real estate copywriter. Generate marketing copy. Respond ONLY with valid JSON, no markdown, no backticks.

Property: ${property.type}, ${property.beds}, ${property.sqft} sq ft, ${property.neighborhood}${property.price ? ', ' + property.price : ''}
Tone: ${property.tone} | Target: ${property.buyer}
Features: ${property.features}
Notes: ${property.notes || 'none'}
${brandVoiceText ? `\nAgent Brand Voice:\n${brandVoiceText}` : ''}

Return exactly this JSON:
{"mls_standard":"150-200 word MLS description","mls_luxury":"150-200 word luxury MLS description","instagram":"3 caption options separated by ---","facebook":"Facebook post","email":"Subject: line then body","openhouse":"Open house announcement","video":"30-sec video script","seo":"SEO title and meta","text_message":"2-3 SMS text message options under 160 chars each, separated by ---","flyer":"Flyer headline, subheadline, and 5 bullet points","price_drop":"Price improvement announcement for MLS, social, and email separated by ---"}`

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
    
    try {
      const outputs = JSON.parse(text.replace(/```json|```/g, '').trim())

      // Save listing to Supabase
      if (userId) {
        await supabase.from('listings').insert({
          user_id: userId,
          property_type: property.type,
          beds_baths: property.beds,
          sqft: property.sqft,
          price: property.price,
          neighborhood: property.neighborhood,
          features: property.features,
          tone: property.tone,
          target_buyer: property.buyer,
          notes: property.notes,
          outputs: outputs
        })

        // Increment listings_used
        await supabase
          .from('profiles')
          .update({ listings_used: (profile?.listings_used || 0) + 1 })
          .eq('id', userId)
      }

      return NextResponse.json({ outputs })
    } catch(e) {
      return NextResponse.json({ error: 'Parse error: ' + text.substring(0, 200) }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}