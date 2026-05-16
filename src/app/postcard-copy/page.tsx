'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import ToolHandoff from '../components/ToolHandoff'

import { isDemoUser, hasUsedDemoGeneration, getDemoGenerationTool, markDemoGenerationUsed } from '../lib/demoMode'
import DemoLockedCard from '../components/DemoLockedCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PostcardCopyPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    type: 'Just Listed',
    address: '',
    city: '',
    state: '',
    neighborhood: '',
    beds: '',
    baths: '',
    sqft: '',
    price: '',
    agentName: '',
    phone: '',
    brokerage: '',
    features: '',
    tone: 'Professional',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'postcard_copy' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (isDemoUser(user)) setIsDemo(true)
      const { data: profile } = await supabase
        .from('profiles').select('plan, brand_voice, full_name').eq('id', user.id).single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            setForm(prev => ({
              ...prev,
              agentName: bv.agentName || profile.full_name || '',
              phone: bv.phone || '',
              brokerage: bv.brokerage || '',
              tone: bv.preferredTone || 'Professional',
            }))
          } catch(e) {}
        }
      } else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.address) { alert('Please enter a property address!'); return }
    setLoading(true)
    setOutput(null)
    try {
      const prompt = `You are a real estate marketing expert. Generate postcard copy for a ${form.type} postcard.

Property Details:
- Address: ${form.address}
- Location: ${form.city ? form.city + ', ' : ''}${form.state || ''}
- Neighborhood: ${form.neighborhood}
- Beds/Baths: ${form.beds} bed / ${form.baths} bath
- Square Footage: ${form.sqft} sq ft
- Price: ${form.price}
- Special Features: ${form.features}

Agent Details:
- Agent Name: ${form.agentName}
- Brokerage: ${form.brokerage}
- Phone: ${form.phone}

Tone: ${form.tone}

Generate 4 sections and return ONLY a JSON object with no other text:
{
  "front_headline": "A bold, attention-grabbing headline for the front of the postcard (max 10 words)",
  "front_subheadline": "A supporting line under the headline (max 15 words)",
  "back_copy": "The main body copy for the back of the postcard (3-4 sentences, compelling and professional)",
  "call_to_action": "A strong call to action (1-2 sentences)",
  "neighborhood_hook": "A line about the neighborhood that makes it desirable (1-2 sentences)"
}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          currentPage: '/postcard-copy'
        })
      })
      const data = await res.json()
      const text = data.message || ''
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        setOutput(parsed)
      } catch(e) {
        setOutput({ front_headline: text, back_copy: '', call_to_action: '', neighborhood_hook: '', front_subheadline: '' })
      }
      if (isDemo) markDemoGenerationUsed('postcard-copy')
      trackEvent('postcard_copy_generated', { type: form.type, tone: form.tone })
    } catch(e) {
      alert('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '13px',
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
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '1rem'
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

  if (isDemo && hasUsedDemoGeneration() && getDemoGenerationTool() !== 'postcard-copy') return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <DemoLockedCard reason="limit_reached" usedTool={getDemoGenerationTool()} />
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <div style={{position:'fixed',top:'10%',right:'10%',width:'380px',height:'380px',background:'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'15%',left:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle' }}>PRO</span>
          )}
        </div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(99,102,241,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>POSTCARD COPY</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Postcard copy that gets doors to open.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Generate compelling Just Listed &amp; Just Sold postcards for the neighborhood in minutes.</p>
          <button onClick={() => document.getElementById('postcard-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Create My Postcard →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '🏠', title: 'Choose your postcard type', desc: 'Select Just Listed or Just Sold and add property details.' },
              { s: '2', icon: '✍️', title: 'Fill in the details', desc: 'Add beds, baths, price, features, and your agent info.' },
              { s: '3', icon: '📬', title: 'Get professional copy', desc: 'Front headline, back copy, and call to action — ready to print.' },
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

        {/* FORM */}
        <div id="postcard-form" style={cardStyle}>
          {/* TYPE SELECTOR */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Postcard Type</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['Just Listed', 'Just Sold'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'all 0.15s', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                    borderColor: form.type === t ? '#6366f1' : 'var(--lw-border)',
                    background: form.type === t ? 'rgba(99,102,241,0.1)' : 'var(--lw-input)',
                    color: form.type === t ? '#6366f1' : 'var(--lw-text-muted)' }}>
                  {t === 'Just Listed' ? '🏠 Just Listed' : '✅ Just Sold'}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 12px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>PROPERTY DETAILS</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Property Address *</label>
            <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input placeholder="e.g. Newport Beach" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inputStyle}>
                <option value="">Select State</option>
                {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div><label style={labelStyle}>Neighborhood</label><input placeholder="Newport Heights" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Beds</label><input placeholder="4" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Baths</label><input placeholder="3" value={form.baths} onChange={e => setForm({ ...form, baths: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Sq Ft</label><input placeholder="2,200" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Price</label><input placeholder="$1,295,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} /></div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Special Features</label>
            <input placeholder="Ocean views, pool, updated kitchen, 3-car garage..." value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} style={inputStyle} />
          </div>

          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 12px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>AGENT DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div><label style={labelStyle}>Your Name</label><input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Brokerage</label><input placeholder="Compass" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input placeholder="(949) 555-0100" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
          </div>

          <div>
            <label style={labelStyle}>Tone</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Professional', 'Warm & Friendly', 'Luxury', 'Energetic'].map(t => (
                <button key={t} onClick={() => setForm({ ...form, tone: t })}
                  style={{ padding: '7px 16px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                    borderColor: form.tone === t ? '#6366f1' : 'var(--lw-border)',
                    background: form.tone === t ? 'rgba(99,102,241,0.1)' : 'var(--lw-input)',
                    color: form.tone === t ? '#6366f1' : 'var(--lw-text-muted)' }}>
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
              { icon: '🎯', label: 'Front Headline', desc: 'Bold, attention-grabbing headline for the front of the card.' },
              { icon: '✍️', label: 'Front Subheadline', desc: 'Supporting line that reinforces the headline.' },
              { icon: '📝', label: 'Back Copy', desc: 'Compelling body copy for the back of the postcard.' },
              { icon: '📞', label: 'Call to Action', desc: 'A strong closing line that drives inquiries.' },
              { icon: '🏘️', label: 'Neighborhood Hook', desc: 'A local angle that resonates with neighborhood recipients.' },
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
        <button onClick={generate} disabled={loading || !form.address.trim()}
          style={{ width: '100%', padding: '16px', background: loading || !form.address.trim() ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading || !form.address.trim() ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 40px rgba(99,102,241,0.35)', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '1.5rem' }}>
          {loading ? 'Generating postcard copy...' : '📬 Generate Postcard Copy'}
        </button>

        {/* OUTPUT */}
        {output && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', margin: '0 0 4px' }}>✅ POSTCARD COPY READY — {form.type.toUpperCase()}</p>

            {[
              { key: 'front_headline', label: '🎯 Front Headline', desc: 'Bold headline for the front of the postcard' },
              { key: 'front_subheadline', label: '✍️ Front Subheadline', desc: 'Supporting line under the headline' },
              { key: 'back_copy', label: '📝 Back Copy', desc: 'Main body copy for the back of the postcard' },
              { key: 'call_to_action', label: '📞 Call to Action', desc: 'Strong closing line' },
              { key: 'neighborhood_hook', label: '🏘️ Neighborhood Hook', desc: 'A line about the neighborhood' },
            ].map(card => output[card.key] && (
              <div key={card.key} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0 0 2px' }}>{card.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: 0 }}>{card.desc}</p>
                  </div>
                  <button onClick={() => copy(card.key, output[card.key])}
                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                      background: copied === card.key ? '#6366f1' : 'var(--lw-input)',
                      color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',
                      borderColor: copied === card.key ? '#6366f1' : 'var(--lw-border)' }}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: 'var(--lw-text)', margin: 0, whiteSpace: 'pre-wrap', fontWeight: card.key === 'front_headline' ? '700' : '400' }}>{output[card.key]}</p>
              </div>
            ))}

            <button onClick={() => { setOutput(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{ padding: '11px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', color: 'var(--lw-text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              ↺ Generate New Postcard
            </button>
            <ToolHandoff from="postcard-copy" handoffs={[
              { emoji: '📱', text: 'Get social media variations', cta: 'Social Planner', href: '/social-planner' },
              { emoji: '📧', text: 'Send a follow-up email', cta: 'Follow-Up', href: '/follow-up' },
            ]} />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
