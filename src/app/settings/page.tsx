'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [language, setLanguage] = useState('English')
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [brandVoice, setBrandVoice] = useState({
    agentName: '', brokerage: '', phone: '', website: '',
    preferredTone: 'Warm & inviting', targetBuyers: '',
    uniqueStyle: '', ctaStyle: '', avoidWords: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice, preferred_language, marketing_emails')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setLanguage(profile.preferred_language || 'English')
        setMarketingEmails(profile.marketing_emails || false)
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try { setBrandVoice(JSON.parse(profile.brand_voice)) } catch(e) {}
        }
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase
      .from('profiles')
      .update({
        brand_voice: JSON.stringify(brandVoice),
        preferred_language: language,
        marketing_emails: marketingEmails
      })
      .eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }

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
          <a href="/" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'680px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>⚙️ Settings</h1>
          <p style={{fontSize:'14px',color:'#6b7280'}}>Customize your brand voice and preferences — saved to every listing you generate.</p>
        </div>

        {/* PLAN STATUS */}
        <div style={{...cardStyle, border: plan === 'pro' ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.07)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',letterSpacing:'1px',margin:'0 0 4px'}}>CURRENT PLAN</p>
              <p style={{fontSize:'16px',fontWeight:'700',color: plan === 'pro' ? '#1D9E75' : '#f0f0f0',margin:'0'}}>
                {plan === 'pro' ? '✦ Pro Workspace' : 'Free Plan'}
              </p>
            </div>
            {plan === 'starter' && (
              <a href="/pricing" style={{padding:'8px 16px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'8px',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
                Upgrade to Pro
              </a>
            )}
            {plan === 'pro' && (
              <span style={{background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'20px',boxShadow:'0 0 12px rgba(29,158,117,0.3)'}}>PRO</span>
            )}
          </div>
        </div>

        {/* BRAND VOICE */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'6px'}}>YOUR BRAND VOICE</p>
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'16px',paddingBottom:'16px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            These details are automatically applied to every listing you generate — so every piece of copy sounds like you.
          </p>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input placeholder="Jane Smith" value={brandVoice.agentName} onChange={e=>setBrandVoice({...brandVoice,agentName:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Brokerage</label>
              <input placeholder="Compass, KW, eXp..." value={brandVoice.brokerage} onChange={e=>setBrandVoice({...brandVoice,brokerage:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input placeholder="(714) 555-0100" value={brandVoice.phone} onChange={e=>setBrandVoice({...brandVoice,phone:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input placeholder="yoursite.com" value={brandVoice.website} onChange={e=>setBrandVoice({...brandVoice,website:e.target.value})} style={inputStyle}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Preferred Tone</label>
            <select value={brandVoice.preferredTone} onChange={e=>setBrandVoice({...brandVoice,preferredTone:e.target.value})} style={inputStyle}>
              <option>Warm & inviting</option><option>Luxury & aspirational</option><option>Modern & minimal</option>
              <option>Professional</option><option>Family-friendly</option><option>Investment-focused</option>
            </select>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Target Buyers <span style={{color:'#444',fontWeight:'400',textTransform:'none'}}>— who do you usually sell to?</span></label>
            <input placeholder="Move-up families, luxury buyers, investors..." value={brandVoice.targetBuyers} onChange={e=>setBrandVoice({...brandVoice,targetBuyers:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Your Writing Style <span style={{color:'#444',fontWeight:'400',textTransform:'none'}}>— how do you like to sound?</span></label>
            <input placeholder="Conversational, storytelling, data-driven, aspirational..." value={brandVoice.uniqueStyle} onChange={e=>setBrandVoice({...brandVoice,uniqueStyle:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>CTA Style <span style={{color:'#444',fontWeight:'400',textTransform:'none'}}>— how do you close?</span></label>
            <input placeholder="e.g. Call me today, DM for details, Schedule a private tour..." value={brandVoice.ctaStyle} onChange={e=>setBrandVoice({...brandVoice,ctaStyle:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Words to Avoid (optional)</label>
            <input placeholder="e.g. cozy, charming, unique, nestled..." value={brandVoice.avoidWords} onChange={e=>setBrandVoice({...brandVoice,avoidWords:e.target.value})} style={inputStyle}/>
          </div>
        </div>

        {/* LANGUAGE */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'6px'}}>OUTPUT LANGUAGE</p>
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'12px'}}>All generated copy will be written in this language.</p>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
            <option>English</option><option>Spanish</option><option>Mandarin Chinese</option>
            <option>Polish</option><option>French</option><option>Vietnamese</option>
            <option>Korean</option><option>Arabic</option>
          </select>
        </div>

        {/* EMAIL PREFERENCES */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'6px'}}>EMAIL PREFERENCES</p>
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'16px'}}>We never share your email. Unsubscribe anytime.</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.2)',borderRadius:'10px',padding:'14px 16px',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div>
              <p style={{fontSize:'13px',fontWeight:'500',color:'#f0f0f0',margin:'0 0 2px'}}>Product updates & new features</p>
              <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>Get notified when we launch new tools</p>
            </div>
            <div onClick={() => setMarketingEmails(!marketingEmails)}
              style={{width:'44px',height:'24px',borderRadius:'12px',background: marketingEmails ? '#1D9E75' : 'rgba(255,255,255,0.1)',cursor:'pointer',position:'relative',transition:'all 0.2s',flexShrink:0,marginLeft:'12px',boxShadow: marketingEmails ? '0 0 12px rgba(29,158,117,0.4)' : 'none'}}>
              <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'2px',left: marketingEmails ? '22px' : '2px',transition:'all 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}></div>
            </div>
          </div>
        </div>

        {/* SAVE */}
        <button onClick={save} disabled={saving}
          style={{width:'100%',padding:'14px',background: saving ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: saving ? 'not-allowed' : 'pointer',boxShadow: saving ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s',marginBottom:'1rem'}}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>

        <div style={{textAlign:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}