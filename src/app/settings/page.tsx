'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const [googleToast, setGoogleToast] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [language, setLanguage] = useState('English')
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [brandVoice, setBrandVoice] = useState({
    agentName: '', brokerage: '', phone: '', website: '',
    preferredTone: 'Warm & inviting', targetBuyers: '',
    uniqueStyle: '', ctaStyle: '', avoidWords: '', state: '',
  })

  useEffect(() => {
    const googleParam = searchParams.get('google')
    if (googleParam === 'connected') {
      setGoogleToast('Google Calendar connected ✅')
      setTimeout(() => setGoogleToast(null), 4000)
    } else if (googleParam === 'error') {
      setGoogleToast('Failed to connect Google Calendar')
      setTimeout(() => setGoogleToast(null), 4000)
    }
  }, [searchParams])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice, preferred_language, marketing_emails, google_connected')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setLanguage(profile.preferred_language || 'English')
        setMarketingEmails(profile.marketing_emails || false)
        setGoogleConnected(profile.google_connected || false)
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

  const disconnectGoogle = async () => {
    if (!userId) return
    setDisconnecting(true)
    await supabase
      .from('profiles')
      .update({ google_connected: false, google_refresh_token: null })
      .eq('id', userId)
    setGoogleConnected(false)
    setDisconnecting(false)
  }

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

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '600' as const, color: 'var(--lw-text-muted)',
    display: 'block' as const, marginBottom: '6px'
  }

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem'
  }

  const sectionLabel = {
    fontSize: '11px', fontWeight: '700' as const, color: '#1D9E75',
    letterSpacing: '1px', margin: '0 0 4px 0'
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {googleToast && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', background: googleToast.startsWith('Failed') ? '#ef4444' : '#1D9E75', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {googleToast}
        </div>
      )}

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>Sign out</a>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
            Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
            {planLoaded && plan === 'pro' && (
              <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(99,102,241,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>SETTINGS</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Your brand voice, your way.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Customize how the AI writes for you — saved across every tool, every listing, every time.</p>
          <button onClick={() => document.getElementById('brand-voice-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Update Settings →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '👤', title: 'Set your brand voice', desc: 'Enter your name, brokerage, tone, and writing style.' },
              { s: '2', icon: '🤖', title: 'AI learns your style', desc: 'Every listing and copy tool uses your preferences automatically.' },
              { s: '3', icon: '✨', title: 'Every output is yours', desc: 'Copy that sounds like you — not like a generic AI.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PLAN STATUS */}
        <div style={{ ...cardStyle, border: plan === 'pro' ? '1px solid rgba(29,158,117,0.25)' : '1px solid var(--lw-border)', boxShadow: plan === 'pro' ? '0 4px 20px rgba(29,158,117,0.08)' : '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={sectionLabel}>CURRENT PLAN</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: plan === 'pro' ? '#1D9E75' : 'var(--lw-text)', margin: '4px 0 0' }}>
                {plan === 'pro' ? '✦ Pro Workspace' : 'Free Plan'}
              </p>
            </div>
            {plan === 'starter' && (
              <a href="/pricing" style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
                Upgrade to Pro
              </a>
            )}
            {plan === 'pro' && (
              <span style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px' }}>PRO</span>
            )}
          </div>
        </div>

        {/* BRAND VOICE */}
        <div id="brand-voice-section" style={cardStyle}>
          <p style={sectionLabel}>YOUR BRAND VOICE</p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '4px 0 16px', paddingBottom: '16px', borderBottom: '1px solid var(--lw-border)', lineHeight: '1.6' }}>
            These details are automatically applied to every listing you generate — so every piece of copy sounds like you.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input placeholder="Jane Smith" value={brandVoice.agentName} onChange={e => setBrandVoice({ ...brandVoice, agentName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Brokerage</label>
              <input placeholder="Compass, KW, eXp..." value={brandVoice.brokerage} onChange={e => setBrandVoice({ ...brandVoice, brokerage: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input placeholder="(714) 555-0100" value={brandVoice.phone} onChange={e => setBrandVoice({ ...brandVoice, phone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input placeholder="yoursite.com" value={brandVoice.website} onChange={e => setBrandVoice({ ...brandVoice, website: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Your State <span style={{ color: 'var(--lw-text-muted)', fontWeight: '400' }}>— used for Call Capture recording compliance</span></label>
              <select value={brandVoice.state} onChange={e => setBrandVoice({ ...brandVoice, state: e.target.value })} style={inputStyle}>
                <option value="">Select your state...</option>
                <option>Alabama</option><option>Alaska</option><option>Arizona</option><option>Arkansas</option>
                <option>California</option><option>Colorado</option><option>Connecticut</option><option>Delaware</option>
                <option>Florida</option><option>Georgia</option><option>Hawaii</option><option>Idaho</option>
                <option>Illinois</option><option>Indiana</option><option>Iowa</option><option>Kansas</option>
                <option>Kentucky</option><option>Louisiana</option><option>Maine</option><option>Maryland</option>
                <option>Massachusetts</option><option>Michigan</option><option>Minnesota</option><option>Mississippi</option>
                <option>Missouri</option><option>Montana</option><option>Nebraska</option><option>Nevada</option>
                <option>New Hampshire</option><option>New Jersey</option><option>New Mexico</option><option>New York</option>
                <option>North Carolina</option><option>North Dakota</option><option>Ohio</option><option>Oklahoma</option>
                <option>Oregon</option><option>Pennsylvania</option><option>Rhode Island</option><option>South Carolina</option>
                <option>South Dakota</option><option>Tennessee</option><option>Texas</option><option>Utah</option>
                <option>Vermont</option><option>Virginia</option><option>Washington</option><option>West Virginia</option>
                <option>Wisconsin</option><option>Wyoming</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Preferred Tone</label>
            <select value={brandVoice.preferredTone} onChange={e => setBrandVoice({ ...brandVoice, preferredTone: e.target.value })} style={inputStyle}>
              <option>Warm & inviting</option>
              <option>Luxury & aspirational</option>
              <option>Modern & minimal</option>
              <option>Professional</option>
              <option>Family-friendly</option>
              <option>Investment-focused</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Target Buyers <span style={{ color: 'var(--lw-text-muted)', fontWeight: '400' }}>— who do you usually sell to?</span></label>
            <input placeholder="Move-up families, luxury buyers, investors..." value={brandVoice.targetBuyers} onChange={e => setBrandVoice({ ...brandVoice, targetBuyers: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Your Writing Style <span style={{ color: 'var(--lw-text-muted)', fontWeight: '400' }}>— how do you like to sound?</span></label>
            <input placeholder="Conversational, storytelling, data-driven, aspirational..." value={brandVoice.uniqueStyle} onChange={e => setBrandVoice({ ...brandVoice, uniqueStyle: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>CTA Style <span style={{ color: 'var(--lw-text-muted)', fontWeight: '400' }}>— how do you close?</span></label>
            <input placeholder="e.g. Call me today, DM for details, Schedule a private tour..." value={brandVoice.ctaStyle} onChange={e => setBrandVoice({ ...brandVoice, ctaStyle: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Words to Avoid <span style={{ color: 'var(--lw-text-muted)', fontWeight: '400' }}>(optional)</span></label>
            <input placeholder="e.g. cozy, charming, unique, nestled..." value={brandVoice.avoidWords} onChange={e => setBrandVoice({ ...brandVoice, avoidWords: e.target.value })} style={inputStyle} />
          </div>
        </div>

        {/* LANGUAGE */}
        <div style={cardStyle}>
          <p style={sectionLabel}>OUTPUT LANGUAGE</p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '4px 0 14px', lineHeight: '1.6' }}>All generated copy will be written in this language.</p>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
            <option>English</option>
            <option>Spanish</option>
            <option>Mandarin Chinese</option>
            <option>Polish</option>
            <option>French</option>
            <option>Vietnamese</option>
            <option>Korean</option>
            <option>Arabic</option>
          </select>
        </div>

        {/* VOICE SETTINGS */}
        <div style={cardStyle}>
          <p style={sectionLabel}>🎤 VOICE & AI CHAT</p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '4px 0 14px', lineHeight: '1.6' }}>Voice input is available on all pages via the AI chat widget. Speak your request and the AI will respond.</p>
          <div style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: '12px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0 0 6px' }}>💡 For best voice quality</p>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0, lineHeight: '1.7' }}>
              Voice input works on all browsers. For the most natural AI voice responses, use <strong style={{ color: 'var(--lw-text)' }}>Safari on Mac or iPhone</strong> — it has significantly better text-to-speech quality than Chrome.
            </p>
          </div>
        </div>

        {/* EMAIL PREFERENCES */}
        <div style={cardStyle}>
          <p style={sectionLabel}>EMAIL PREFERENCES</p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '4px 0 16px', lineHeight: '1.6' }}>We never share your email. Unsubscribe anytime.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--lw-input)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--lw-border)' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 2px' }}>Product updates & new features</p>
              <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0 }}>Get notified when we launch new tools</p>
            </div>
            <div onClick={() => setMarketingEmails(!marketingEmails)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', background: marketingEmails ? '#1D9E75' : 'rgba(0,0,0,0.15)', cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0, marginLeft: '16px', border: '1px solid var(--lw-border)' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '1px', left: marketingEmails ? '21px' : '1px', transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
        </div>

        {/* GOOGLE CALENDAR */}
        <div style={cardStyle}>
          <p style={sectionLabel}>📅 GOOGLE CALENDAR</p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '4px 0 16px', lineHeight: '1.6' }}>
            Connect your Google Calendar to add reminders directly from Listing Whisperer.
          </p>
          {googleConnected ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1D9E75', margin: '0 0 2px' }}>Google Calendar Connected</p>
                  <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0 }}>You can now add reminders directly to your calendar.</p>
                </div>
              </div>
              <button
                onClick={disconnectGoogle}
                disabled={disconnecting}
                style={{ padding: '8px 16px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: disconnecting ? 'not-allowed' : 'pointer', flexShrink: 0, marginLeft: '12px', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 2px' }}>Not connected</p>
                <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0 }}>Connect to sync reminders to your Google Calendar.</p>
              </div>
              {userId && (
                <a
                  href={`/api/auth/google?userId=${userId}`}
                  style={{ padding: '10px 20px', background: '#4285f4', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(66,133,244,0.3)' }}>
                  Connect Google Calendar
                </a>
              )}
            </div>
          )}
        </div>

        {/* SAVE */}
        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '14px', background: saved ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 20px rgba(99,102,241,0.3)', transition: 'all 0.2s', marginBottom: '1rem', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.01em' }}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Settings'}
        </button>

        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}
