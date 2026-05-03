import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TWO_PARTY_STATES = [
  'California', 'Illinois', 'Washington', 'Pennsylvania', 'Michigan',
  'Maryland', 'Massachusetts', 'Montana', 'Nevada', 'New Hampshire',
  'Oregon', 'Connecticut', 'Delaware'
]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audio = formData.get('audio') as Blob
    const userId = formData.get('userId') as string

    if (!audio || !userId) {
      return NextResponse.json({ error: 'Missing audio or userId' }, { status: 400 })
    }

    // Send to OpenAI Whisper for transcription
    const whisperForm = new FormData()
    whisperForm.append('file', audio, 'call.webm')
    whisperForm.append('model', 'whisper-1')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: whisperForm
    })

    const whisperData = await whisperRes.json()
    const transcript = whisperData.text || ''

    if (!transcript) {
      return NextResponse.json({ error: 'Could not transcribe audio' }, { status: 400 })
    }

    // Send transcript to Claude to extract lead details
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are analyzing a real estate agent's phone call transcript. Your job is to extract lead information accurately. Pay close attention to names — the caller will usually introduce themselves. Extract the following and return ONLY a valid JSON object with no other text, no markdown, no backticks:

Keys to extract:
- "name": The full name of the person calling (look for "my name is", "this is", "I'm" — be thorough)
- "phone": Any phone number mentioned
- "email": Any email address mentioned  
- "address": Any property address mentioned
- "est_price": Any price or price range mentioned
- "notes": A detailed summary of the call — motivation, timeline, concerns, next steps, anything important
- "status": Always set to "New Lead"

Return ONLY the JSON object. Example:
{"name":"John Smith","phone":"714-555-0100","email":"","address":"123 Main St Newport Beach","est_price":"$900,000","notes":"Wants to sell in 60 days, motivated by relocation","status":"New Lead"}

Transcript:

{
  "name": "caller's full name or empty string",
  "phone": "caller's phone number or empty string",
  "email": "caller's email or empty string",
  "address": "property address mentioned or empty string",
  "est_price": "estimated price or price range mentioned or empty string",
  "notes": "key points from the call — motivation, timeline, concerns, next steps",
  "status": "New Lead"
}

Transcript:
${transcript}`
        }]
      })
    })

    const claudeData = await claudeRes.json()
    const rawText = claudeData.content?.[0]?.text || '{}'

    let leadData
    try {
      leadData = JSON.parse(rawText.replace(/```json|```/g, '').trim())
    } catch(e) {
      leadData = { name: 'Call Capture Lead', notes: transcript, status: 'New Lead' }
    }

    // Save lead to Supabase
    const { data: lead, error } = await supabase.from('leads').insert({
      user_id: userId,
      name: leadData.name || 'Unknown Caller',
      phone: leadData.phone || '',
      email: leadData.email || '',
      address: leadData.address || '',
      est_price: leadData.est_price || '',
      notes: leadData.notes || '',
      status: 'New Lead',
      source: 'call_capture',
    }).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transcript,
      lead: leadData,
      leadId: lead.id
    })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}