import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const { form, userId } = await request.json()

    const prompt = `You are an expert real estate pricing strategist helping a licensed real estate agent prepare for a seller listing appointment.

Property Details:
- Address: ${form.address || 'Not specified'}
- Type: ${form.propertyType}
- Beds: ${form.beds} | Baths: ${form.baths}
- Square Footage: ${form.sqft}
- Condition: ${form.condition}
- Neighborhood: ${form.neighborhood}
- Location: ${form.city ? form.city + ', ' : ''}${form.state || 'not specified'}
- Upgrades/Features: ${form.upgrades || 'None specified'}
- Comparable Sales: ${form.comps || 'None provided'}
- Additional Notes: ${form.notes || 'None'}

Generate a comprehensive pricing strategy report. Respond ONLY with valid JSON, no markdown, no backticks.

Return exactly this JSON:
{"priceRange":"e.g. $875,000 - $925,000","confidence":"e.g. Moderate confidence - limited comp data provided","strategy":"2-3 paragraphs on pricing strategy","sellerTalkingPoints":"Bullet points to explain the price to the seller","keyFactors":"Bullet points of key pricing factors","objectionResponses":"3-4 common objections with professional responses","marketPositioning":"How this home compares to the market and what buyer it targets"}`

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
    const result = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Save to Supabase
    if (userId) {
      await supabase.from('pricing_reports').insert({
        user_id: userId,
        property_type: form.propertyType,
        beds: form.beds,
        baths: form.baths,
        sqft: form.sqft,
        condition: form.condition,
        neighborhood: form.neighborhood,
        upgrades: form.upgrades || '',
        comps: form.comps || '',
        notes: form.notes || '',
        price_range: result.priceRange,
        confidence: result.confidence,
        full_report: result
      })
    }

    return NextResponse.json({ result })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}