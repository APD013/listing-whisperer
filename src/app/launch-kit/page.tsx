'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LaunchKitPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [form, setForm] = useState({
    type: 'Single family', beds: '', baths: '', sqft: '', price: '',
    neighborhood: '', features: '', notes: ''
  })
  const [launchPlan, setLaunchPlan] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('day1')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'launch_kit' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.neighborhood && !form.features) { alert('Please fill in at least the neighborhood and features!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/launch-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form, userId })
      })
      const data = await res.json()
      if (data.plan) {
        setLaunchPlan(data.plan)
        setActiveTab('day1')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const tabs = [
    { key: 'day1', label: 'Day 1', icon: '📅', sublabel: 'Launch Day' },
    { key: 'day2', label: 'Day 2', icon: '📅', sublabel: 'Follow Up' },
    { key: 'day3', label: 'Day 3', icon: '📅', sublabel: 'Mid Week' },
    { key: 'day4', label: 'Day 4', icon: '📅', sublabel: 'Spotlight' },
    { key: 'day5', label: 'Day 5', icon: '📅', sublabel: 'Open House' },
    { key: 'day6', label: 'Day 6', icon: '📅', sublabel: 'Weekend' },
    { key: 'day7', label: 'Day 7', icon: '📅', sublabel: 'Final Push' },
    { key: 'email_sequence', label: 'Emails', icon: '📧', sublabel: '3-Part Sequence' },
    { key: 'social_calendar', label: 'Social', icon: '📱', sublabel: 'Full Calendar' },
    { key: 'pro_tips', label: 'Pro Tips', icon: '💡', sublabel: 'Expert Advice' },
  ]

  const inputStyle = { width:'100%', padding:'11px 14px', background:'var(--lw-input)', border:'1px solid var(--lw-border)', borderRadius:'8px', fontSize:'13px', color:'var(--lw-text)', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'var(--lw-text-muted)', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'var(--lw-card)', borderRadius:'16px', border:'1px solid var(--lw-border)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', marginBottom:'1rem' }

  return (
    <main style={{minHeight:'100vh',background:'var(--lw-bg)',fontFamily:"var(--font-plus-jakarta), sans-serif"}}>

      {/* BACKGROUND GLOW */}
      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'var(--lw-card)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--lw-border)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'var(--lw-text)'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
          <a href="/" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>🚀 7-Day Listing Launch Kit</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Get a complete 7-day marketing plan — daily social posts, email sequences, and pro tips. Everything you need to launch like a pro.
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>LISTING DETAILS</p>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Property Type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inputStyle}>
                <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Beds</label>
              <input placeholder="3" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Baths</label>
              <input placeholder="2" value={form.baths || ''} onChange={e=>setForm({...form,baths:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Sq Ft</label>
              <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={inputStyle}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Neighborhood / City</label>
            <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Best Features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage..." value={form.features} onChange={e=>setForm({...form,features:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={labelStyle}>Agent Notes (optional)</label>
            <textarea placeholder="Open house date, special story, urgency..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              style={{...inputStyle, minHeight:'70px', resize:'vertical' as const}}/>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}>
            <button onClick={generate} disabled={loading}
              style={{width:'100%',padding:'14px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
              {loading ? '⏳ Building your launch plan...' : '🚀 Generate 7-Day Launch Kit'}
            </button>
            <p style={{fontSize:'11px',color:'#444',textAlign:'center',marginTop:'8px'}}>Takes about 20-30 seconds · 10 sections generated</p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{...cardStyle,textAlign:'center',padding:'2rem'}}>
            <div style={{fontSize:'2rem',marginBottom:'12px'}}>🚀</div>
            <p style={{color:'var(--lw-text)',fontWeight:'600',marginBottom:'6px'}}>Building your 7-day launch plan...</p>
            <p style={{color:'#6b7280',fontSize:'13px'}}>Creating daily social posts, email sequences, and pro tips tailored to your listing...</p>
          </div>
        )}

        {/* RESULTS */}
        {launchPlan && (
          <div id="results" style={cardStyle}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 4px'}}>LAUNCH KIT READY</p>
                <h2 style={{fontSize:'1rem',fontWeight:'600',color:'var(--lw-text)',margin:'0'}}>🎉 Your 7-Day Plan is ready!</h2>
              </div>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>10 sections</span>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1.25rem'}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{fontSize:'12px',padding:'6px 12px',borderRadius:'8px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                    borderColor: activeTab === t.key ? '#1D9E75' : 'var(--lw-border)',
                    background: activeTab === t.key ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)',
                    color: activeTab === t.key ? '#1D9E75' : 'var(--lw-text-muted)',
                    boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none',
                    fontWeight: activeTab === t.key ? '600' : '400'}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{marginBottom:'8px'}}>
              <span style={{fontSize:'11px',fontWeight:'600',color:'#1D9E75',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label} — {tabs.find(t => t.key === activeTab)?.sublabel}
              </span>
            </div>

            <div style={{background:'var(--lw-input)',borderRadius:'12px',padding:'1.5rem',border:'1px solid var(--lw-border)',position:'relative',minHeight:'120px'}}>
              <button onClick={() => { navigator.clipboard.writeText(launchPlan[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)',color: copied ? '#fff' : '#6b7280',border:'1px solid',borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)',cursor:'pointer',fontWeight:'500'}}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{fontSize:'14px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'var(--lw-text)',margin:'0',paddingRight:'90px'}}>
                {launchPlan[activeTab] || ''}
              </p>
            </div>

            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                🏠 Generate Full Copy Kit
              </a>
              <button onClick={() => setLaunchPlan(null)}
                style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                🔄 New Launch Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}