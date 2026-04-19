import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { property } = await request.json()

    const prompt = `You are a real estate copywriter. Generate marketing copy. Respond ONLY with valid JSON, no markdown, no backticks.

Property: ${property.type}, ${property.beds}, ${property.sqft} sq ft, ${property.neighborhood}${property.price ? ', ' + property.price : ''}
Tone: ${property.tone} | Target: ${property.buyer}
Features: ${property.features}
Notes: ${property.notes || 'none'}

Return exactly this JSON:
{"mls_standard":"150-200 word MLS description","mls_luxury":"150-200 word luxury MLS description","instagram":"3 caption options separated by ---","facebook":"Facebook post","email":"Subject: line then body","openhouse":"Open house announcement","video":"30-sec video script","seo":"SEO title and meta"}`

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
      return NextResponse.json({ outputs })
    } catch(e) {
      return NextResponse.json({ error: 'Parse error: ' + text.substring(0, 200) }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}