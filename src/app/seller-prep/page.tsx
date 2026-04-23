'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SellerPrepPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('meeting_outline')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    address: '',
    neighborhood: '',
    type: 'Single family',
    beds: '',
    sqft: '',
    estimatedPrice: '',
    sellerGoals: '',
    timeframe: '',
    propertyCondition: 'Good',
    notes: '',
    agentName: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            if (bv.agentName) setForm(prev => ({ ...prev, agentName: bv.agentName }))
          } catch(e) {}
        }
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.address && !form.neighborhood) {
      alert('Please enter at least the property address or neighborhood!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/seller-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('meeting_outline')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'meeting_outline', label: '📋 Meeting Outline' },
    { key: 'talking_points', label: '🎤 Talking Points' },
    { key: 'seller_questions', label: '❓ Questions to Ask' },
    { key: 'marketing_preview', label: '📣 Marketing Preview' },
    { key: 'selling_angles', label: '🎯 Selling Angles' },
    { key: 'followup_email', label: '📧 Follow-Up Email' },
    { key: 'presentation_intro', label: '📊 Presentation Intro' },
  ]

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>
      {/* NAV */}
      <div style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span>{planLoaded && plan === 'pro' && (<span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>PRO</span>)}</div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← Dashboard</a>
          <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'2rem',marginBottom:'1.5rem',color:'#fff'}}>
          <h1 style={{fontSize:'1.75rem',fontWeight:'700',marginBottom:'0.5rem'}}>📋 Seller Meeting Prep</h1>
          <p style={{fontSize:'15px',color:'#a8f0d4',lineHeight:'1.7',margin:'0'}}>
            Walk into every listing appointment fully prepared. Get a meeting outline, talking points, questions to ask, and a follow-up email — all tailored to the property.
          </p>
        </div>

        {/* FORM */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize:'1rem',fontWeight:'600',marginBottom:'1rem'}}>Tell us about the appointment</h2>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property Address</label>
              <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property Type</label>
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
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Sq Ft (if known)</label>
              <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Estimated Price Range</label>
              <input placeholder="$800k - $900k" value={form.estimatedPrice} onChange={e=>setForm({...form,estimatedPrice:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property Condition</label>
              <select value={form.propertyCondition} onChange={e=>setForm({...form,propertyCondition:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                <option>Excellent</option><option>Good</option><option>Average</option><option>Needs work</option><option>Unknown</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Seller Goals (what do you know so far?)</label>
            <input placeholder="Downsizing, relocating, quick sale, maximize price..." value={form.sellerGoals} onChange={e=>setForm({...form,sellerGoals:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Desired Timeframe</label>
            <input placeholder="ASAP, 30 days, 3-6 months, flexible..." value={form.timeframe} onChange={e=>setForm({...form,timeframe:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Your Name</label>
            <input placeholder="Jane Smith" value={form.agentName} onChange={e=>setForm({...form,agentName:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Additional Notes</label>
            <textarea placeholder="Anything else you know about the property, seller, or situation..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',minHeight:'80px',resize:'vertical',boxSizing:'border-box'}}/>
          </div>

          <button onClick={generate} disabled={loading}
            style={{width:'100%',padding:'13px',background: loading ? '#085041' : '#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor: loading ? 'not-allowed' : 'pointer'}}>
            {loading ? '⏳ Preparing your meeting kit...' : '📋 Generate Meeting Prep Kit'}
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e5e7eb',padding:'2rem',marginBottom:'1.5rem',textAlign:'center'}}>
            <div style={{fontSize:'2rem',marginBottom:'1rem'}}>📋</div>
            <p style={{fontSize:'15px',fontWeight:'600',color:'#333',marginBottom:'8px'}}>Preparing your meeting kit...</p>
            <p style={{fontSize:'13px',color:'#666',marginBottom:'16px'}}>This takes about 20-30 seconds.</p>
            <div style={{background:'#f0fdf8',borderRadius:'8px',padding:'12px',border:'1px solid #bbf0d9'}}>
              <p style={{fontSize:'12px',color:'#085041',margin:'0'}}>✨ Creating meeting outline, talking points, seller questions, and follow-up email...</p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {outputs && (
          <div id="results" style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
              <h2 style={{fontSize:'1rem',fontWeight:'600',margin:'0'}}>🎉 Your Meeting Prep Kit is ready!</h2>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>7 sections</span>
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

            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e5e7eb',position:'relative',minHeight:'120px'}}>
              <button onClick={() => handleCopy(outputs[activeTab] || '')}
                style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 16px',borderRadius:'20px',
                  background: copied ? '#1D9E75' : '#fff',color: copied ? '#fff' : '#333',
                  border:'1px solid',borderColor: copied ? '#1D9E75' : '#ddd',cursor:'pointer',fontWeight:'500'}}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{fontSize:'14px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#333',margin:'0',paddingRight:'80px'}}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#1D9E75',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                🏠 Generate Full Marketing Kit
              </a>
              <a href="/snap-start" style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',textDecoration:'none',fontWeight:'500'}}>
                📸 Snap & Start On-Site
              </a>
              <button onClick={() => setOutputs(null)}
                style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f8fafc',color:'#666',border:'1px solid #e5e7eb',cursor:'pointer'}}>
                🔄 New Prep Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}