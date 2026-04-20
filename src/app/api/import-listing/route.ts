import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    // Fetch the page content
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 400 })
    }

    const html = await res.text()

    // Use Claude to extract listing details from the HTML
    const prompt = `Extract real estate listing details from this HTML page content. Respond ONLY with valid JSON, no markdown, no backticks.

HTML content (first 8000 chars):
${html.substring(0, 8000)}

Return exactly this JSON with whatever you can find (use empty string if not found):
{"type":"property type like Single family or Condo","beds":"beds and baths like 3 bed / 2 bath","sqft":"square footage as number only","price":"price with $ sign","neighborhood":"city and state","features":"comma separated list of key features","notes":"any other notable details"}`

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await aiRes.json()
    const text = aiData.content?.[0]?.text || ''

    try {
      const listing = JSON.parse(text.replace(/```json|```/g, '').trim())
      return NextResponse.json({ listing })
    } catch(e) {
      return NextResponse.json({ error: 'Could not parse listing details' }, { status: 500 })
    }

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}