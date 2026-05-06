'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NeighborhoodBioPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [highlights, setHighlights] = useState('')
  const [tone, setTone] = useState('Professional')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'neighborhood_bio' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) setPlan(profile.plan || 'starter')
      setPlanLoaded(true)
    }
    getUser()
  }, [])

  const detectLocation = async () => {
    setLocating(true)
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || ''
          const cityName = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || ''
          if (suburb) setNeighborhood(suburb)
          if (cityName) setCity(`${cityName}, ${state}`)
          trackEvent('location_detected', { tool: 'neighborhood_bio' })
        } catch(e) {
          setLocationError('Could not detect neighborhood. Please enter manually.')
        }
        setLocating(false)
      },
      () => { setLocationError('Location access denied. Please enter neighborhood manually.'); setLocating(false) }
    )
  }

  const generate = async () => {
    if (!neighborhood.trim()) return
    setLoading(true)
    setOutput('')
    try {
      const prompt = `Write a compelling neighborhood bio for ${neighborhood}${city ? ` in ${city}` : ''}.
${highlights ? `\nAgent notes about this neighborhood: ${highlights}` : ''}
Tone: ${tone}
Write a professional neighborhood bio that includes:
- What makes this neighborhood unique and desirable
- Lifestyle and community feel
- Nearby amenities, schools, parks, dining, shopping
- Who this neighborhood is perfect for
- Real estate appeal and value proposition
Format it as 3-4 engaging paragraphs. Make it sound like it was written by a local expert.`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], currentPage: '/neighborhood-bio' })
      })
      const data = await res.json()
      setOutput(data.message || '')
      trackEvent('neighborhood_bio_generated', { neighborhood, tone })
    } catch(e) {
      setOutput('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent('output_copied', { tool: 'neighborhood_bio' })
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

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  if (!planLoaded) return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(29,158,117,0.3)', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <div style={{position:'fixed',top:'10%',right:'8%',width:'380px',height:'380px',background:'radial-gradient(circle, rgba(29,158,117,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'15%',left:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle' }}>PRO</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#1D9E75,#10b981)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(29,158,117,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>NEIGHBORHOOD BIO</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Write like a local. Win every listing.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Generate compelling neighborhood descriptions for listings, websites, and client emails — in seconds.</p>
          <button onClick={() => document.getElementById('neighborhood-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Generate My Bio →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '📍', title: 'Detect or enter your neighborhood', desc: 'Use GPS or type the neighborhood name manually.' },
              { s: '2', icon: '✍️', title: 'Add your local knowledge', desc: 'Share highlights, schools, parks, and what makes it special.' },
              { s: '3', icon: '🏘️', title: 'Get a polished bio', desc: 'Professional, ready-to-use description for any platform.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#1D9E75,#10b981)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM CARD */}
        <div id="neighborhood-form" style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

          {/* LOCATION BUTTON */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(29,158,117,0.06)', borderRadius: '12px', border: '1px solid rgba(29,158,117,0.15)' }}>
            <p style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700', margin: '0 0 6px', letterSpacing: '0.5px' }}>📍 AUTO-DETECT LOCATION</p>
            <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0 0 12px', lineHeight: '1.6' }}>Tap below while you're in the neighborhood — we'll detect it instantly.</p>
            <button onClick={detectLocation} disabled={locating}
              style={{ padding: '10px 20px', background: locating ? 'rgba(29,158,117,0.3)' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: locating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {locating ? '📍 Detecting...' : '📍 Detect My Location'}
            </button>
            {locationError && <p style={{ fontSize: '12px', color: '#ef4444', margin: '8px 0 0', fontWeight: '500' }}>{locationError}</p>}
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Neighborhood Name *</label>
            <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
              placeholder="e.g. Newport Heights, Balboa Island, Turtle Rock"
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>City / Area</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="e.g. Newport Beach, CA"
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Your Notes (optional)</label>
            <textarea value={highlights} onChange={e => setHighlights(e.target.value)}
              placeholder="e.g. Great schools, walking distance to beach, lots of young families..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          <div>
            <label style={labelStyle}>Tone</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Professional', 'Warm & Friendly', 'Luxury', 'Energetic'].map(t => (
                <button key={t} onClick={() => setTone(t)}
                  style={{
                    padding: '7px 16px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
                    borderColor: tone === t ? '#1D9E75' : 'var(--lw-border)',
                    background: tone === t ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)',
                    color: tone === t ? '#1D9E75' : 'var(--lw-text-muted)',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '🏘️', label: 'Neighborhood Bio', desc: '3-4 paragraphs written like a local expert.' },
              { icon: '🌟', label: 'Lifestyle Description', desc: 'What it feels like to live in the neighborhood.' },
              { icon: '🏫', label: 'Amenities Summary', desc: 'Schools, parks, dining, and shopping highlights.' },
              { icon: '👨‍👩‍👧', label: 'Community Feel', desc: 'Who this neighborhood is perfect for.' },
              { icon: '🏡', label: 'Buyer Appeal', desc: 'Real estate value and investment perspective.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={generate} disabled={loading || !neighborhood.trim()}
          style={{ width: '100%', padding: '16px', background: loading || !neighborhood.trim() ? 'rgba(29,158,117,0.3)' : 'linear-gradient(135deg,#1D9E75,#10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading || !neighborhood.trim() ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 40px rgba(29,158,117,0.35)', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '1.5rem' }}>
          {loading ? 'Generating neighborhood bio...' : '✨ Generate Neighborhood Bio'}
        </button>

        {/* OUTPUT */}
        {output && (
          <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid rgba(29,158,117,0.2)', padding: '1.5rem', boxShadow: '0 4px 20px rgba(29,158,117,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', margin: 0 }}>✅ Neighborhood Bio Ready</p>
              <button onClick={copy}
                style={{ padding: '7px 16px', background: copied ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)', border: '1px solid', borderColor: copied ? '#1D9E75' : 'var(--lw-border)', borderRadius: '8px', color: copied ? '#1D9E75' : 'var(--lw-text)', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p style={{ fontSize: '14px', lineHeight: '1.9', color: 'var(--lw-text)', whiteSpace: 'pre-wrap', margin: 0 }}>{output}</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
