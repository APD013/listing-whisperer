'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SocialPlannerPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [calendar, setCalendar] = useState<any>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    address: '',
    neighborhood: '',
    price: '',
    beds: '',
    features: '',
    tone: 'Warm & inviting',
    startDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.neighborhood && !form.features) { alert('Please fill in at least the neighborhood and features!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/social-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.calendar) {
        setCalendar(data.calendar)
        setActiveDay(0)
        setTimeout(() => document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const getDayDate = (index: number) => {
    const date = new Date(form.startDate)
    date.setDate(date.getDate() + index)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const platforms = [
    { key: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c' },
    { key: 'facebook', label: 'Facebook', icon: '👥', color: '#1877f2' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0a66c2' },
    { key: 'twitter', label: 'X / Twitter', icon: '🐦', color: '#1da1f2' },
    { key: 'sms', label: 'SMS Blast', icon: '📱', color: '#10b981' },
  ]

  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>📅 Social Content Planner</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Generate a full 7-day social media calendar for any listing — Instagram, Facebook, LinkedIn, Twitter and SMS all at once.
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>LISTING DETAILS</p>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Property Address</label>
              <input placeholder="123 Main St" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Neighborhood / City</label>
              <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Beds / Baths</label>
              <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})} style={inputStyle}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Key Features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage..." value={form.features} onChange={e=>setForm({...form,features:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={labelStyle}>Tone</label>
              <select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})} style={inputStyle}>
                <option>Warm & inviting</option>
                <option>Luxury & aspirational</option>
                <option>Modern & minimal</option>
                <option>Family-friendly</option>
                <option>Investment-focused</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Campaign Start Date</label>
              <input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})} style={inputStyle}/>
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            style={{width:'100%',padding:'14px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
            {loading ? '⏳ Building your content calendar...' : '📅 Generate 7-Day Social Calendar'}
          </button>
          <p style={{fontSize:'11px',color:'#444',textAlign:'center',marginTop:'8px'}}>7 days · 5 platforms · 35 posts total</p>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{...cardStyle,textAlign:'center',padding:'2rem'}}>
            <div style={{fontSize:'2rem',marginBottom:'12px'}}>📅</div>
            <p style={{color:'#f0f0f0',fontWeight:'600',marginBottom:'6px'}}>Building your 7-day content calendar...</p>
            <p style={{color:'#6b7280',fontSize:'13px'}}>Creating posts for Instagram, Facebook, LinkedIn, Twitter and SMS...</p>
          </div>
        )}

        {/* CALENDAR */}
        {calendar && (
          <div id="calendar">
            <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.2)'}}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>📅 7-DAY CONTENT CALENDAR</p>

              {/* DAY TABS */}
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'1.5rem'}}>
                {calendar.days.map((day: any, i: number) => (
                  <button key={i} onClick={() => setActiveDay(i)}
                    style={{fontSize:'11px',padding:'6px 12px',borderRadius:'8px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                      borderColor: activeDay === i ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                      background: activeDay === i ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                      color: activeDay === i ? '#1D9E75' : '#6b7280',
                      fontWeight: activeDay === i ? '600' : '400'}}>
                    Day {i + 1} — {getDayDate(i)}
                  </button>
                ))}
              </div>

              {/* ACTIVE DAY */}
              {calendar.days[activeDay] && (
                <div>
                  <div style={{marginBottom:'12px',padding:'10px 14px',background:'rgba(29,158,117,0.06)',borderRadius:'10px',border:'1px solid rgba(29,158,117,0.1)'}}>
                    <p style={{fontSize:'12px',fontWeight:'600',color:'#1D9E75',margin:'0 0 2px'}}>🎯 Day {activeDay + 1} Theme</p>
                    <p style={{fontSize:'13px',color:'#e0e0e0',margin:'0'}}>{calendar.days[activeDay].theme}</p>
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                    {platforms.map(platform => (
                      <div key={platform.key} style={{background:'rgba(0,0,0,0.2)',borderRadius:'12px',padding:'1rem',border:'1px solid rgba(255,255,255,0.05)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <span style={{fontSize:'16px'}}>{platform.icon}</span>
                            <span style={{fontSize:'12px',fontWeight:'600',color:platform.color}}>{platform.label}</span>
                          </div>
                          <button onClick={() => {
                            navigator.clipboard.writeText(calendar.days[activeDay][platform.key] || '')
                            setCopied(`${activeDay}-${platform.key}`)
                            setTimeout(() => setCopied(null), 2000)
                          }}
                            style={{padding:'4px 12px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',
                              background: copied === `${activeDay}-${platform.key}` ? platform.color : 'rgba(0,0,0,0.3)',
                              color: copied === `${activeDay}-${platform.key}` ? '#fff' : '#6b7280',
                              borderColor: copied === `${activeDay}-${platform.key}` ? platform.color : 'rgba(255,255,255,0.08)'}}>
                            {copied === `${activeDay}-${platform.key}` ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{fontSize:'13px',lineHeight:'1.7',color:'#c0c0c0',margin:'0',whiteSpace:'pre-wrap'}}>
                          {calendar.days[activeDay][platform.key] || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'1rem'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                🏠 Back to Dashboard
              </a>
              <button onClick={() => { setCalendar(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                🔄 New Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}