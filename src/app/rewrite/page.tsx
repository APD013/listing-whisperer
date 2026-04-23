'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackRewriteUsed, trackUpgradeClick, trackEvent } from '../lib/analytics'

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
  const [planLoaded, setPlanLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      trackEvent('rewrite_page_view')
      const { data: profile } = await supabase
        .from('profiles')
        .select('rewrites_used, plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setRewritesUsed(profile.rewrites_used || 0)
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
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
      if (data.error === 'REWRITE_LIMIT_REACHED') { router.push('/pricing'); return }
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('standard')
        setRewritesUsed(prev => prev + 1)
        trackRewriteUsed(plan)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const tabs = [
    { key: 'standard', label: 'Standard MLS', icon: '🏠' },
    { key: 'luxury', label: 'Luxury', icon: '✨' },
    { key: 'short', label: 'Short Version', icon: '⚡' },
    { key: 'social', label: 'Instagram', icon: '📸' },
    { key: 'headline', label: 'Headlines', icon: '📣' },
    { key: 'improvements', label: 'What Changed', icon: '✅' },
  ]

  const styles_list = ['Professional and compelling','Luxury and aspirational','Warm and inviting','Modern and minimal','Family-friendly','Investment-focused','High urgency']

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>
      
      {/* BACKGROUND GLOW */}
      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
          {plan === 'starter' && (
            <span style={{fontSize:'12px',color:'#6b7280'}}>
              {3 - rewritesUsed} rewrites left
            </span>
          )}
          <a href="/" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'740px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>✨ Listing Rewriter</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Turn dull MLS copy into polished, buyer-ready marketing in seconds. Paste your current listing — we'll make it shine.
          </p>
        </div>

        {/* BEFORE/AFTER EXAMPLE */}
        <div style={{marginBottom:'1.5rem'}}>
          <button onClick={() => setShowExample(!showExample)}
            style={{fontSize:'13px',color:'#1D9E75',background:'none',border:'none',cursor:'pointer',padding:'0',fontWeight:'500'}}>
            {showExample ? '▲ Hide example' : '▼ See a before/after example'}
          </button>
          {showExample && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1rem'}}>
              <div style={{background:'rgba(255,248,240,0.05)',border:'1px solid rgba(253,232,200,0.2)',borderRadius:'12px',padding:'1.25rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',marginBottom:'8px',letterSpacing:'1px'}}>BEFORE — BORING</p>
                <p style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'1.8',fontStyle:'italic'}}>
                  "3 bed 2 bath home in Newport Beach. Has a kitchen and living room. Good size backyard. Close to schools. $899,000."
                </p>
              </div>
              <div style={{background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'12px',padding:'1.25rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'8px',letterSpacing:'1px'}}>AFTER — POLISHED</p>
                <p style={{fontSize:'13px',color:'#e0e0e0',lineHeight:'1.8'}}>
                  "Welcome to this beautifully appointed 3-bedroom coastal retreat in the heart of Newport Beach..."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>PASTE YOUR LISTING</p>
          <textarea
            placeholder="Paste your current MLS description here... even if it's boring or basic, we'll make it shine."
            value={listing}
            onChange={e => setListing(e.target.value)}
            style={{width:'100%',padding:'12px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'13px',color:'#f0f0f0',minHeight:'150px',resize:'vertical',boxSizing:'border-box',outline:'none'}}
          />
        </div>

        {/* STYLE */}
        <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>REWRITE STYLE</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {styles_list.map(s => (
              <button key={s} onClick={() => setStyle(s)}
                style={{padding:'6px 14px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',transition:'all 0.15s',
                  borderColor: style === s ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                  background: style === s ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                  color: style === s ? '#1D9E75' : '#6b7280',
                  boxShadow: style === s ? '0 0 12px rgba(29,158,117,0.2)' : 'none'}}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {plan === 'starter' && rewritesUsed >= 3 ? (
          <div style={{background:'rgba(255,204,0,0.08)',border:'1px solid rgba(255,204,0,0.2)',borderRadius:'12px',padding:'1.5rem',marginBottom:'1.5rem',textAlign:'center'}}>
            <p style={{fontWeight:'600',fontSize:'15px',margin:'0 0 8px',color:'#f0f0f0'}}>You've used all 3 free rewrites!</p>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 12px'}}>Upgrade to Pro for unlimited rewrites, full marketing kits, and saved listing history.</p>
            <a href="/pricing" onClick={() => trackUpgradeClick('rewrite_limit', plan)}
              style={{display:'inline-block',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',padding:'10px 24px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',fontSize:'14px',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
              Upgrade to Pro — $29/mo
            </a>
          </div>
        ) : (
          <button onClick={rewrite} disabled={loading}
            style={{width:'100%',padding:'14px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',marginBottom:'1.5rem',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
            {loading ? '⏳ Rewriting your listing...' : '✨ Make This Listing Shine'}
          </button>
        )}

        {outputs && (
          <div>
            {/* WHAT CHANGED */}
            <div style={{background:'rgba(29,158,117,0.08)',borderRadius:'12px',padding:'1rem',marginBottom:'1rem',border:'1px solid rgba(29,158,117,0.2)'}}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'6px',letterSpacing:'1px'}}>✅ WHAT WE IMPROVED</p>
              <p style={{fontSize:'13px',color:'#e0e0e0',lineHeight:'1.8',whiteSpace:'pre-wrap'}}>{outputs.improvements}</p>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{fontSize:'12px',padding:'6px 12px',borderRadius:'8px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                    borderColor: activeTab === t.key ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                    background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                    color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                    boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none',
                    fontWeight: activeTab === t.key ? '600' : '400'}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'12px',padding:'1.5rem',border:'1px solid rgba(255,255,255,0.07)',position:'relative',marginBottom:'1rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
              <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)',color: copied ? '#fff' : '#6b7280',border:'1px solid',borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)',cursor:'pointer',fontWeight:'500'}}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{fontSize:'14px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#e0e0e0',margin:'0',paddingRight:'90px'}}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'12px',padding:'1.25rem',border:'1px solid rgba(255,255,255,0.07)'}}>
              <p style={{fontSize:'12px',fontWeight:'600',color:'#6b7280',marginBottom:'12px',letterSpacing:'0.5px'}}>DO MORE WITH THIS LISTING</p>
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                  Generate Full Marketing Kit →
                </a>
                <button onClick={() => { setListing(outputs.standard); setOutputs(null); window.scrollTo(0,0) }}
                  style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                  Rewrite Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}