import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { objection, context } = await req.json()

    const prompt = `You are an expert real estate coach helping agents handle objections confidently and professionally.

The agent is facing this objection:
"${objection}"

${context ? `Additional context: ${context}` : ''}

Generate a response toolkit for this objection. Respond ONLY with valid JSON, no other text:

{
  "quickResponse": "A short 2-3 sentence response they can say RIGHT NOW in the moment. Confident, empathetic, professional.",
  "fullResponse": "A full 150-200 word response with empathy, logic, and a soft close. Natural conversational tone.",
  "emailResponse": "A follow-up email they can send after the conversation. Include subject line at the top. 150 words max.",
  "psychologyTip": "2-3 sentences explaining WHY the client said this and the real underlying concern. Help the agent understand the psychology so they can respond better."
}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ result })
  } catch (e: any) {
    console.error('Objection handler error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}