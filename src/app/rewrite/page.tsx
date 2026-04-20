'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RewritePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [listing, setListing] = useState('')
  const [style, setStyle] = useState('Professional and compelling')
  const [outputs, setOutputs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('standard')
  const [showExample, setShowExample] = useState(false)
  const [rewritesUsed, setRewritesUsed] = useState(0)
  const [plan, setPlan] = useState('starter')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('rewrites_used, plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setRewritesUsed(profile.rewrites_used || 0)
        setPlan(profile.plan || 'starter')
      }
    }
    getUser()
  }, [])

  const rewrite = async () => {
    if (!listing.trim()) { alert('Please paste a listing first!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, style, userId })
      })
      const data = await res.json()
      if (data.error === 'REWRITE_LIMIT_REACHED') {
        router.push('/pricing')
        return
      }
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('standard')
        setRewritesUsed(prev => prev + 1)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const tabs = [
    { key: 'standard', label: 'Standard MLS' },
    { key: 'luxury', label: 'Luxury' },
    { key: 'short', label: 'Short Version' },
    { key: 'social', label: 'Instagram' },
    { key: 'headline', label: 'Headlines' },
    { key: 'improvements', label: 'What Changed' },
  ]

  return (
    <main style={{minHeight:'100vh',padding:'2rem',fontFamily:'sans-serif',maxWidth:'740px',margin:'0 auto'}}>
      {/* HEADER */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',gap:'12px'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← New Listing</a>
          {plan === 'starter' && (
          <span style={{fontSize:'12px',fontWeight:'bold',color: rewritesUsed >= 2 ? 'red' : '#666'}}>
            {3 - rewritesUsed} rewrites left
          </span>
        )}
        <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      {/* HERO */}
      <div style={{background:'linear-gradient(135deg,#f0fdf8,#e8f9f2)',borderRadius:'16px',padding:'2rem',marginBottom:'1.5rem',border:'1px solid #bbf0d9'}}>
        <h1 style={{fontSize:'1.75rem',fontWeight:'700',marginBottom:'0.5rem'}}>✨ Listing Rewriter</h1>
        <p style={{fontSize:'15px',color:'#444',marginBottom:'1rem',lineHeight:'1.7'}}>
          Turn dull MLS copy into polished, buyer-ready marketing in seconds. Paste your current listing — we'll make it shine.
        </p>
        <p style={{fontSize:'12px',color:'#666',fontStyle:'italic'}}>Best for: boring, basic, or outdated MLS descriptions</p>
      </div>

      {/* BEFORE/AFTER EXAMPLE */}
      <div style={{marginBottom:'1.5rem'}}>
        <button onClick={() => setShowExample(!showExample)}
          style={{fontSize:'13px',color:'#1D9E75',background:'none',border:'none',cursor:'pointer',padding:'0',fontWeight:'500'}}>
          {showExample ? '▲ Hide example' : '▼ See a before/after example'}
        </button>
        {showExample && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1rem'}}>
            <div style={{background:'#fff8f0',border:'1px solid #fde8c8',borderRadius:'12px',padding:'1.25rem'}}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#999',marginBottom:'8px',letterSpacing:'1px'}}>BEFORE — BORING</p>
              <p style={{fontSize:'13px',color:'#666',lineHeight:'1.8',fontStyle:'italic'}}>
                "3 bed 2 bath home in Newport Beach. Has a kitchen and living room. Good size backyard. Close to schools. $899,000."
              </p>
            </div>
            <div style={{background:'#f0fdf8',border:'1px solid #bbf0d9',borderRadius:'12px',padding:'1.25rem'}}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'8px',letterSpacing:'1px'}}>AFTER — POLISHED</p>
              <p style={{fontSize:'13px',color:'#333',lineHeight:'1.8'}}>
                "Welcome to this beautifully appointed 3-bedroom coastal retreat in the heart of Newport Beach. The open-concept living and dining area flows seamlessly into a chef-inspired kitchen — perfect for entertaining. Step outside to a generous backyard oasis, ideal for family gatherings. Steps from top-rated schools and minutes from the beach. Offered at $899,000."
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Paste your existing listing description</label>
        <textarea
          placeholder="Paste your current MLS description here... even if it's boring or basic, we'll make it shine."
          value={listing}
          onChange={e => setListing(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px',minHeight:'150px',resize:'vertical',boxSizing:'border-box'}}
        />
      </div>

      {/* STYLE */}
      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'8px'}}>Rewrite style</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
          {['Professional and compelling','Luxury and aspirational','Warm and inviting','Modern and minimal','Family-friendly','Investment-focused','High urgency'].map(s => (
            <button key={s} onClick={() => setStyle(s)}
              style={{padding:'6px 14px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',
                borderColor: style === s ? '#1D9E75' : '#ddd',
                background: style === s ? '#E1F5EE' : '#fff',
                color: style === s ? '#085041' : '#666'}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {plan === 'starter' && rewritesUsed >= 3 ? (
        <div style={{background:'#FFF3CD',border:'1px solid #FFCC00',borderRadius:'12px',padding:'1.5rem',marginBottom:'1.5rem',textAlign:'center'}}>
          <p style={{fontWeight:'600',fontSize:'15px',margin:'0 0 8px'}}>You've used all 3 free rewrites!</p>
          <p style={{fontSize:'13px',color:'#666',margin:'0 0 12px'}}>Upgrade to Pro for unlimited rewrites, full marketing kits, and saved listing history.</p>
          <a href="/pricing" style={{display:'inline-block',background:'#1D9E75',color:'#fff',padding:'10px 24px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',fontSize:'14px'}}>
            Upgrade to Pro — $29/mo
          </a>
        </div>
      ) : (
        <button onClick={rewrite} disabled={loading}
          style={{width:'100%',padding:'13px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'600',cursor:'pointer',marginBottom:'1.5rem'}}>
          {loading ? 'Rewriting your listing...' : '✨ Make This Listing Shine'}
        </button>
      )}

      {outputs && (
        <div>
          {/* WHAT CHANGED */}
          <div style={{background:'#E1F5EE',borderRadius:'12px',padding:'1rem',marginBottom:'1rem',border:'1px solid #bbf0d9'}}>
            <p style={{fontSize:'12px',fontWeight:'700',color:'#085041',marginBottom:'6px'}}>✅ WHAT WE IMPROVED</p>
            <p style={{fontSize:'13px',color:'#333',lineHeight:'1.8',whiteSpace:'pre-wrap'}}>{outputs.improvements}</p>
          </div>

          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{fontSize:'12px',padding:'5px 12px',borderRadius:'20px',border:'1px solid',
                  borderColor: activeTab === t.key ? '#1D9E75' : '#ddd',
                  background: activeTab === t.key ? '#E1F5EE' : '#fff',
                  color: activeTab === t.key ? '#085041' : '#666',cursor:'pointer'}}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{background:'#f9fafb',borderRadius:'12px',padding:'1.25rem',position:'relative',marginBottom:'1rem'}}>
            <button onClick={() => navigator.clipboard.writeText(outputs[activeTab] || '')}
              style={{position:'absolute',top:'12px',right:'12px',fontSize:'11px',padding:'4px 10px',borderRadius:'20px',background:'#fff',border:'1px solid #ddd',cursor:'pointer'}}>
              Copy
            </button>
            <p style={{fontSize:'13px',lineHeight:'1.8',whiteSpace:'pre-wrap',color:'#333',marginTop:'8px'}}>
              {outputs[activeTab] || ''}
            </p>
          </div>

          {/* FEED INTO ECOSYSTEM */}
          <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem'}}>
            <p style={{fontSize:'13px',fontWeight:'600',marginBottom:'12px',color:'#333'}}>🚀 Do more with this listing:</p>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'#1D9E75',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                Generate Full Marketing Kit →
              </a>
              <button onClick={() => { setListing(outputs.standard); setOutputs(null); window.scrollTo(0,0) }}
                style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',cursor:'pointer'}}>
                Rewrite Again in Different Style
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}