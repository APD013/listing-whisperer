import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { messages, currentPage, userId } = await request.json()
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || ''

    // INTENT DETECTION — Navigate
    const navigateMatch = Object.keys(PAGES).find(key =>
      lastMessage.includes('go to ' + key) ||
      lastMessage.includes('take me to ' + key) ||
      lastMessage.includes('open ' + key) ||
      lastMessage.includes('navigate to ' + key) ||
      lastMessage.includes('show me ' + key)
    )
    if (navigateMatch) {
      return NextResponse.json({
        message: `Sure! Taking you to ${navigateMatch} now. 🚀`,
        action: { type: 'navigate', url: PAGES[navigateMatch] }
      })
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
          created_at: new Date().toISOString()
        })

      if (!error) {
        return NextResponse.json({
          message: `✅ Done! I've added **${name || 'New Lead'}**${email ? ` (${email})` : ''} to your Leads & Clients. You can view them at any time from your dashboard.`,
          action: { type: 'lead_added', name, email }
        })
      }
    }

    // INTENT DETECTION — Create Reminder
    const reminderMatch = lastMessage.match(/remind\s+me\s+to\s+(.+?)\s+on\s+(.+)/i) ||
      lastMessage.match(/set\s+a\s+reminder\s+(.+?)\s+on\s+(.+)/i)
    if (reminderMatch && userId) {
      const content = reminderMatch[1]
      const dateStr = reminderMatch[2]
      const remindAt = new Date(dateStr)

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
            action: { type: 'reminder_created' }
          })
        }
      }
    }

    // DEFAULT — Normal chat response
    const systemPrompt = `You are the Listing Whisperer AI Assistant — a smart, friendly assistant built specifically for real estate agents.

You have two roles:
1. PRODUCT EXPERT: You know everything about Listing Whisperer and help agents use it effectively
2. REAL ESTATE EXPERT: You answer real estate questions, provide advice, and help agents succeed

About Listing Whisperer:
- AI assistant for real estate agents
- Pricing: Free 24-hour Pro trial (2 listings), then $20/month Pro
- No credit card required to start

Tools available:
- New Listing, Quick Listing, Snap & Start, Seller Prep, Rewrite
- 7-Day Launch Kit, Pricing Assistant, Open House Kit, Price Drop Kit
- Follow-Up Assistant, Leads & Clients, Photo Library, Settings
- Objection Handler, Social Content Planner, Seller Net Sheet
- Commission Calculator, Transaction Checklist, Agent Portfolio

You can take actions for the agent:
- Navigate: "take me to seller prep", "go to leads", "open objection handler"
- Add leads: "add John Smith, john@email.com as a lead"
- Set reminders: "remind me to call Sarah on Friday"

Personality: Warm, professional, concise, real estate focused.
Keep responses to 2-3 paragraphs max.

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