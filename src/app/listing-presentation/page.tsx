'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import ToolHandoff from '../components/ToolHandoff'

import { isDemoUser, hasUsedDemoGeneration, getDemoGenerationTool, markDemoGenerationUsed } from '../lib/demoMode'
import DemoLockedCard from '../components/DemoLockedCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ListingPresentation() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [form, setForm] = useState({
    agentName: '', brokerage: '', phone: '', email: '',
    sellerName: '', propertyAddress: '', city: '', state: '', propertyType: 'Single family',
    beds: '', baths: '', sqft: '', targetPrice: '', neighborhood: '',
    sellerGoals: '', timeframe: '', competition: '', agentExperience: '', uniqueValue: '',
  })

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('listing_presentations')
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
      if (isDemoUser(user)) setIsDemo(true)
      const { data: profile } = await supabase
        .from('profiles').select('full_name, brand_voice').eq('id', user.id).single()
      if (profile?.full_name) setForm(prev => ({ ...prev, agentName: profile.full_name }))
      if (profile?.brand_voice) {
        try {
          const bv = JSON.parse(profile.brand_voice)
          if (bv.brokerage) setForm(prev => ({ ...prev, brokerage: bv.brokerage }))
          if (bv.phone) setForm(prev => ({ ...prev, phone: bv.phone }))
        } catch(e) {}
      }
      loadHistory(user.id)
    }
    getUser()
  }, [])

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.propertyAddress || !form.sellerName) { alert('Please fill in the seller name and property address.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/listing-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        if (isDemo) markDemoGenerationUsed('listing-presentation')
        const { data: saved } = await supabase.from('listing_presentations').insert({
          user_id: userId,
          address: form.propertyAddress || form.neighborhood || 'Untitled',
          form_data: form,
          outputs: data.result
        }).select('id').single()
        if (saved?.id) setSavedId(saved.id)
        if (userId) loadHistory(userId)
      } else {
        alert('Error: ' + (data.error || 'Something went wrong'))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const downloadPDF = () => {
    if (!savedId) return
    window.open(`/print/listing-presentation?id=${savedId}`, '_blank')
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
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
  }

  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  const scrollToForm = () => {
    document.getElementById('presentation-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (isDemo && hasUsedDemoGeneration() && getDemoGenerationTool() !== 'listing-presentation') return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <Navbar />
      <DemoLockedCard reason="limit_reached" usedTool={getDemoGenerationTool()} />
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(167,139,250,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            Build a full listing presentation in minutes.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Tell us about the seller and property — we'll create a complete presentation to help you win the listing.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            🎯 Build My Listing Presentation
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            6 complete sections · Ready for your next appointment
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '🏠', title: 'Enter seller and property details', desc: 'Agent info, seller name, address, and property specs' },
              { step: '2', icon: '⭐', title: 'Add your unique value proposition', desc: "Tell us what makes you different from the competition" },
              { step: '3', icon: '✅', title: 'Get your presentation deck', desc: '6 complete sections for your listing appointment' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#a78bfa,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="presentation-form" style={{ ...cardStyle, marginBottom: '1.5rem', border: '1px solid rgba(167,139,250,0.18)', boxShadow: '0 4px 32px rgba(167,139,250,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>AGENT DETAILS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div><label style={labelStyle}>Your Name</label><input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Brokerage</label><input placeholder="Compass, Keller Williams..." value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input placeholder="(949) 555-0123" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Years Experience</label><input placeholder="8 years" value={form.agentExperience} onChange={e => setForm({ ...form, agentExperience: e.target.value })} style={inputStyle} /></div>
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px', margin: '0 0 12px' }}>SELLER & PROPERTY</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div><label style={labelStyle}>Seller Name</label><input placeholder="John & Mary Smith" value={form.sellerName} onChange={e => setForm({ ...form, sellerName: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Property Address</label><input placeholder="123 Oak Street, Newport Beach, CA" value={form.propertyAddress} onChange={e => setForm({ ...form, propertyAddress: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>City</label><input placeholder="e.g. Newport Beach" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>State</label><select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inputStyle}><option value="">Select State</option>{['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}</select></div>
              <div>
                <label style={labelStyle}>Property Type</label>
                <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} style={inputStyle}>
                  <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
                </select>
              </div>
              <div><label style={labelStyle}>Beds / Baths</label><input placeholder="4 bed / 3 bath" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Sq Ft</label><input placeholder="2,200" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>Target Price</label><input placeholder="$1,295,000" value={form.targetPrice} onChange={e => setForm({ ...form, targetPrice: e.target.value })} style={inputStyle} /></div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', letterSpacing: '1px', margin: '0 0 12px' }}>SELLER CONTEXT</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Seller's Goal</label>
                <select value={form.sellerGoals} onChange={e => setForm({ ...form, sellerGoals: e.target.value })} style={inputStyle}>
                  <option value="">Select goal</option>
                  <option>Maximum price</option><option>Fast sale</option><option>Specific closing date</option><option>Minimal disruption</option><option>Relocation</option>
                </select>
              </div>
              <div><label style={labelStyle}>Timeframe</label><input placeholder="30-60 days, ASAP, flexible..." value={form.timeframe} onChange={e => setForm({ ...form, timeframe: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: '12px' }}><label style={labelStyle}>Competition / other agents interviewing</label><input placeholder="2 other agents, Compass agent also presenting..." value={form.competition} onChange={e => setForm({ ...form, competition: e.target.value })} style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Your unique value proposition</label>
              <textarea placeholder="Top 1% in Newport Beach, sold 40 homes last year..." value={form.uniqueValue} onChange={e => setForm({ ...form, uniqueValue: e.target.value })}
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '🎯', label: 'Opening statement', desc: 'A compelling intro that hooks your seller from the start' },
              { icon: '📊', label: 'Market analysis section', desc: 'Comparable sales and positioning context' },
              { icon: '💲', label: 'Pricing strategy', desc: "How you'll price the home and why" },
              { icon: '🚀', label: 'Marketing plan', desc: 'Your full listing marketing approach' },
              { icon: '⭐', label: 'Why choose you', desc: 'Your differentiators, tailored to this seller' },
              { icon: '🤝', label: 'Closing ask', desc: 'The script to ask for the listing agreement' },
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
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: '100%', padding: '15px',
            background: loading ? '#8b5cf6' : 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.3)',
            transition: 'all 0.2s', marginBottom: '1.5rem',
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
          }}
        >
          {loading ? '⏳ Building presentation...' : '🎯 Build My Listing Presentation'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />)}
            </div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', fontSize: '13px', margin: '0', flex: 1 }}>Building your listing presentation kit...</p>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid rgba(139,92,246,0.2)', padding: '2rem', boxShadow: '0 4px 20px rgba(139,92,246,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', margin: '0 0 6px' }}>OPENING STATEMENT</p>
                  <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0 }}>Start every presentation with this</p>
                </div>
                <button onClick={() => handleCopy('openingStatement', result.openingStatement)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)', fontSize: '12px', cursor: 'pointer', fontWeight: '600', background: copied === 'openingStatement' ? '#8b5cf6' : 'rgba(139,92,246,0.1)', color: copied === 'openingStatement' ? '#fff' : '#8b5cf6', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  {copied === 'openingStatement' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p style={{ fontSize: '14px', lineHeight: '1.9', color: 'var(--lw-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{result.openingStatement}</p>
            </div>

            {[
              { key: 'marketingPlan', label: 'Marketing Plan', icon: '🚀', color: '#1D9E75', desc: 'Your full marketing strategy for this listing' },
              { key: 'whyListWithMe', label: 'Why List With Me', icon: '⭐', color: '#d4af37', desc: 'Your value proposition and differentiators' },
              { key: 'pricingStrategy', label: 'Pricing Strategy', icon: '💲', color: '#f59e0b', desc: 'How you will price and position the home' },
              { key: 'objectionHandling', label: 'Objection Responses', icon: '🛡️', color: '#ef4444', desc: 'Answers to the most common seller objections' },
              { key: 'closingScript', label: 'Closing Script', icon: '🤝', color: '#8b5cf6', desc: 'How to close and ask for the listing agreement' },
              { key: 'followUpPlan', label: 'Follow-Up Plan', icon: '📅', color: '#6366f1', desc: "What to do if they don't sign that day" },
            ].map(card => result[card.key] && (
              <div key={card.key} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${card.color}15`, border: `1px solid ${card.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{card.icon}</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: 0 }}>{card.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: 0 }}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '500', background: copied === card.key ? card.color : 'var(--lw-input)', color: copied === card.key ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === card.key ? card.color : 'var(--lw-border)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.85', color: 'var(--lw-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{result[card.key]}</p>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '8px' }}>
              <a href="/seller-prep" style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>📋 Open Seller Prep</a>
              <a href="/pricing-assistant" style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.1)', color: '#d4af37', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', border: '1px solid rgba(212,175,55,0.3)', fontWeight: '600' }}>💲 Pricing Assistant</a>
              <button onClick={downloadPDF}
                style={{ padding: '10px 20px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', borderRadius: '10px', border: '1px solid rgba(29,158,117,0.2)', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                📄 Download PDF
              </button>
              <button onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ padding: '10px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', borderRadius: '10px', border: '1px solid var(--lw-border)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                ↺ New Presentation
              </button>
            </div>
            <ToolHandoff from="listing-presentation" handoffs={[
              { emoji: '🛡️', text: 'Handle seller objections', cta: 'Objection Handler', href: '/objection-handler' },
              { emoji: '📝', text: 'Generate listing copy', cta: 'Quick Listing', href: '/quick-listing' },
            ]} />
          </div>
        )}

        {/* PAST PRESENTATIONS */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={sectionHeadStyle}>Past Presentations</p>
          {!historyLoaded ? null : history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--lw-text-muted)', fontSize: '13px', padding: '1.5rem' }}>
              Your past presentations will appear here.
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
                      onClick={() => { setResult(item.outputs); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this presentation?')) return
                        await supabase.from('listing_presentations').delete().eq('id', item.id)
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
