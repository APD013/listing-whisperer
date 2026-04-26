'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FollowUpAssistant() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '',
    contactType: 'Seller lead',
    meetingType: 'Listing appointment',
    propertyAddress: '',
    keyPoints: '',
    nextStep: '',
    agentName: '',
    phone: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: '#0d1117', fontFamily: "'Inter', sans-serif", color: '#f0f0f0' },
    card: { background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0' },
    label: { fontSize: '11px', color: '#6b7280', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.contactName) { alert('Please fill in the contact name.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else alert('Error: ' + (data.error || 'Something went wrong'))
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={{background:'rgba(10,13,20,0.98)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0.875rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
        <a href="/dashboard" style={{fontSize:'13px',color:'#5a5f72',textDecoration:'none'}}>← Dashboard</a>
        <div style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{width:'80px'}}/>
      </div>

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'2.5rem 1.5rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>📩</div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',margin:'0',letterSpacing:'-0.3px'}}>Follow-Up Assistant</h1>
              <p style={{fontSize:'13px',color:'#5a5f72',margin:'0'}}>Post-meeting and post-showing follow-up emails and texts</p>
            </div>
          </div>
        </div>

        <div style={{...styles.card, marginBottom:'1.5rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>CONTACT & MEETING DETAILS</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={styles.label}>Contact Name</label>
              <input placeholder="John & Sarah Smith" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Contact Type</label>
              <select value={form.contactType} onChange={e => setForm({...form, contactType: e.target.value})} style={styles.select}>
                <option>Seller lead</option>
                <option>Buyer lead</option>
                <option>Open house attendee</option>
                <option>Past client</option>
                <option>Referral</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Meeting Type</label>
              <select value={form.meetingType} onChange={e => setForm({...form, meetingType: e.target.value})} style={styles.select}>
                <option>Listing appointment</option>
                <option>Buyer consultation</option>
                <option>Property showing</option>
                <option>Open house</option>
                <option>Phone call</option>
                <option>Networking event</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Property Address</label>
              <input placeholder="123 Oak Street, Newport Beach" value={form.propertyAddress} onChange={e => setForm({...form, propertyAddress: e.target.value})} style={styles.input}/>
            </div>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px',marginBottom:'16px'}}>
            <label style={styles.label}>Key points from the meeting</label>
            <textarea placeholder="What was discussed, what they liked, concerns raised, timeline, budget..." value={form.keyPoints} onChange={e => setForm({...form, keyPoints: e.target.value})}
              style={{...styles.input, minHeight:'80px', resize:'vertical' as const, marginBottom:'12px'}}/>
            <label style={styles.label}>Agreed next step</label>
            <input placeholder="Schedule second showing, send CMA, sign listing agreement..." value={form.nextStep} onChange={e => setForm({...form, nextStep: e.target.value})} style={styles.input}/>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 12px'}}>AGENT INFO (OPTIONAL)</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
              <div>
                <label style={styles.label}>Agent Name</label>
                <input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({...form, agentName: e.target.value})} style={styles.input}/>
              </div>
              <div>
                <label style={styles.label}>Phone</label>
                <input placeholder="(949) 555-0123" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={styles.input}/>
              </div>
            </div>
            <button onClick={generate} disabled={loading}
              style={{width:'100%',padding:'15px',background: loading ? '#085041' : 'linear-gradient(135deg,#6366f1,#4338ca)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 30px rgba(99,102,241,0.3)',transition:'all 0.2s'}}>
              {loading ? '⏳ Generating...' : '📩 Generate Follow-Up Kit'}
            </button>
          </div>
        </div>

        {loading && (
          <div style={{...styles.card, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px'}}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{display:'flex',gap:'4px'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#6366f1',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            <p style={{color:'#f0f0f0',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>Writing your follow-up messages...</p>
          </div>
        )}

        {result && !loading && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[
              { key: 'emailFollowUp', label: 'Follow-Up Email', icon: '📧', color: '#6366f1', desc: 'Professional email to send within 24 hours' },
              { key: 'textFollowUp', label: 'Follow-Up Text', icon: '💬', color: '#10b981', desc: 'Casual SMS to send same day' },
              { key: 'linkedinMessage', label: 'LinkedIn Message', icon: '💼', color: '#0a66c2', desc: 'Professional connection message' },
              { key: 'reminderNote', label: 'CRM Reminder Note', icon: '📋', color: '#d4af37', desc: 'Notes to add to your CRM for this contact' },
              { key: 'nextStepEmail', label: 'Next Step Email', icon: '🎯', color: '#1D9E75', desc: 'Email to confirm and advance the next step' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{...styles.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{card.icon}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>{card.label}</p>
                      <p style={{fontSize:'11px',color:'#5a5f72',margin:'0'}}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'rgba(0,0,0,0.2)',color: copied === card.key ? '#fff' : '#6b7280',borderColor: copied === card.key ? card.color : 'rgba(255,255,255,0.08)'}}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.85',color:'#c0c0c0',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'8px'}}>
              <a href="/dashboard" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>← Back to Dashboard</a>
              <button onClick={() => { setResult(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{padding:'10px 20px',background:'rgba(0,0,0,0.2)',color:'#8b8fa8',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.08)',fontSize:'13px',cursor:'pointer'}}>
                ↺ New Follow-Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}