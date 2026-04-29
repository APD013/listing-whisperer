'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const HIDDEN_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/pricing', '/terms', '/privacy', '/contact']

export default function GlobalChat() {
  const pathname = usePathname()
  const [showChat, setShowChat] = useState(true)
  const [messages, setMessages] = useState<{role:string,content:string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lw_chat_history')
      if (saved) setMessages(JSON.parse(saved))
    } catch(e) {}
  }, [])

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('lw_chat_history', JSON.stringify(messages.slice(-20)))
      }
    } catch(e) {}
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (HIDDEN_PATHS.includes(pathname)) return null

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          currentPage: pathname,
          userId
        })
      })
      const data = await res.json()

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }

      // Handle actions client-side with authenticated supabase
      if (data.action) {
        const action = data.action

        if (action.type === 'navigate') {
          setTimeout(() => { window.location.assign(action.url) }, 1000)
        }

        if (action.type === 'lead_added' && userId) {
          const { error } = await supabase.from('leads').insert({
            user_id: userId,
            name: action.name || 'New Lead',
            email: action.email || null,
            status: 'New Lead',
          })
          if (!error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ **${action.name || 'New Lead'}** has been added to your Leads & Clients!`
            }])
          } else {
            console.error('Lead insert error:', error)
          }
        }

        if (action.type === 'reminder_created' && userId) {
          const { error } = await supabase.from('reminders').insert({
            user_id: userId,
            content: action.content,
            remind_at: action.remind_at,
            sent: false,
          })
          if (!error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ Reminder set for **${action.display_date}**!`
            }])
          }
        }
      }
    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem('lw_chat_history')
  }

  const suggestions = [
    'How do I use Seller Prep?',
    'Take me to the objection handler',
    'Add John Smith, john@email.com as a lead',
    'Remind me to call Sarah on Friday',
  ]

  return (
    <>
      {showChat && (
        <div style={{position:'fixed',bottom:'84px',right:'24px',width:'360px',height:'520px',background:'linear-gradient(135deg,#1a1d2e,#1e2235)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.25)',boxShadow:'0 24px 60px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',overflow:'hidden',zIndex:1500}}>

          {/* HEADER */}
          <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>✦</div>
              <div>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>Listing Whisperer AI</p>
                <p style={{fontSize:'10px',color:'#1D9E75',margin:'0'}}>Your real estate assistant</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              {messages.length > 0 && (
                <button onClick={clearHistory} style={{background:'none',border:'none',color:'#444',fontSize:'11px',cursor:'pointer',padding:'2px 6px'}}>Clear</button>
              )}
              <button onClick={() => setShowChat(false)} style={{background:'none',border:'none',color:'#555',fontSize:'18px',cursor:'pointer'}}>✕</button>
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{flex:1,overflowY:'auto',padding:'1rem',display:'flex',flexDirection:'column',gap:'10px'}}>
            {messages.length === 0 && (
              <div style={{textAlign:'center',padding:'1.5rem 1rem'}}>
                <div style={{fontSize:'2rem',marginBottom:'8px'}}>✦</div>
                <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0 0 4px'}}>How can I help you?</p>
                <p style={{fontSize:'11px',color:'#5a5f72',margin:'0 0 1rem'}}>Ask me anything or give me a command</p>
                <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                  {suggestions.map(q => (
                    <button key={q} onClick={() => setInput(q)}
                      style={{padding:'8px 12px',background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'8px',color:'#8b8fa8',fontSize:'11px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                      onMouseOver={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.4)';e.currentTarget.style.color='#1D9E75'}}
                      onMouseOut={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.15)';e.currentTarget.style.color='#8b8fa8'}}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{display:'flex',justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
                <div style={{maxWidth:'85%',padding:'10px 14px',borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#1D9E75,#085041)' : 'rgba(255,255,255,0.05)',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  fontSize:'13px',lineHeight:'1.6',color:'#f0f0f0',whiteSpace:'pre-wrap'}}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{display:'flex',justifyContent:'flex-start'}}>
                <div style={{padding:'10px 14px',borderRadius:'14px 14px 14px 4px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:'4px',alignItems:'center'}}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'#1D9E75',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* INPUT */}
          <div style={{padding:'0.875rem',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:'8px'}}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything or give a command..."
              style={{flex:1,padding:'10px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',fontSize:'13px',color:'#f0f0f0',outline:'none'}}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              style={{width:'40px',height:'40px',borderRadius:'10px',background: input.trim() ? 'linear-gradient(135deg,#1D9E75,#085041)' : 'rgba(255,255,255,0.05)',border:'none',color:'#fff',fontSize:'16px',cursor: input.trim() ? 'pointer' : 'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setShowChat(!showChat)}
        style={{position:'fixed',bottom:'24px',right:'24px',width:'64px',height:'64px',borderRadius:'50%',background:'linear-gradient(135deg,#1D9E75,#085041)',border:'3px solid rgba(255,255,255,0.2)',color:'#fff',fontSize:'26px',cursor:'pointer',boxShadow:'0 4px 24px rgba(29,158,117,0.6)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s',zIndex:1500,animation: showChat ? 'none' : 'pulse-ring 2s infinite'}}
        onMouseOver={e => e.currentTarget.style.transform='scale(1.12)'}
        onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
        {showChat ? '✕' : '✦'}
      </button>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 4px 24px rgba(29,158,117,0.6), 0 0 0 0 rgba(29,158,117,0.4); }
          70% { box-shadow: 0 4px 24px rgba(29,158,117,0.6), 0 0 0 14px rgba(29,158,117,0); }
          100% { box-shadow: 0 4px 24px rgba(29,158,117,0.6), 0 0 0 0 rgba(29,158,117,0); }
        }
      `}</style>
    </>
  )
}