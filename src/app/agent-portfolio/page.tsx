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
  const [highlightsCount, setHighlightsCount] = useState(0)
  const [listingsCount, setListingsCount] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan, portfolio_slug').eq('id', user.id).single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.portfolio_slug) {
          setSlug(profile.portfolio_slug)
          setCurrentSlug(profile.portfolio_slug)
        }
      } else { setPlanLoaded(true) }
      const { count: hCount } = await supabase
        .from('career_highlights').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setHighlightsCount(hCount || 0)
      const { count: lCount } = await supabase
        .from('listings').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      setListingsCount(lCount || 0)
    }
    getUser()
  }, [])

  const checkAvailability = async (value: string) => {
    if (!value || value === currentSlug) { setAvailable(null); return }
    setChecking(true)
    const { data } = await supabase.from('profiles').select('id').eq('portfolio_slug', value).single()
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

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem'
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '13px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  if (planLoaded && plan !== 'pro') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Pro Feature</h1>
          <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem', lineHeight: '1.7' }}>The Agent Portfolio is a Pro-only feature. Upgrade to create your shareable portfolio page.</p>
          <a href="/pricing" style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(29,158,117,0.3)', marginBottom: '12px' }}>
            Upgrade to Pro — $20/mo
          </a>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '580px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(139,92,246,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>AGENT PORTFOLIO</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Your shareable listing portfolio.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>One link to share with sellers — showcasing your listings, highlights, and brand in a clean professional page.</p>
          <button onClick={() => document.getElementById('portfolio-url-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Set Up Your URL →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '🔗', title: 'Choose your URL', desc: 'Pick a unique portfolio link under listingwhisperer.com/portfolio/yourname.' },
              { s: '2', icon: '✦', title: 'Your content auto-populates', desc: 'Listings and career highlights pull directly from your account.' },
              { s: '3', icon: '📤', title: 'Share with sellers', desc: 'Send the link to any prospect and let your track record speak for itself.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '👤', label: 'Your Agent Profile', desc: 'Name, brokerage, phone, and website pulled from Settings.' },
              { icon: '🏠', label: 'Your Listings', desc: 'All your MLS listings showcased with descriptions and details.' },
              { icon: '⭐', label: 'Career Highlights', desc: 'Your favorite closings, photos, and memories — on display.' },
              { icon: '🔗', label: 'Shareable Link', desc: 'A clean URL you can text, email, or add to your bio.' },
              { icon: '✦', label: 'Powered by ListingWhisperer', desc: 'Drives organic referrals — sellers find you through your page.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* URL SETUP */}
        <div id="portfolio-url-section" style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', margin: '0 0 16px' }}>YOUR PORTFOLIO URL</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Choose your URL</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--lw-text-muted)', whiteSpace: 'nowrap' }}>listingwhisperer.com/portfolio/</span>
              <input
                placeholder="yourname"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <div style={{ marginTop: '6px', height: '16px' }}>
              {checking && <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: 0 }}>Checking availability...</p>}
              {!checking && available === true && slug && <p style={{ fontSize: '11px', color: '#1D9E75', margin: 0, fontWeight: '600' }}>✓ Available!</p>}
              {!checking && available === false && <p style={{ fontSize: '11px', color: '#ef4444', margin: 0, fontWeight: '600' }}>✗ Already taken — try another</p>}
              {!checking && slug && slug === currentSlug && <p style={{ fontSize: '11px', color: '#1D9E75', margin: 0, fontWeight: '600' }}>✓ Your current URL</p>}
            </div>
          </div>

          <button onClick={save} disabled={saving || available === false}
            style={{ width: '100%', padding: '13px', background: saving ? '#6366f1' : 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(139,92,246,0.3)', transition: 'all 0.2s', marginBottom: '12px', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Portfolio URL'}
          </button>

          {currentSlug && (
            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: '600', margin: 0 }}>🔗 {portfolioUrl}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { navigator.clipboard.writeText(`https://${portfolioUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)', fontSize: '12px', cursor: 'pointer', background: copied ? '#8b5cf6' : 'rgba(139,92,246,0.1)', color: copied ? '#fff' : '#8b5cf6', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <a href={`/portfolio/${currentSlug}`} target="_blank"
                  style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--lw-border)', fontSize: '12px', textDecoration: 'none', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', fontWeight: '500' }}>
                  👁 Preview
                </a>
              </div>
            </div>
          )}
        </div>

        {/* INFO */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', margin: '0 0 12px' }}>WHAT'S ON YOUR PORTFOLIO</p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1D9E75', margin: '0', letterSpacing: '-0.03em' }}>{listingsCount}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '4px 0 0' }}>Listings</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b', margin: '0', letterSpacing: '-0.03em' }}>{highlightsCount}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '4px 0 0' }}>Career Highlights</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '👤', text: 'Your name, brokerage, phone and website from Settings' },
              { icon: '🏠', text: `${listingsCount} listing${listingsCount !== 1 ? 's' : ''} with MLS descriptions` },
              { icon: '⭐', text: `${highlightsCount} career highlight${highlightsCount !== 1 ? 's' : ''} with photos and memories` },
              { icon: '🔗', text: 'A clean shareable link you can send to any seller' },
              { icon: '✦', text: '"Powered by ListingWhisperer" — drives referrals for you' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0, fontWeight: '500' }}>{item.text}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '10px 14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0 }}>💡 Keep your <a href="/settings" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: '600' }}>Settings</a> updated — your portfolio pulls from your brand voice profile.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}
