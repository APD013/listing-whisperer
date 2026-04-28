'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PortfolioSetupPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [slug, setSlug] = useState('')
  const [currentSlug, setCurrentSlug] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, portfolio_slug')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.portfolio_slug) {
          setSlug(profile.portfolio_slug)
          setCurrentSlug(profile.portfolio_slug)
        }
      } else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const checkAvailability = async (value: string) => {
    if (!value || value === currentSlug) { setAvailable(null); return }
    setChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('portfolio_slug', value)
      .single()
    setAvailable(!data)
    setChecking(false)
  }

  const handleSlugChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
    setSlug(clean)
    setAvailable(null)
    setSaved(false)
    const timeout = setTimeout(() => checkAvailability(clean), 600)
    return () => clearTimeout(timeout)
  }

  const save = async () => {
    if (!slug) { alert('Please enter a portfolio URL'); return }
    if (available === false) { alert('That URL is taken. Please choose another.'); return }
    setSaving(true)
    await supabase.from('profiles').update({ portfolio_slug: slug }).eq('id', userId)
    setCurrentSlug(slug)
    setSaving(false)
    setSaved(true)
  }

  const portfolioUrl = `listingwhisperer.com/portfolio/${slug}`

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }
  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }

  if (planLoaded && plan !== 'pro') {
    return (
      <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif",display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <div style={{maxWidth:'420px',width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔒</div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Pro Feature</h1>
          <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem',lineHeight:'1.7'}}>The Agent Portfolio is a Pro-only feature. Upgrade to create your shareable portfolio page.</p>
          <a href="/pricing" style={{display:'block',padding:'14px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'700',boxShadow:'0 0 24px rgba(29,158,117,0.3)',marginBottom:'12px'}}>
            Upgrade to Pro — $20/mo
          </a>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </main>
    )
  }

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

      <div style={{maxWidth:'580px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>🏆 Agent Portfolio</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Create your shareable portfolio page. Send it to potential clients to showcase your listings and brand.
          </p>
        </div>

        {/* URL SETUP */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>YOUR PORTFOLIO URL</p>

          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>
              Choose your URL
            </label>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'13px',color:'#6b7280',whiteSpace:'nowrap'}}>listingwhisperer.com/portfolio/</span>
              <input
                placeholder="yourname"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                style={{...inputStyle, flex:1}}
              />
            </div>
            <div style={{marginTop:'6px',height:'16px'}}>
              {checking && <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Checking availability...</p>}
              {!checking && available === true && slug && <p style={{fontSize:'11px',color:'#1D9E75',margin:'0'}}>✓ Available!</p>}
              {!checking && available === false && <p style={{fontSize:'11px',color:'#f87171',margin:'0'}}>✗ Already taken — try another</p>}
              {!checking && slug && slug === currentSlug && <p style={{fontSize:'11px',color:'#1D9E75',margin:'0'}}>✓ Your current URL</p>}
            </div>
          </div>

          <button onClick={save} disabled={saving || available === false}
            style={{width:'100%',padding:'13px',background: saving ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: saving ? 'not-allowed' : 'pointer',boxShadow:'0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s',marginBottom:'12px'}}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Portfolio URL'}
          </button>

          {currentSlug && (
            <div style={{background:'rgba(29,158,117,0.06)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'10px',padding:'12px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
              <p style={{fontSize:'13px',color:'#1D9E75',fontWeight:'600',margin:'0'}}>🔗 {portfolioUrl}</p>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={() => { navigator.clipboard.writeText(`https://${portfolioUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid rgba(29,158,117,0.3)',fontSize:'12px',cursor:'pointer',background: copied ? '#1D9E75' : 'rgba(29,158,117,0.1)',color: copied ? '#fff' : '#1D9E75',fontWeight:'600'}}>
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <a href={`/portfolio/${currentSlug}`} target="_blank"
                  style={{padding:'6px 14px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.08)',fontSize:'12px',textDecoration:'none',background:'rgba(0,0,0,0.2)',color:'#6b7280',fontWeight:'500'}}>
                  👁 Preview
                </a>
              </div>
            </div>
          )}
        </div>

        {/* INFO */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>WHAT'S ON YOUR PORTFOLIO</p>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {[
              { icon:'👤', text:'Your name, brokerage, phone and website from Settings' },
              { icon:'🏠', text:'All your past listings with MLS descriptions' },
              { icon:'📊', text:'Your listing count and specialty' },
              { icon:'🔗', text:'A clean shareable link you can send to any seller' },
              { icon:'✦', text:'"Powered by ListingWhisperer" — drives referrals for you' },
            ].map((item, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'16px'}}>{item.icon}</span>
                <p style={{fontSize:'13px',color:'#8b8fa8',margin:'0'}}>{item.text}</p>
              </div>
            ))}
          </div>
          <div style={{marginTop:'1rem',padding:'10px 14px',background:'rgba(255,204,0,0.06)',border:'1px solid rgba(255,204,0,0.15)',borderRadius:'8px'}}>
            <p style={{fontSize:'12px',color:'#a08040',margin:'0'}}>💡 Keep your <a href="/settings" style={{color:'#1D9E75',textDecoration:'none',fontWeight:'600'}}>Settings</a> updated — your portfolio pulls from your brand voice profile.</p>
          </div>
        </div>

        <div style={{textAlign:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}