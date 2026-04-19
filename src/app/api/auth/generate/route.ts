import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { property } = await request.json()

  const prompt = `You are a real estate copywriter. Generate marketing copy. Respond ONLY with valid JSON, no markdown.

Property: ${property.type}, ${property.beds}, ${property.sqft} sq ft, ${property.neighborhood}${property.price ? ', ' + property.price : ''}
Tone: ${property.tone} | Target: ${property.buyer}
Features: ${property.features}
Notes: ${property.notes || 'none'}

Return exactly this JSON:
{"mls_standard":"150-200 word MLS description","mls_luxury":"150-200 word luxury MLS description","instagram":"3 caption options separated by ---","facebook":"Facebook post with hook and CTA","email":"Subject: [line]\\n\\n[body]","openhouse":"Open house announcement","video":"30-sec video script","seo":"SEO title and meta description"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  const outputs = JSON.parse(text.replace(/```json|```/g, '').trim())
  return NextResponse.json({ outputs })
}