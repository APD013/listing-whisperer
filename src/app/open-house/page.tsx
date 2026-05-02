'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OpenHouseKit() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    address: '',
    date: '',
    time: '',
    beds: '',
    baths: '',
    sqft: '',
    price: '',
    highlights: '',
    agentName: '',
    phone: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'open_house' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: "var(--font-plus-jakarta), sans-serif", color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.address) { alert('Please fill in the property address.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/open-house', {
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
      <div style={{background:'var(--lw-card)',borderBottom:'1px solid var(--lw-border)',padding:'0.875rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
        <a href="/dashboard" style={{fontSize:'13px',color:'var(--lw-text-muted)',textDecoration:'none'}}>← Dashboard</a>
        <div style={{fontSize:'14px',fontWeight:'700',color:'var(--lw-text)'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
      </div>

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'2.5rem 1.5rem'}}>
        <div style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(16,185,129,0.12)',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>🏡</div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'var(--lw-text)',margin:'0',letterSpacing:'-0.3px'}}>Open House Kit</h1>
              <p style={{fontSize:'13px',color:'#5a5f72',margin:'0'}}>Flyer copy, social posts, reminder texts, and follow-up emails</p>
            </div>
          </div>
        </div>

        <div style={{...styles.card, marginBottom:'1.5rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>OPEN HOUSE DETAILS</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'16px'}}>
            <div style={{gridColumn:'1 / -1'}}>
              <label style={styles.label}>Property Address</label>
              <input placeholder="123 Oak Street, Newport Beach, CA" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Open House Date</label>
              <input placeholder="Saturday, May 3rd" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Time</label>
              <input placeholder="1:00 PM – 4:00 PM" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Beds</label>
              <input placeholder="4" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Baths</label>
              <input placeholder="3" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Sq Ft</label>
              <input placeholder="2,200" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>List Price</label>
              <input placeholder="$1,295,000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={styles.input}/>
            </div>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px',marginBottom:'16px'}}>
            <label style={styles.label}>Key highlights / features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage..." value={form.highlights} onChange={e => setForm({...form, highlights: e.target.value})} style={{...styles.input, marginBottom:'12px'}}/>
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
              style={{width:'100%',padding:'15px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 30px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
              {loading ? '⏳ Generating...' : '🏡 Generate Open House Kit'}
            </button>
          </div>
        </div>

        {loading && (
          <div style={{...styles.card, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px'}}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{display:'flex',gap:'4px'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#10b981',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            <p style={{color:'var(--lw-text)',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>Building your open house kit...</p>
          </div>
        )}

        {result && !loading && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[
              { key: 'flyerCopy', label: 'Flyer Copy', icon: '📄', color: '#10b981', desc: 'Print-ready open house flyer' },
              { key: 'socialPost', label: 'Social Media Post', icon: '📱', color: '#e1306c', desc: 'Instagram & Facebook announcement' },
              { key: 'reminderText', label: 'Reminder Text', icon: '💬', color: '#6366f1', desc: 'SMS reminder to send day before' },
              { key: 'emailInvite', label: 'Email Invite', icon: '📧', color: '#1D9E75', desc: 'Email blast to your list' },
              { key: 'followUpEmail', label: 'Follow-Up Email', icon: '🤝', color: '#f59e0b', desc: 'Send to attendees after the open house' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{...styles.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{card.icon}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>{card.label}</p>
                      <p style={{fontSize:'11px',color:'#5a5f72',margin:'0'}}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'var(--lw-input)',color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',borderColor: copied === card.key ? card.color : 'var(--lw-border)'}}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.85',color:'var(--lw-text)',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'8px'}}>
              <a href="/dashboard" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>← Back to Dashboard</a>
              <button onClick={() => { setResult(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{padding:'10px 20px',background:'var(--lw-input)',color:'var(--lw-text-muted)',borderRadius:'10px',border:'1px solid var(--lw-border)',fontSize:'13px',cursor:'pointer'}}>
                ↺ New Open House
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}