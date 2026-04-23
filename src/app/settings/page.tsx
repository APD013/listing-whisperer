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
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [brandVoice, setBrandVoice] = useState({
    agentName: '',
    brokerage: '',
    phone: '',
    website: '',
    preferredTone: 'Warm & inviting',
    targetBuyers: '',
    uniqueStyle: '',
    ctaStyle: '',
    avoidWords: '',
  })
  const [language, setLanguage] = useState('English')
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice, preferred_language, marketing_emails')
        .eq('id', user.id)
        .single()

      if (profile) {
        setPlan(profile.plan || 'starter')
        setLanguage(profile.preferred_language || 'English')
        setMarketingEmails(profile.marketing_emails || false)
        if (profile.brand_voice) {
          try {
            setBrandVoice(JSON.parse(profile.brand_voice))
          } catch(e) {}
        }
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

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>
      {/* NAV */}
      <div style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>
  Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
  {plan === 'pro' && (
    <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>
      PRO
    </span>
  )}
</div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← Dashboard</a>
          <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'2rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'600',marginBottom:'0.5rem'}}>⚙️ Settings</h1>
        <p style={{fontSize:'13px',color:'#666',marginBottom:'2rem'}}>Save your brand voice so every listing feels like you.</p>

        {/* BRAND VOICE */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize:'1rem',fontWeight:'600',marginBottom:'0.25rem'}}>🎙️ Your Brand Voice</h2>
          <p style={{fontSize:'13px',color:'#666',marginBottom:'1.25rem'}}>This information will be used to personalize your generated copy.</p>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Your name</label>
              <input placeholder="Jane Smith" value={brandVoice.agentName} onChange={e=>setBrandVoice({...brandVoice,agentName:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Brokerage</label>
              <input placeholder="Keller Williams, Compass..." value={brandVoice.brokerage} onChange={e=>setBrandVoice({...brandVoice,brokerage:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Phone number</label>
              <input placeholder="(714) 555-0123" value={brandVoice.phone} onChange={e=>setBrandVoice({...brandVoice,phone:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Website</label>
              <input placeholder="www.janesmith.com" value={brandVoice.website} onChange={e=>setBrandVoice({...brandVoice,website:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Preferred tone</label>
            <select value={brandVoice.preferredTone} onChange={e=>setBrandVoice({...brandVoice,preferredTone:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
              <option>Warm & inviting</option>
              <option>Luxury & aspirational</option>
              <option>Modern & minimal</option>
              <option>Family-friendly</option>
              <option>Investment-focused</option>
            </select>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Who do you typically sell to?</label>
            <input placeholder="Move-up families in Orange County, luxury buyers, first-time buyers..." value={brandVoice.targetBuyers} onChange={e=>setBrandVoice({...brandVoice,targetBuyers:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Your writing style (optional)</label>
            <textarea placeholder="e.g. I like short sentences, emotional storytelling, and always mention lifestyle benefits..." value={brandVoice.uniqueStyle} onChange={e=>setBrandVoice({...brandVoice,uniqueStyle:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',minHeight:'80px',resize:'vertical',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Your preferred CTA style</label>
            <input placeholder="e.g. Call me today, DM for details, Schedule a private tour..." value={brandVoice.ctaStyle} onChange={e=>setBrandVoice({...brandVoice,ctaStyle:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Output Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
              <option>English</option>
              <option>Spanish</option>
              <option>Mandarin Chinese</option>
              <option>Polish</option>
              <option>French</option>
              <option>Vietnamese</option>
              <option>Korean</option>
              <option>Arabic</option>
            </select>
            <p style={{fontSize:'11px',color:'#999',marginTop:'4px'}}>All generated copy will be in this language</p>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Words to avoid (optional)</label>
            <input placeholder="e.g. cozy, charming, cute, motivated seller..." value={brandVoice.avoidWords} onChange={e=>setBrandVoice({...brandVoice,avoidWords:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          {/* EMAIL PREFERENCES */}
          <div style={{marginBottom:'20px',paddingTop:'8px',borderTop:'1px solid #eee'}}>
            <p style={{fontSize:'14px',fontWeight:'600',color:'#333',marginBottom:'12px'}}>📧 Email Preferences</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8fafc',borderRadius:'10px',padding:'12px 16px',border:'1px solid #eee'}}>
              <div>
                <p style={{fontSize:'13px',fontWeight:'500',color:'#333',margin:'0 0 2px'}}>Product updates & new features</p>
                <p style={{fontSize:'12px',color:'#999',margin:'0'}}>Get notified when we launch new tools and improvements</p>
              </div>
              <div onClick={() => setMarketingEmails(!marketingEmails)}
                style={{width:'44px',height:'24px',borderRadius:'12px',background: marketingEmails ? '#1D9E75' : '#ddd',cursor:'pointer',position:'relative',transition:'all 0.2s',flexShrink:0,marginLeft:'12px'}}>
                <div style={{width:'20px',height:'20px',borderRadius:'50%',background:'#fff',position:'absolute',top:'2px',left: marketingEmails ? '22px' : '2px',transition:'all 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}></div>
              </div>
            </div>
            <p style={{fontSize:'11px',color:'#999',marginTop:'8px'}}>We never share your email. Unsubscribe anytime from any email we send.</p>
          </div>

          <button onClick={save} disabled={saving}
            style={{width:'100%',padding:'13px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save Brand Voice'}
          </button>
        </div>

        {/* ACCOUNT INFO */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <h2 style={{fontSize:'1rem',fontWeight:'600',marginBottom:'1rem'}}>👤 Account</h2>
          <p style={{fontSize:'13px',color:'#666',marginBottom:'4px'}}>Email: <strong>{userEmail}</strong></p>
          <p style={{fontSize:'13px',color:'#666',marginBottom:'1rem'}}>Plan: <strong style={{color:'#1D9E75'}}>{plan === 'pro' ? '⚡ Pro' : '🆓 Free'}</strong></p>
          {plan === 'starter' && (
            <a href="/pricing" style={{display:'inline-block',background:'#1D9E75',color:'#fff',padding:'10px 24px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',fontSize:'14px'}}>
              Upgrade to Pro — $29/mo
            </a>
          )}
        </div>
      </div>
    </main>
  )
}