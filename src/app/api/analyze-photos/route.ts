import { NextResponse } from 'next/server'
import { checkRateLimit, rateLimitResponse } from '../../lib/auth'

export async function POST(request: Request) {
  try {
    const { images, userId } = await request.json()

    // Rate limiting - max 10 photo analyses per minute
    if (userId) {
      const { allowed } = checkRateLimit(`photos_${userId}`, 10, 60000)
      if (!allowed) return rateLimitResponse()
    }

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    // Build image content array for Claude
    const imageContent = images.map((base64: string) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: base64.replace(/^data:image\/\w+;base64,/, '')
      }
    }))

    const prompt = `You are a real estate expert. Look at these listing photos and identify the key features and selling points you can see. Respond ONLY with valid JSON, no markdown, no backticks.

Return exactly this JSON:
{"features":"comma separated list of visible features like: hardwood floors, vaulted ceilings, granite countertops, stainless appliances, open floor plan, natural light, updated bathrooms, covered patio, pool, mountain views, etc","property_type":"your best guess at property type","condition":"excellent, good, average, or needs work","highlights":"3-5 strongest selling points as a short sentence","notes":"any other observations that would help write listing copy"}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt }
          ]
        }]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `AI error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const analysis = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ analysis })
    } catch(e) {
      return NextResponse.json({ error: 'Could not analyze photos' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}