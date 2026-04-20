import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { listing, style } = await request.json()

    const prompt = `You are an expert real estate copywriter. Rewrite the following listing description in a more compelling, polished way. Respond ONLY with valid JSON, no markdown, no backticks.

Original listing:
${listing}

Rewrite style: ${style || 'Professional and compelling'}

Return exactly this JSON:
{"standard":"Rewritten standard MLS version (150-200 words)","luxury":"Luxury/aspirational rewrite (150-200 words)","short":"Short punchy version (50-75 words)","social":"Instagram caption version with hashtags","headline":"5 headline options separated by ---","improvements":"3 specific improvements you made, as a bullet list"}`

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