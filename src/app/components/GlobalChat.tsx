'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

const CALL_CAPTURE_ENABLED = true

const TWO_PARTY_STATES = [
  'California', 'Illinois', 'Washington', 'Pennsylvania', 'Michigan',
  'Maryland', 'Massachusetts', 'Montana', 'Nevada', 'New Hampshire',
  'Oregon', 'Connecticut', 'Delaware'
]

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
  const [userPlan, setUserPlan] = useState('starter')
  const [userState, setUserState] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Call Capture state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showCallCapture, setShowCallCapture] = useState(false)
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false)
  const [callProcessing, setCallProcessing] = useState(false)
  const [callResult, setCallResult] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, brand_voice')
          .eq('id', session.user.id)
          .single()
        if (profile) {
          setUserPlan(profile.plan || 'starter')
          if (profile.brand_voice) {
            try {
              const bv = JSON.parse(profile.brand_voice)
              setUserState(bv.state || '')
            } catch(e) {}
          }
        }
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

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setRecordingTime(0)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  if (HIDDEN_PATHS.includes(pathname)) return null

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const isTwoPartyState = TWO_PARTY_STATES.includes(userState)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
    } catch(e) {
      alert('Could not access microphone. Please allow microphone access and try again.')
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return
    setIsRecording(false)
    setCallProcessing(true)

    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())

    await new Promise(resolve => setTimeout(resolve, 500))

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', audioBlob, 'call.webm')
    formData.append('userId', userId || '')

    try {
      const res = await fetch('/api/call-capture', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setCallResult(data)
      } else {
        alert('Error processing call: ' + data.error)
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setCallProcessing(false)
  }

  const handleCallCaptureClick = () => {
    if (userPlan !== 'pro') {
      alert('Call Capture is a Pro feature. Upgrade to Pro to use it!')
      return
    }
    if (isTwoPartyState) {
      setShowDisclaimerModal(true)
    } else {
      setShowCallCapture(true)
    }
  }

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
        if (voiceEnabled && typeof window !== 'undefined' && window.speechSynthesis) {
          const cleanText = data.message
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
            .replace(/\*\*/g, '').replace(/\*/g, '')
            .replace(/#{1,6}\s/g, '').replace(/---/g, '')
            .replace(/\n+/g, ' ').trim()
          const utterance = new SpeechSynthesisUtterance(cleanText)
          const voices = window.speechSynthesis.getVoices()
          const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Google US English'))
          if (preferred) utterance.voice = preferred
          utterance.rate = 1.05
          utterance.pitch = 1.1
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(utterance)
        }
      }

      if (data.action) {
        const action = data.action
        if (action.type === 'navigate') {
          setTimeout(() => { window.location.assign(action.url) }, 1000)
        }
        if (action.type === 'lead_added' && userId) {
          const { data: leadData, error } = await supabase.from('leads').insert({
            user_id: userId,
            name: action.name || 'New Lead',
            email: action.email || null,
            status: 'New Lead',
          }).select()
          if (!error) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `✅ **${action.name || 'New Lead'}** has been added to your Leads & Clients! Taking you there now...`
            }])
            setTimeout(() => { window.location.assign('/leads') }, 1500)
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
      {/* TWO-PARTY DISCLAIMER MODAL */}
      {showDisclaimerModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
          <div style={{background:'#1a1d2e',borderRadius:'20px',border:'1px solid rgba(239,68,68,0.3)',padding:'2rem',maxWidth:'400px',width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'}}>
            <div style={{fontSize:'2rem',marginBottom:'12px',textAlign:'center'}}>⚠️</div>
            <h3 style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0',margin:'0 0 12px',textAlign:'center'}}>Two-Party Consent Required</h3>
            <p style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'1.7',margin:'0 0 20px'}}>
              You are in <strong style={{color:'#f0f0f0'}}>{userState}</strong>, a two-party consent state. You must inform the other party that this call is being recorded before continuing.
            </p>
            <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'10px',padding:'12px 14px',marginBottom:'16px'}}>
              <p style={{fontSize:'12px',color:'#f87171',margin:'0',lineHeight:'1.6'}}>
                By continuing, you confirm that you have informed all parties on this call that it will be recorded.
              </p>
            </div>
            <div style={{marginBottom:'20px'}}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#8b8fa8',letterSpacing:'1px',margin:'0 0 10px'}}>💬 SCRIPTS TO ASK CONSENT</p>
              {[
                { label: 'Casual', script: '"Hey, just so you know I\'m going to record this call so I can follow up accurately — is that okay?"' },
                { label: 'Professional', script: '"Before we get started, I want to let you know this call may be recorded for note-taking purposes. Do you consent to that?"' },
                { label: 'Quick', script: '"I record my calls to make sure I capture all the details — totally fine with you?"' },
              ].map((s, i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'8px',padding:'10px 12px',marginBottom:'8px',cursor:'pointer'}}
                  onClick={() => navigator.clipboard.writeText(s.script)}
                  title="Click to copy">
                  <p style={{fontSize:'10px',fontWeight:'700',color:'#1D9E75',margin:'0 0 4px',letterSpacing:'0.5px'}}>{s.label} — click to copy</p>
                  <p style={{fontSize:'12px',color:'#c0c0c0',margin:'0',lineHeight:'1.6',fontStyle:'italic'}}>{s.script}</p>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setShowDisclaimerModal(false)}
                style={{flex:1,padding:'11px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#6b7280',fontSize:'13px',cursor:'pointer',fontWeight:'600'}}>
                Cancel
              </button>
              <button onClick={() => { setShowDisclaimerModal(false); setShowCallCapture(true) }}
                style={{flex:2,padding:'11px',background:'linear-gradient(135deg,#1D9E75,#085041)',border:'none',borderRadius:'10px',color:'#fff',fontSize:'13px',cursor:'pointer',fontWeight:'700'}}>
                I've Notified All Parties →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL CAPTURE UI */}
      {showCallCapture && (
        <div style={{position:'fixed',bottom:'84px',right: showChat ? '400px' : '24px',width:'320px',background:'#1a1d2e',borderRadius:'20px',border:'1px solid rgba(239,68,68,0.25)',boxShadow:'0 24px 60px rgba(0,0,0,0.5)',overflow:'hidden',zIndex:1600}}>
          <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#ef4444,#b91c1c)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>📞</div>
              <div>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>Call Capture</p>
                <p style={{fontSize:'10px',color:'#ef4444',margin:'0'}}>Pro Feature</p>
              </div>
            </div>
            <button onClick={() => { setShowCallCapture(false); setCallResult(null); setIsRecording(false) }}
              style={{background:'none',border:'none',color:'#555',fontSize:'18px',cursor:'pointer'}}>✕</button>
          </div>

          <div style={{padding:'1.25rem'}}>
            {!callResult && !callProcessing && (
              <>
                <p style={{fontSize:'12px',color:'#8b8fa8',margin:'0 0 16px',lineHeight:'1.6',textAlign:'center'}}>
                  {isRecording ? 'Recording in progress — place your phone on speaker' : 'Tap Record when you answer the call. Place phone on speaker so both sides are captured.'}
                </p>

                {isRecording && (
                  <div style={{textAlign:'center',marginBottom:'16px'}}>
                    <div style={{fontSize:'2rem',marginBottom:'4px'}}>🔴</div>
                    <p style={{fontSize:'20px',fontWeight:'700',color:'#ef4444',margin:'0',fontFamily:'monospace'}}>{formatTime(recordingTime)}</p>
                    <p style={{fontSize:'11px',color:'#6b7280',margin:'4px 0 0'}}>Recording...</p>
                  </div>
                )}

                <button onClick={isRecording ? stopRecording : startRecording}
                  style={{width:'100%',padding:'14px',background: isRecording ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',boxShadow: isRecording ? '0 4px 20px rgba(239,68,68,0.4)' : '0 4px 20px rgba(29,158,117,0.3)'}}>
                  {isRecording ? '⏹ Stop & Analyze Call' : '🔴 Start Recording'}
                </button>

                <p style={{fontSize:'10px',color:'#444',textAlign:'center',margin:'8px 0 0',lineHeight:'1.5'}}>
                  By recording you agree to comply with your local recording laws.
                </p>
              </>
            )}

            {callProcessing && (
              <div style={{textAlign:'center',padding:'1rem 0'}}>
                <div style={{fontSize:'2rem',marginBottom:'12px'}}>🤖</div>
                <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0 0 6px'}}>Analyzing your call...</p>
                <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Transcribing and extracting lead details</p>
              </div>
            )}

            {callResult && (
              <div>
                <div style={{background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'12px',padding:'1rem',marginBottom:'12px'}}>
                  <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',margin:'0 0 8px',letterSpacing:'1px'}}>✅ LEAD CAPTURED</p>
                  {callResult.lead.name && <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0 0 4px'}}>👤 {callResult.lead.name}</p>}
                  {callResult.lead.phone && <p style={{fontSize:'12px',color:'#8b8fa8',margin:'0 0 4px'}}>📞 {callResult.lead.phone}</p>}
                  {callResult.lead.address && <p style={{fontSize:'12px',color:'#8b8fa8',margin:'0 0 4px'}}>🏠 {callResult.lead.address}</p>}
                  {callResult.lead.est_price && <p style={{fontSize:'12px',color:'#1D9E75',fontWeight:'600',margin:'0 0 4px'}}>💰 {callResult.lead.est_price}</p>}
                  {callResult.lead.notes && <p style={{fontSize:'12px',color:'#8b8fa8',margin:'8px 0 0',lineHeight:'1.5',fontStyle:'italic'}}>"{callResult.lead.notes}"</p>}
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <a href="/leads" style={{flex:1,padding:'10px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'12px',fontWeight:'700',textAlign:'center'}}>
                    View in Leads →
                  </a>
                  <button onClick={() => { setCallResult(null); setIsRecording(false) }}
                    style={{padding:'10px 14px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:'#6b7280',fontSize:'12px',cursor:'pointer',fontWeight:'600'}}>
                    New Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
              {CALL_CAPTURE_ENABLED && (
                <button onClick={handleCallCaptureClick}
                  title="Call Capture — Record & analyze calls"
                  style={{width:'32px',height:'32px',borderRadius:'8px',background: showCallCapture ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',border: showCallCapture ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',color: showCallCapture ? '#ef4444' : '#6b7280',fontSize:'14px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  📞
                </button>
              )}
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
                {CALL_CAPTURE_ENABLED && userPlan === 'pro' && (
                  <div style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:'10px',padding:'10px 12px',marginBottom:'12px',cursor:'pointer'}} onClick={handleCallCaptureClick}>
                    <p style={{fontSize:'12px',color:'#ef4444',fontWeight:'600',margin:'0 0 2px'}}>📞 Call Capture</p>
                    <p style={{fontSize:'11px',color:'#8b8fa8',margin:'0'}}>Tap to record & auto-log your next call</p>
                  </div>
                )}
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