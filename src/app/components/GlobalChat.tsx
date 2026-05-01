'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

// Voice input setup
const SpeechRecognition = typeof window !== 'undefined' 
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition 
  : null

const HIDDEN_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/pricing', '/terms', '/privacy', '/contact']

export default function GlobalChat() {
  const pathname = usePathname()
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<{role:string,content:string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      }
    }
    getUser()
    const dismissed = sessionStorage.getItem('lw_chat_dismissed')
    if (!dismissed) setShowChat(true)
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

  const startListening = () => {
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognitionRef.current = recognition
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

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
          userId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
      const data = await res.json()

      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        // Voice output — read response aloud if enabled
        if (voiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
          // Strip emojis and markdown before speaking
          const cleanText = data.message
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{3030}]|[\u{2B50}]|[\u{2B55}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{3297}]|[\u{3299}]|[\u{303D}]|[\u{00A9}]|[\u{00AE}]|[\u{2122}]|[\u{23F3}]|[\u{24C2}]|[\u{23E9}-\u{23F3}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}-\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '')
            .replace(/\*\*/g, '')
            .replace(/\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/---/g, '')
            .replace(/\n+/g, ' ')
            .trim()
          const utterance = new SpeechSynthesisUtterance(cleanText)
          // Pick a friendly natural voice
          const voices = window.speechSynthesis.getVoices()
          const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Moira') || v.name.includes('Google US English') || v.name.includes('Alex'))
          if (preferred) utterance.voice = preferred
          utterance.rate = 1.05
          utterance.pitch = 1.1
          utterance.volume = 1.0
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
        }
      }

      // Handle actions client-side with authenticated supabase
      if (data.action) {
        const action = data.action

        if (action.type === 'navigate') {
          setTimeout(() => { window.location.assign(action.url) }, 1000)
        }

        if (action.type === 'lead_added' && userId) {
          console.log('Attempting lead insert for userId:', userId)
          const { data, error } = await supabase.from('leads').insert({
            user_id: userId,
            name: action.name || 'New Lead',
            email: action.email || null,
            status: 'New Lead',
          }).select()
          console.log('Lead insert result:', data, error)
          if (!error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ **${action.name || 'New Lead'}** has been added to your Leads & Clients! Taking you there now...`
            }])
            setTimeout(() => { window.location.assign('/leads') }, 1500)
          } else {
            console.error('Lead insert error:', error)
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `❌ Could not add lead: ${error.message}`
            }])
          }
        }

        if (action.type === 'reminder_created' && userId) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `✅ Reminder set! Taking you to your reminders now...`
          }])
          setTimeout(() => { window.location.assign('/reminders') }, 1500)
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
              <button onClick={() => { setShowChat(false); sessionStorage.setItem('lw_chat_dismissed', '1') }} style={{background:'none',border:'none',color:'#555',fontSize:'18px',cursor:'pointer'}}>✕</button>
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
              placeholder={isListening ? '🎤 Listening...' : 'Ask anything or give a command...'}
              style={{flex:1,padding:'10px 14px',background: isListening ? 'rgba(29,158,117,0.1)' : 'rgba(0,0,0,0.3)',border: isListening ? '1px solid rgba(29,158,117,0.4)' : '1px solid rgba(255,255,255,0.08)',borderRadius:'10px',fontSize:'13px',color:'#f0f0f0',outline:'none',transition:'all 0.2s'}}
            />
            <button onClick={isListening ? stopListening : startListening}
              style={{width:'40px',height:'40px',borderRadius:'10px',background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',color: isListening ? '#f87171' : '#6b7280',fontSize:'16px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s'}}>
              {isListening ? '⏹' : '🎤'}
            </button>
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