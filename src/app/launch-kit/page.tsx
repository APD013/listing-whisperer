'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
    type: 'Single family', beds: '', sqft: '', price: '',
    neighborhood: '', features: '', notes: ''
  })
  const [launchPlan, setLaunchPlan] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('day1')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
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
    if (!form.neighborhood && !form.features) {
      alert('Please fill in at least the neighborhood and features!')
      return
    }
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
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(launchPlan[activeTab] || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'day1', label: '📅 Day 1', sublabel: 'Launch Day' },
    { key: 'day2', label: '📅 Day 2', sublabel: 'Follow Up' },
    { key: 'day3', label: '📅 Day 3', sublabel: 'Mid Week' },
    { key: 'day4', label: '📅 Day 4', sublabel: 'Spotlight' },
    { key: 'day5', label: '📅 Day 5', sublabel: 'Open House' },
    { key: 'day6', label: '📅 Day 6', sublabel: 'Weekend' },
    { key: 'day7', label: '📅 Day 7', sublabel: 'Final Push' },
    { key: 'email_sequence', label: '📧 Emails', sublabel: '3-Part Sequence' },
    { key: 'social_calendar', label: '📱 Social', sublabel: 'Full Calendar' },
    { key: 'pro_tips', label: '💡 Pro Tips', sublabel: 'Expert Advice' },
  ]

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>
      {/* NAV */}
      <div style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span>{planLoaded && plan === 'pro' && (<span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>PRO</span>)}</div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← Dashboard</a>
          <a href="/settings" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>⚙️ Settings</a>
          <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'2rem',marginBottom:'1.5rem',color:'#fff'}}>
          <h1 style={{fontSize:'1.75rem',fontWeight:'700',marginBottom:'0.5rem'}}>🚀 Listing Launch Kit</h1>
          <p style={{fontSize:'15px',color:'#a8f0d4',lineHeight:'1.7',margin:'0'}}>
            Get a complete 7-day marketing plan for your listing — daily social posts, email sequences, and pro tips. Everything you need to launch like a pro.
          </p>
        </div>

        {/* FORM */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize:'1rem',fontWeight:'600',marginBottom:'1rem'}}>Tell us about your listing</h2>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property type</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                <option>Single family</option><option>Condo</option><option>Townhome</option>
                <option>Luxury estate</option><option>Multi-family</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Beds / Baths</label>
              <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Sq ft</label>
              <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Neighborhood / City</label>
            <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Best features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage" value={form.features} onChange={e=>setForm({...form,features:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Agent notes (optional)</label>
            <textarea placeholder="Open house date, special story, urgency..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',minHeight:'70px',resize:'vertical',boxSizing:'border-box'}}/>
          </div>

          <button onClick={generate} disabled={loading}
            style={{width:'100%',padding:'13px',background: loading ? '#085041' : '#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor: loading ? 'not-allowed' : 'pointer',transition:'all 0.2s'}}>
            {loading ? '⏳ Building your launch plan... this takes 20-30 seconds' : '🚀 Generate 7-Day Launch Kit'}
          </button>
        </div>

        {/* LOADING BANNER */}
        {loading && (
          <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e5e7eb',padding:'2rem',marginBottom:'1.5rem',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'2rem',marginBottom:'1rem'}}>⏳</div>
            <p style={{fontSize:'15px',fontWeight:'600',color:'#333',marginBottom:'8px'}}>Building your 7-day launch plan...</p>
            <p style={{fontSize:'13px',color:'#666',marginBottom:'16px'}}>This usually takes 20-30 seconds. Please don't close this page!</p>
            <div style={{background:'#f0fdf8',borderRadius:'8px',padding:'12px',border:'1px solid #bbf0d9'}}>
              <p style={{fontSize:'12px',color:'#085041',margin:'0'}}>✨ Our AI is creating daily social posts, email sequences, and pro tips tailored to your listing...</p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {launchPlan && (
          <div id="results" style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
              <h2 style={{fontSize:'1rem',fontWeight:'600',margin:'0'}}>🎉 Your 7-Day Launch Plan is ready!</h2>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>10 sections generated</span>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1.25rem'}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{fontSize:'12px',padding:'6px 12px',borderRadius:'20px',border:'1px solid',cursor:'pointer',
                    borderColor: activeTab === t.key ? '#1D9E75' : '#e5e7eb',
                    background: activeTab === t.key ? '#1D9E75' : '#fff',
                    color: activeTab === t.key ? '#fff' : '#666',
                    fontWeight: activeTab === t.key ? '600' : '400'}}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{marginBottom:'8px'}}>
              <span style={{fontSize:'12px',fontWeight:'600',color:'#1D9E75',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                {tabs.find(t => t.key === activeTab)?.label} — {tabs.find(t => t.key === activeTab)?.sublabel}
              </span>
            </div>

            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e5e7eb',position:'relative',minHeight:'120px'}}>
              <button onClick={handleCopy}
                style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 16px',borderRadius:'20px',background: copied ? '#1D9E75' : '#fff',color: copied ? '#fff' : '#333',border:'1px solid',borderColor: copied ? '#1D9E75' : '#ddd',cursor:'pointer',fontWeight:'500'}}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{fontSize:'14px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#333',margin:'0',paddingRight:'80px'}}>
                {launchPlan[activeTab] || ''}
              </p>
            </div>

            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',textDecoration:'none',fontWeight:'500'}}>
                🏠 Generate Full Copy Kit
              </a>
              <button onClick={() => setLaunchPlan(null)}
                style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f8fafc',color:'#666',border:'1px solid #e5e7eb',cursor:'pointer'}}>
                🔄 New Launch Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}