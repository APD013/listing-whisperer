import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const maxDuration = 30

const PAGES: Record<string, string> = {
  'dashboard': '/dashboard',
  'new listing': '/dashboard',
  'quick listing': '/quick-listing',
  'snap and start': '/snap-start',
  'snap & start': '/snap-start',
  'seller prep': '/seller-prep',
  'seller meeting': '/seller-prep',
  'pricing assistant': '/pricing-assistant',
  'rewrite': '/rewrite',
  'launch kit': '/launch-kit',
  'open house': '/open-house',
  'price drop': '/price-drop',
  'follow up': '/follow-up',
  'leads': '/leads',
  'photos': '/photos',
  'settings': '/settings',
  'objection handler': '/objection-handler',
  'objection': '/objection-handler',
  'social planner': '/social-planner',
  'social content': '/social-planner',
  'seller net sheet': '/seller-net-sheet',
  'commission calculator': '/commission-calculator',
  'transaction checklist': '/transaction-checklist',
  'portfolio': '/agent-portfolio',
  'pricing': '/pricing',
}

export async function POST(request: Request) {
  try {
    const { messages, currentPage, userId, timezone } = await request.json()
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''

    // INTENT DETECTION — Navigate
    const navigateMatch = Object.keys(PAGES).find(key =>
      lastMessage.includes('go to ' + key) ||
      lastMessage.includes('take me to ' + key) ||
      lastMessage.includes('open ' + key) ||
      lastMessage.includes('navigate to ' + key) ||
      lastMessage.includes('show me ' + key) ||
      lastMessage.includes('how do i get to ' + key) ||
      lastMessage.includes(key + ' page')
    )
    if (navigateMatch) {
      return NextResponse.json({
        message: `Sure! Taking you to ${navigateMatch} now. 🚀`,
        action: { type: 'navigate', url: PAGES[navigateMatch] }
      })
    }

    // INTENT DETECTION — Yes/Confirm navigation from previous message
    const prevMessage = messages[messages.length - 2]?.content?.toLowerCase() || ''
    const isConfirm = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please', 'yes please', 'go ahead'].some(w => lastMessage.trim() === w || lastMessage.trim().startsWith(w))
    if (isConfirm) {
      const prevNavMatch = Object.keys(PAGES).find(key => prevMessage.includes(key))
      if (prevNavMatch) {
        return NextResponse.json({
          message: `Taking you to ${prevNavMatch} now! 🚀`,
          action: { type: 'navigate', url: PAGES[prevNavMatch] }
        })
      }
    }

    // INTENT DETECTION — Add Lead
    const addLeadMatch = lastMessage.match(/add\s+(.+?)\s+as\s+a\s+lead/i) ||
      lastMessage.match(/add\s+lead\s+(.+)/i) ||
      lastMessage.match(/new\s+lead\s+(.+)/i)
    if (addLeadMatch && userId) {
      const namePart = addLeadMatch[1]
      const emailMatch = namePart.match(/[\w.-]+@[\w.-]+\.\w+/)
      const email = emailMatch ? emailMatch[0] : null
      const name = namePart.replace(email || '', '').replace(/,/g, '').trim()

      const { error } = await supabase
        .from('leads')
        .insert({
          user_id: userId,
          name: name || 'New Lead',
          email: email || null,
          status: 'New Lead',
        })

      if (!error) {
        return NextResponse.json({
          message: `Got it! Adding **${name || 'New Lead'}** as a lead now...`,
          action: { type: 'lead_added', name, email }
        })
      } else {
        console.error('Lead insert error:', error)
        return NextResponse.json({
          message: `Sorry I couldn't add that lead. Error: ${error.message}`
        })
      }
    }

    // INTENT DETECTION — Create Reminder
    const reminderMatch = lastMessage.match(/remind\s+me\s+to\s+(.+?)\s+on\s+(.+)/i) ||
      lastMessage.match(/set\s+a\s+reminder\s+(.+?)\s+on\s+(.+)/i) ||
      lastMessage.match(/remind\s+me\s+to\s+(.+)/i) ||
      lastMessage.match(/^(.+?)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow)/i) ||
      lastMessage.match(/^(.+?)\s+at\s+(\d+(?:am|pm)?)/i) ||
      lastMessage.match(/add\s+reminder\s+(.+?)\s+on\s+(.+)/i) ||
      lastMessage.match(/add\s+reminder\s+(.+)/i)
    if (reminderMatch && userId) {
      const content = reminderMatch[1]
      const dateStr = reminderMatch[2] || 'tomorrow'
      
      // Parse relative dates
      const now = new Date()
      let remindAt = new Date()
      const dateStrLower = dateStr.toLowerCase().trim()
      
      if (dateStrLower.includes('today')) {
        remindAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)
      } else if (dateStrLower.includes('tomorrow')) {
        remindAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0)
      } else if (dateStrLower.includes('monday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (1 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('tuesday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (2 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('wednesday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (3 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('thursday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (4 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('friday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (5 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('saturday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (6 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('sunday')) {
        const day = now.getDay(); remindAt.setDate(now.getDate() + (7 + 7 - day) % 7 || 7)
      } else if (dateStrLower.includes('next week')) {
        remindAt.setDate(now.getDate() + 7)
      } else {
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) remindAt = parsed
        else remindAt.setDate(now.getDate() + 1)
      }
      // Parse time if mentioned
      const timeMatch = lastMessage.match(/(\d+)\s*(am|pm)/i)
      const userTimezone = timezone || 'America/Los_Angeles'
      if (timeMatch) {
        let hour = parseInt(timeMatch[1])
        const meridiem = timeMatch[2].toLowerCase()
        if (meridiem === 'pm' && hour !== 12) hour += 12
        if (meridiem === 'am' && hour === 12) hour = 0
        const dateStr = remindAt.toLocaleDateString('en-CA')
        const localDateStr = `${dateStr}T${String(hour).padStart(2,'0')}:00:00`
        const utcDate = new Date(new Date(localDateStr).toLocaleString('en-US', { timeZone: 'UTC' }))
        const tzDate = new Date(new Date(localDateStr).toLocaleString('en-US', { timeZone: userTimezone }))
        const offset = utcDate.getTime() - tzDate.getTime()
        remindAt = new Date(new Date(localDateStr).getTime() + offset)
      } else {
        const dateStr = remindAt.toLocaleDateString('en-CA')
        const localDateStr = `${dateStr}T09:00:00`
        const utcDate = new Date(new Date(localDateStr).toLocaleString('en-US', { timeZone: 'UTC' }))
        const tzDate = new Date(new Date(localDateStr).toLocaleString('en-US', { timeZone: userTimezone }))
        const offset = utcDate.getTime() - tzDate.getTime()
        remindAt = new Date(new Date(localDateStr).getTime() + offset)
      }

      if (!isNaN(remindAt.getTime())) {
        const { error } = await supabase
          .from('reminders')
          .insert({
            user_id: userId,
            content: content,
            remind_at: remindAt.toISOString(),
            sent: false,
            created_at: new Date().toISOString()
          })

        if (!error) {
          return NextResponse.json({
            message: `✅ Reminder set! I'll remind you to **${content}** on ${remindAt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}. You'll see it as a popup when you log in.`,
            action: { 
              type: 'reminder_created',
              content: content,
              remind_at: remindAt.toISOString(),
              display_date: remindAt.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
            }
          })
        }
      }
    }

    // DEFAULT — Normal chat response
    const systemPrompt = `You are the Listing Whisperer AI Assistant — a smart, friendly assistant built specifically for real estate agents.

You have three roles:
1. PRODUCT EXPERT: You know everything about Listing Whisperer and help agents use it effectively
2. REAL ESTATE EXPERT: You answer real estate questions, provide advice, and help agents succeed
3. ON-DEMAND TOOL: You generate scripts, objection responses, and listing copy instantly in chat

About Listing Whisperer:
- AI assistant for real estate agents
- Pricing: Free 24-hour Pro trial (unlimited listings), then $20/month Pro
- No credit card required to start

Tools available:
- New Listing, Quick Listing, Snap & Start, Seller Prep, Rewrite
- 7-Day Launch Kit, Pricing Assistant, Open House Kit, Price Drop Kit
- Follow-Up Assistant, Leads & Clients, Photo Library, Settings
- Objection Handler, Social Content Planner, Seller Net Sheet
- Commission Calculator, Transaction Checklist, Agent Portfolio
- Scripts Library (cold call, door knock, FSBO, expired listings)

You can take actions for the agent:
- Navigate: "take me to seller prep", "go to leads", "open objection handler"
- Add leads: "add John Smith, john@email.com as a lead"
- Set reminders: "remind me to call Sarah on Friday"

SCRIPTS — When asked for a script, generate a full, ready-to-use script immediately. Do not redirect to another page. Examples:
- "Give me a cold call script" → Generate a complete cold call script
- "Give me a door knock script" → Generate a complete door knock script
- "Give me an FSBO script" → Generate a complete FSBO script
- "Give me an expired listing script" → Generate a complete expired listing script
- Always personalize if the agent provides a name, address, or neighborhood
- Format scripts clearly with AGENT: and PROSPECT: labels
- End every script with a strong close and next step

OBJECTIONS — When asked how to handle an objection, give a confident, ready-to-say response immediately. Examples:
- "What do I say when seller says commission is too high?" → Give exact word-for-word response
- "How do I handle a buyer who says they want to wait?" → Give exact word-for-word response
- Always give 2-3 different ways to respond
- Keep responses conversational and natural, not robotic

COPY GENERATION — When asked to write listing copy, generate it immediately in chat. Examples:
- "Write an Instagram caption for a 3bed 2bath in Anaheim at $650k" → Generate full caption with hashtags
- "Write an MLS description for a 4bed home with a pool in Irvine" → Generate full MLS description
- "Write a price drop post for 123 Main St, now $499k" → Generate full social post
- Always ask for missing details only if absolutely necessary — otherwise make reasonable assumptions and generate

Personality: Warm, professional, concise, real estate focused.
Keep responses focused and useful. For scripts and copy, go long enough to be genuinely useful.

IMPORTANT RULES:
- Always assume real estate context — if someone says "help me talk to sellers" assume they want a script or talking points
- Never say "I can't help with that" — always attempt to generate something useful
- Never redirect to another tool or page when you can generate the answer directly in chat
- If a request is vague, make one smart assumption and generate — then offer to adjust
- If you truly need one clarifying detail, ask just ONE question then generate immediately
- Treat casual or shorthand messages as real requests — "got fsbo wat do i say" means they want an FSBO script
- Always end responses with one actionable next step or offer to customize further

${currentPage ? `Agent is currently on: ${currentPage}. Give contextually relevant help.` : ''}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `API error: ${err}` }, { status: 500 })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    return NextResponse.json({ message: text })

  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}