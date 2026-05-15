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

const outputSections = [
  { key: 'root_cause', icon: '🔍', label: 'Root Cause Diagnosis' },
  { key: 'buyer_profile', icon: '👤', label: 'Ideal Buyer Profile' },
  { key: 'repositioning_strategy', icon: '📐', label: 'Repositioning Strategy' },
  { key: 'new_listing_copy', icon: '✍️', label: 'New Listing Copy' },
  { key: 'content_strategy', icon: '📱', label: 'Content Strategy' },
  { key: 'price_offer_strategy', icon: '💰', label: 'Price & Offer Strategy' },
]

export default function ListingRescuePage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageType, setImageType] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    propertyType: 'Single Family',
    beds: '',
    baths: '',
    sqft: '',
    listPrice: '',
    daysOnMarket: '',
    originalListPrice: '',
    triedSoFar: '',
    sellerSituation: '',
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('listing_rescues_history')
      .select('id, address, created_at, outputs')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setHistory(data)
    setHistoryLoaded(true)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
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
      loadHistory(user.id)
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.address.trim()) {
      alert('Please enter the property address.')
      return
    }
    if (!form.daysOnMarket) {
      alert('Please enter days on market.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/listing-rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: form.address,
          city: form.city,
          state: form.state,
          propertyType: form.propertyType,
          beds: form.beds,
          baths: form.baths,
          sqft: form.sqft,
          listPrice: form.listPrice,
          daysOnMarket: form.daysOnMarket,
          originalListPrice: form.originalListPrice,
          triedSoFar: form.triedSoFar,
          sellerSituation: form.sellerSituation,
          imageBase64,
          imageType,
          brandVoice,
          userId,
        }),
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
        const { data: saved } = await supabase.from('listing_rescues_history').insert({
          user_id: userId,
          address: form.address || form.city || 'Untitled',
          form_data: form,
          outputs: data.result
        }).select('id').single()
        if (saved?.id) setSavedId(saved.id)
        if (userId) loadHistory(userId)
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
    document.getElementById('rescue-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const downloadPDF = () => {
    if (!savedId) return
    window.open(`/print/listing-rescue?id=${savedId}`, '_blank')
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
    fontFamily: 'var(--font-plus-jakarta), sans-serif',
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
            Listing Rescue is a Pro-only feature. Upgrade to diagnose exactly why your listing is sitting and get a complete AI-powered rescue plan.
          </p>
          <a href="/pricing" onClick={() => trackUpgradeClick('listing_rescue', 'starter')} style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(29,158,117,0.3)', marginBottom: '12px' }}>
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
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(239,68,68,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER PRO
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            🚨 Listing Rescue
          </h1>
          <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '10px', lineHeight: '1.4' }}>
            Find out exactly why your listing isn't selling — and what to do about it.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Enter your listing details and our AI will diagnose the problem and prescribe a complete repositioning strategy.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            🚨 Diagnose My Listing
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            Powered by AI built specifically for real estate agents, not generic advice tools.
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '📋', title: 'Enter your listing details and what\'s been tried', desc: 'Days on market, price history, marketing done, and seller context' },
              { step: '2', icon: '🔬', title: 'AI diagnoses the core problem', desc: 'Deep analysis of pricing, positioning, marketing, and buyer fit' },
              { step: '3', icon: '🚀', title: 'Get your complete rescue plan', desc: 'Root cause, buyer profile, new copy, content strategy, and pricing guidance' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
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
              { icon: '🔍', label: 'Root Cause Diagnosis', desc: 'Why the listing is really sitting' },
              { icon: '👤', label: 'Ideal Buyer Profile', desc: 'Who is most likely to buy this property' },
              { icon: '📐', label: 'Repositioning Strategy', desc: 'How to reframe the listing' },
              { icon: '✍️', label: 'New Listing Copy', desc: 'Rewritten description with fresh angle' },
              { icon: '📱', label: 'Content Strategy', desc: 'Platform-specific marketing recommendations' },
              { icon: '💰', label: 'Price & Offer Strategy', desc: 'Data-backed pricing and offer language' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="rescue-form" style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.18)', boxShadow: '0 4px 32px rgba(239,68,68,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>LISTING DETAILS</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Street Address</label>
            <input
              type="text"
              placeholder="123 Main St"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input type="text" placeholder="e.g. Newport Beach" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inputStyle}>
                <option value="">Select State</option>
                {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Property Type</label>
            <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} style={inputStyle}>
              <option>Single Family</option>
              <option>Condo</option>
              <option>Townhouse</option>
              <option>Multi-Family</option>
              <option>Land</option>
              <option>Commercial</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Beds</label>
              <input type="text" placeholder="e.g. 3" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Baths</label>
              <input type="text" placeholder="e.g. 2" value={form.baths} onChange={e => setForm({ ...form, baths: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sq Ft</label>
              <input type="text" placeholder="e.g. 1,850" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>List Price</label>
              <input type="text" placeholder="e.g. $525,000" value={form.listPrice} onChange={e => setForm({ ...form, listPrice: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Days on Market</label>
              <input type="number" placeholder="e.g. 45" value={form.daysOnMarket} onChange={e => setForm({ ...form, daysOnMarket: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Original List Price</label>
            <input type="text" placeholder="e.g. $549,000 (if price was reduced)" value={form.originalListPrice} onChange={e => setForm({ ...form, originalListPrice: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>What's been tried</label>
            <textarea
              placeholder="What marketing have you already done? Any price reductions? Feedback from showings?"
              value={form.triedSoFar}
              onChange={e => setForm({ ...form, triedSoFar: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.6' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Seller situation <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>(optional)</span></label>
            <textarea
              placeholder="Any context about the seller or their timeline?"
              value={form.sellerSituation}
              onChange={e => setForm({ ...form, sellerSituation: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.6' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Listing Photo <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: '0' }}>(optional)</span></label>
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
                <div style={{ padding: '22px', border: '1.5px dashed var(--lw-border)', borderRadius: '10px', textAlign: 'center', background: 'var(--lw-input)' }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>📷</div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 3px' }}>Click to upload a listing photo</p>
                  <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0', opacity: 0.7 }}>JPG, PNG or WEBP — AI will analyze visual details</p>
                </div>
              )}
            </label>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#dc2626' : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 28px rgba(239,68,68,0.3)',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            {loading ? '⏳ Analyzing your listing...' : '🚨 Diagnose My Listing'}
          </button>

          {brandVoice?.agentName && (
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '10px' }}>
              Personalized for {brandVoice.agentName}{brandVoice.brokerage ? ` · ${brandVoice.brokerage}` : ''}
            </p>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🚨</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}>Analyzing your listing...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Diagnosing root cause, buyer profile, repositioning strategy, and more...</p>
          </div>
        )}

        {/* RESULTS */}
        {result && (
          <div id="results">
            <div style={{ ...cardStyle, border: '1px solid rgba(239,68,68,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', letterSpacing: '1px', marginBottom: '16px' }}>
                🚨 YOUR LISTING RESCUE PLAN — {form.address.toUpperCase()}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {outputSections.map(({ key, icon, label }) =>
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
                            background: copied === key ? '#ef4444' : 'transparent',
                            color: copied === key ? '#fff' : 'var(--lw-text-muted)',
                            borderColor: copied === key ? '#ef4444' : 'var(--lw-border)',
                            transition: 'all 0.15s',
                            fontFamily: 'var(--font-plus-jakarta), sans-serif',
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
              <button onClick={downloadPDF}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                📄 Download PDF
              </button>
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
              >
                🔄 New Rescue
              </button>
            </div>
          </div>
        )}

        {/* PAST RESCUE PLANS */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={sectionHeadStyle}>Past Rescue Plans</p>
          {!historyLoaded ? null : history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--lw-text-muted)', fontSize: '13px', padding: '1.5rem' }}>
              Your past rescue plans will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map(item => (
                <div key={item.id} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)' }}>{item.address}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--lw-text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setResult(item.outputs)
                        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
                      }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this rescue plan?')) return
                        await supabase.from('listing_rescues_history').delete().eq('id', item.id)
                        if (userId) loadHistory(userId)
                      }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: '#6b7280', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
