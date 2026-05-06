'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const outputs = [
  { key: 'script', icon: '📝', label: '8-Second Script' },
  { key: 'motion_prompt', icon: '🎬', label: 'Motion Prompt (for Kling/Luma/Runway)' },
  { key: 'caption', icon: '📱', label: 'Caption' },
  { key: 'hashtags', icon: '#️⃣', label: 'Hashtags' },
  { key: 'voiceover', icon: '🗣️', label: 'Voiceover Line' },
  { key: 'audio_suggestion', icon: '🎵', label: 'Audio Suggestion' },
  { key: 'cover_text', icon: '📌', label: 'Cover Text' },
]

export default function VideoStudioPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    propertyNotes: '',
    videoGoal: 'New Listing',
    platform: 'Instagram Reels',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        if (profile.brand_voice) {
          try {
            const bv = typeof profile.brand_voice === 'string'
              ? JSON.parse(profile.brand_voice)
              : profile.brand_voice
            setBrandVoice(bv)
          } catch (e) {}
        }
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.propertyNotes.trim()) {
      alert('Please add some property notes first.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/video-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyNotes: form.propertyNotes,
          videoGoal: form.videoGoal,
          platform: form.platform,
          brandVoice,
        }),
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--lw-text)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }
  const labelStyle = {
    fontSize: '11px',
    fontWeight: '600' as const,
    color: 'var(--lw-text-muted)',
    display: 'block' as const,
    marginBottom: '5px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  }
  const cardStyle = {
    background: 'var(--lw-card)',
    borderRadius: '16px',
    border: '1px solid var(--lw-border)',
    padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    marginBottom: '1rem',
  }

  if (planLoaded && plan !== 'pro') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Pro Feature</h1>
          <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
            Video Studio is a Pro-only feature. Upgrade to turn any listing into a complete short-form video ad kit personalized to your brand voice.
          </p>
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

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(225,48,108,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#e1306c,#833ab4)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(225,48,108,0.2)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>🎬 Video Studio</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.82)', margin: '0', lineHeight: '1.6' }}>
            Turn one listing into a complete short-form video ad kit
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>LISTING DETAILS</p>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Property Notes</label>
            <textarea
              placeholder="Address, beds/baths, sqft, price, key features, what makes it special..."
              value={form.propertyNotes}
              onChange={e => setForm({ ...form, propertyNotes: e.target.value })}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.6', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Video Goal</label>
              <select value={form.videoGoal} onChange={e => setForm({ ...form, videoGoal: e.target.value })} style={inputStyle}>
                <option>New Listing</option>
                <option>Open House</option>
                <option>Price Drop</option>
                <option>Just Sold</option>
                <option>Agent Branding</option>
                <option>Buyer Lead Ad</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Platform</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={inputStyle}>
                <option>TikTok</option>
                <option>Instagram Reels</option>
                <option>YouTube Shorts</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#833ab4' : 'linear-gradient(135deg,#e1306c,#833ab4)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 24px rgba(225,48,108,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Generating your video kit...' : '🎬 Generate Video Kit'}
          </button>

          {brandVoice?.agentName && (
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Personalized for {brandVoice.agentName}{brandVoice.brokerage ? ` · ${brandVoice.brokerage}` : ''}
            </p>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎬</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Building your video kit...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Crafting script, motion prompt, caption, hashtags, and more...</p>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div id="results">
            <div style={{ ...cardStyle, border: '1px solid rgba(225,48,108,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '16px' }}>
                🎬 YOUR VIDEO KIT — {form.videoGoal.toUpperCase()} · {form.platform.toUpperCase()}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {outputs.map(({ key, icon, label }) =>
                  result[key] ? (
                    <div key={key} style={{ background: 'var(--lw-input)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--lw-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text)' }}>
                          {icon} {label}
                        </span>
                        <button
                          onClick={() => copy(key, result[key])}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            background: copied === key ? '#e1306c' : 'transparent',
                            color: copied === key ? '#fff' : 'var(--lw-text-muted)',
                            borderColor: copied === key ? '#e1306c' : 'var(--lw-border)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {copied === key ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>
                        {result[key]}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Back to Dashboard
              </a>
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
              >
                🔄 New Video Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
