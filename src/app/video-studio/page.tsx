'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import Navbar from '../components/Navbar'
import { trackUpgradeClick } from '../lib/analytics'

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

const exampleOutputs = [
  { icon: '📝', label: '8-Second Script', text: 'New listing ready in minutes — your real estate AI turns photos into posts, captions, and video prompts.' },
  { icon: '📌', label: 'Cover Text', text: '1 Photo → Full Listing Video' },
  { icon: '📱', label: 'Caption', text: 'Marketing a listing should not take hours. Listing Whisperer helps agents turn property photos and notes into ready-to-use social content in minutes.' },
  { icon: '#️⃣', label: 'Hashtags', text: '#RealEstateMarketing #ListingAgent #RealtorTools #AIForRealEstate' },
  { icon: '🎬', label: 'Motion Prompt', text: 'Cinematic vertical real estate video from listing photo. Subtle handheld camera movement, natural lighting, smooth push-in motion, professional social media pacing. No text on screen.' },
  { icon: '🎵', label: 'Audio Direction', text: 'Upbeat, clean, confident background music with a modern real estate marketing feel.' },
]

export default function VideoStudioPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    propertyNotes: '',
    videoGoal: 'New Listing',
    platform: 'Instagram Reels',
  })
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageType, setImageType] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const processImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setImagePreview(dataUrl)
      const base64 = dataUrl.split(',')[1]
      setImageBase64(base64)
      setImageType(file.type)
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processImageFile(file)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: kits } = await supabase.from('video_kits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      if (kits) setHistory(kits)
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
          userId,
          imageBase64,
          imageType,
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

  const scrollToForm = () => {
    document.getElementById('studio-form')?.scrollIntoView({ behavior: 'smooth' })
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
  const sectionHeadStyle = {
    fontSize: '11px',
    fontWeight: '700' as const,
    color: 'var(--lw-text-muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
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
          <a href="/pricing" onClick={() => trackUpgradeClick('video_studio', 'starter')} style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(29,158,117,0.3)', marginBottom: '12px' }}>
            Upgrade to Pro — $20/mo
          </a>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(225,48,108,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(131,58,180,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* ── HERO ── */}
        <div style={{ background: 'linear-gradient(135deg,#e1306c,#833ab4)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(225,48,108,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER PRO
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            🎬 Video Studio
          </h1>
          <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '10px', lineHeight: '1.4' }}>
            Create scroll-stopping real estate videos in minutes.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Turn one listing photo and a few notes into a complete TikTok, Reels, or Shorts ad kit — without writing scripts, captions, or prompts yourself.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            🎬 Create My Video Ad Kit
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            Powered by AI built specifically for real estate marketing, not generic content tools.
          </p>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '📸', title: 'Upload your listing photo', desc: 'AI analyzes colors, features, and style from your image' },
              { step: '2', icon: '🎯', title: 'Choose your goal and platform', desc: 'New Listing, Open House, Price Drop — optimized per platform' },
              { step: '3', icon: '🎬', title: 'Get your complete video ad kit', desc: 'Script, motion prompt, caption, hashtags, cover text, and audio' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#e1306c,#833ab4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FORM ── */}
        <div id="studio-form" style={{ ...cardStyle, border: '1px solid rgba(225,48,108,0.18)', boxShadow: '0 4px 32px rgba(225,48,108,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>LISTING DETAILS</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Listing Photo (optional but recommended)</label>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--lw-border)', lineHeight: 0 }}>
                  <img src={imagePreview} alt="Listing preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '6px 14px', borderRadius: '20px' }}>Change photo</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{ padding: '22px', border: isDragging ? '1.5px dashed var(--lw-accent)' : '1.5px dashed var(--lw-border)', borderRadius: '10px', textAlign: 'center', background: isDragging ? 'var(--lw-accent)10' : 'var(--lw-input)', transition: 'border-color 0.2s' }}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processImageFile(file) }}
                >
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📷</div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 3px' }}>Drag & drop or click to upload</p>
                  <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0', opacity: 0.7 }}>JPG, PNG or WEBP — AI will analyze visual details</p>
                </div>
              )}
            </label>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Property Notes</label>
            <textarea
              placeholder="Address, beds/baths, sqft, price, key features, what makes it special..."
              value={form.propertyNotes}
              onChange={e => setForm({ ...form, propertyNotes: e.target.value })}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.6', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
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
                <option>Facebook Reels</option>
                <option>YouTube Shorts</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#833ab4' : 'linear-gradient(135deg,#e1306c,#833ab4)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 28px rgba(225,48,108,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Building your video ad kit...' : '🎬 Create My Video Ad Kit'}
          </button>

          <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '10px', lineHeight: '1.6' }}>
            💡 Paste the motion prompt into Kling, Zeely, Runway, or Luma to generate the final video.
          </p>

          {brandVoice?.agentName && (
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '6px' }}>
              Personalized for {brandVoice.agentName}{brandVoice.brokerage ? ` · ${brandVoice.brokerage}` : ''}
            </p>
          )}
        </div>

        {/* ── WHAT YOU'LL GET ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '📝', label: '8-Second Script', desc: 'Short, social-ready wording built for TikTok/Reels' },
              { icon: '🎬', label: 'Motion Prompt', desc: 'Ready to paste into Kling, Zeely, Runway, or Luma' },
              { icon: '📱', label: 'Caption', desc: 'Platform-optimized for real estate engagement' },
              { icon: '#️⃣', label: 'Hashtags', desc: 'Relevant to your listing, goal, and local market' },
              { icon: '📌', label: 'Cover Text', desc: 'Bold hook text for your video cover frame' },
              { icon: '🎵', label: 'Audio Direction', desc: 'Genre, tempo, and mood suggestion' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── EXAMPLE OUTPUT ── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>Example Video Ad Kit</p>
          <div style={{ ...cardStyle, marginBottom: '0', border: '1px solid var(--lw-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exampleOutputs.map(({ icon, label, text }) => (
                <div key={label} style={{ background: 'var(--lw-input)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--lw-border)' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', margin: '0 0 5px', letterSpacing: '0.3px' }}>{icon} {label}</p>
                  <p style={{ fontSize: '13px', color: 'var(--lw-text)', margin: '0', lineHeight: '1.6' }}>{text}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', marginTop: '12px', marginBottom: '0', textAlign: 'center', opacity: 0.7 }}>
              ↑ Example output. Your kit is generated from your actual listing details and brand voice.
            </p>
          </div>
        </div>

        {/* ── CLARIFICATION NOTE ── */}
        <div style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.5rem', fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.7' }}>
          💡 This creates your video ad kit. Paste the motion prompt into Kling, Zeely, Runway, or Luma to generate the final video. Future versions may include direct video generation inside Listing Whisperer.
        </div>

        {/* ── PRO VALUE ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.08), rgba(8,80,65,0.06))', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Built for agents who market fast.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.7', marginBottom: '18px', maxWidth: '480px', margin: '0 auto 18px' }}>
            Video Studio helps you move from listing photo to social-ready campaign faster — spend less time writing and more time winning clients.
          </p>
          <button
            onClick={scrollToForm}
            style={{ padding: '13px 32px', background: 'linear-gradient(135deg,#e1306c,#833ab4)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 24px rgba(225,48,108,0.3)' }}
          >
            🎬 Create My Video Ad Kit
          </button>
        </div>

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🎬</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}>Building your video kit...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Crafting script, motion prompt, caption, hashtags, and more...</p>
          </div>
        )}

        {/* ── RESULTS ── */}
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
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
                >
                  🕘 {showHistory ? 'Hide' : 'View'} History ({history.length})
                </button>
              )}
            </div>

            {showHistory && history.length > 0 && (
              <div style={cardStyle}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '12px' }}>PAST VIDEO KITS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((kit: any) => (
                    <div
                      key={kit.id}
                      onClick={() => { setResult(kit.result); setForm({ propertyNotes: kit.property_notes, videoGoal: kit.video_goal, platform: kit.platform }); setShowHistory(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      style={{ padding: '12px 14px', background: 'var(--lw-input)', borderRadius: '10px', border: '1px solid var(--lw-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 2px' }}>{kit.video_goal} · {kit.platform}</p>
                        <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0' }}>{new Date(kit.created_at).toLocaleDateString()} · {kit.property_notes?.slice(0, 50)}...</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#e1306c', fontWeight: '600' }}>Load →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
