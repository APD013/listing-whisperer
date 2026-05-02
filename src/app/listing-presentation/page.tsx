'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ListingPresentation() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    agentName: '', brokerage: '', phone: '', email: '',
    sellerName: '', propertyAddress: '', propertyType: 'Single family',
    beds: '', baths: '', sqft: '', targetPrice: '', neighborhood: '',
    sellerGoals: '', timeframe: '', competition: '', agentExperience: '', uniqueValue: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
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
      }
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
      if (data.result) setResult(data.result)
      else alert('Error: ' + (data.error || 'Something went wrong'))
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>Listing<span style={{ color: '#1D9E75' }}>Whisperer</span></div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', borderRadius: '20px', padding: '1.75rem 2rem', marginBottom: '1.75rem', boxShadow: '0 8px 32px rgba(139,92,246,0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Listing Presentation Builder</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.6' }}>
            Walk into every seller appointment fully prepared with a complete presentation kit.
          </p>
        </div>

        {/* FORM */}
        <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>AGENT DETAILS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div><label style={labelStyle}>Your Name</label><input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Brokerage</label><input placeholder="Compass, Keller Williams..." value={form.brokerage} onChange={e => setForm({ ...form, brokerage: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Phone</label><input placeholder="(949) 555-0123" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Years Experience</label><input placeholder="8 years" value={form.agentExperience} onChange={e => setForm({ ...form, agentExperience: e.target.value })} style={inputStyle} /></div>
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 12px' }}>SELLER & PROPERTY</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div><label style={labelStyle}>Seller Name</label><input placeholder="John & Mary Smith" value={form.sellerName} onChange={e => setForm({ ...form, sellerName: e.target.value })} style={inputStyle} /></div>
              <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Property Address</label><input placeholder="123 Oak Street, Newport Beach, CA" value={form.propertyAddress} onChange={e => setForm({ ...form, propertyAddress: e.target.value })} style={inputStyle} /></div>
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
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 12px' }}>SELLER CONTEXT</p>
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
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Your unique value proposition</label>
              <textarea placeholder="Top 1% in Newport Beach, sold 40 homes last year..." value={form.uniqueValue} onChange={e => setForm({ ...form, uniqueValue: e.target.value })}
                style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
            </div>
            <button onClick={generate} disabled={loading}
              style={{ width: '100%', padding: '15px', background: loading ? '#6d28d9' : 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(139,92,246,0.3)', transition: 'all 0.2s', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {loading ? '⏳ Building presentation...' : '🎯 Build Listing Presentation'}
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />)}
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
              <button onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ padding: '10px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', borderRadius: '10px', border: '1px solid var(--lw-border)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                ↺ New Presentation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}