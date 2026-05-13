'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackEvent } from '../lib/analytics'
import AskAiHint from '../components/AskAiHint'

import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PricingAssistant() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [pastReports, setPastReports] = useState<any[]>([])
  const [form, setForm] = useState({
    propertyType: 'Single family',
    beds: '',
    baths: '',
    sqft: '',
    condition: 'Good',
    upgrades: '',
    neighborhood: '',
    city: '',
    state: '',
    comps: '',
    notes: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'pricing_assistant' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: reports } = await supabase
          .from('pricing_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (reports) setPastReports(reports)
      }
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: "var(--font-plus-jakarta), sans-serif", color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.neighborhood && !form.sqft) { alert('Please fill in at least the neighborhood and square footage.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/pricing-assistant', {
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

  const scrollToForm = () => {
    document.getElementById('pricing-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main style={styles.page}>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(160,128,64,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#d4af37,#a08040)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(212,175,55,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            Get a data-backed pricing strategy your sellers will trust.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Enter the property details and we'll generate a pricing recommendation with seller talking points.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            💲 Get My Pricing Strategy
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            Pricing guidance for agent preparation · Not a certified appraisal
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '🏠', title: 'Enter property details', desc: 'Type, size, condition, upgrades, and neighborhood context' },
              { step: '2', icon: '📊', title: 'Add comparable context', desc: 'Include recent sold comps for a sharper analysis' },
              { step: '3', icon: '✅', title: 'Get your pricing strategy', desc: 'A complete, data-backed pricing recommendation' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#d4af37,#a08040)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <AskAiHint hint="Not sure how to price it? Ask AI for a pricing strategy →" />
        <div id="pricing-form" style={{ ...styles.card, marginBottom: '1.5rem', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 4px 32px rgba(212,175,55,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#d4af37', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>PROPERTY DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={styles.label}>Property Type</label>
              <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} style={styles.select}>
                <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Beds</label>
              <input placeholder="4" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Baths</label>
              <input placeholder="3" value={form.baths} onChange={e => setForm({ ...form, baths: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Sq Ft</label>
              <input placeholder="2,200" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Condition</label>
              <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} style={styles.select}>
                <option>Excellent</option><option>Good</option><option>Average</option><option>Needs work</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Neighborhood / City</label>
              <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>City</label>
              <input placeholder="e.g. Newport Beach" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={styles.select}>
                <option value="">Select State</option>
                {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#d4af37', letterSpacing: '1px', margin: '0 0 12px' }}>UPGRADES & FEATURES</p>
            <label style={styles.label}>Recent upgrades or notable features</label>
            <input placeholder="New kitchen, solar panels, ADU, pool, updated bathrooms..." value={form.upgrades} onChange={e => setForm({ ...form, upgrades: e.target.value })} style={{ ...styles.input, marginBottom: '12px' }} />
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#d4af37', letterSpacing: '1px', margin: '0 0 4px' }}>COMPARABLE SALES (OPTIONAL)</p>
            <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', marginBottom: '12px' }}>Enter up to 3 recent sold properties nearby for a more accurate analysis.</p>

            {[0, 1, 2].map(i => (
              <div key={i} style={{ background: 'var(--lw-input)', borderRadius: '10px', padding: '12px', marginBottom: '8px', border: '1px solid var(--lw-border)' }}>
                <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '0 0 8px', letterSpacing: '0.5px' }}>COMP {i + 1}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
                  <input placeholder="123 Oak St"
                    value={(form as any)[`comp${i}_address`] || ''}
                    onChange={e => setForm({ ...form, [`comp${i}_address`]: e.target.value } as any)}
                    style={{ ...styles.input, fontSize: '12px', padding: '8px 10px' }} />
                  <input placeholder="Beds/Ba"
                    value={(form as any)[`comp${i}_beds`] || ''}
                    onChange={e => setForm({ ...form, [`comp${i}_beds`]: e.target.value } as any)}
                    style={{ ...styles.input, fontSize: '12px', padding: '8px 10px' }} />
                  <input placeholder="Sq Ft"
                    value={(form as any)[`comp${i}_sqft`] || ''}
                    onChange={e => setForm({ ...form, [`comp${i}_sqft`]: e.target.value } as any)}
                    style={{ ...styles.input, fontSize: '12px', padding: '8px 10px' }} />
                  <input placeholder="Sold $"
                    value={(form as any)[`comp${i}_price`] || ''}
                    onChange={e => setForm({ ...form, [`comp${i}_price`]: e.target.value } as any)}
                    style={{ ...styles.input, fontSize: '12px', padding: '8px 10px' }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: '12px' }}>
              <label style={styles.label}>Additional notes</label>
              <textarea placeholder="Seller expects $1.2M, market has been slow, corner lot..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                style={{ ...styles.input, minHeight: '60px', resize: 'vertical' as const }} />
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '💰', label: 'Recommended price range', desc: 'A suggested list price range with confidence rationale' },
              { icon: '📈', label: 'Market positioning analysis', desc: 'How this home stacks up against the current market' },
              { icon: '💬', label: 'Seller talking points', desc: 'How to explain the price in a way sellers accept' },
              { icon: '📝', label: 'Price justification narrative', desc: 'The full reasoning behind the recommendation' },
              { icon: '🛡️', label: 'Objection responses', desc: 'Answers to price-related pushback from sellers' },
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
            background: loading ? '#a08040' : 'linear-gradient(135deg,#d4af37,#a08040)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 28px rgba(212,175,55,0.3)',
            transition: 'all 0.2s', marginBottom: '1.5rem',
          }}
        >
          {loading ? '⏳ Analyzing market factors...' : '💲 Get My Pricing Strategy'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{ ...styles.card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <style>{`
              @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
              @keyframes shimmer { 0% { background-position: -800px 0 } 100% { background-position: 800px 0 } }
            `}</style>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4af37', animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', fontSize: '13px', margin: '0', flex: 1 }}>Analyzing market factors and building your pricing strategy...</p>
            <span style={{ fontSize: '12px', color: '#d4af37', fontWeight: '600' }}>⏳</span>
          </div>
        )}

        {/* PAST REPORTS */}
        {pastReports.length > 0 && !result && !loading && (
          <div style={{ ...styles.card, marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#d4af37', letterSpacing: '1px', margin: '0 0 12px' }}>RECENT PRICING REPORTS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastReports.map(report => (
                <div key={report.id}
                  onClick={() => setResult(report.full_report)}
                  style={{ background: 'var(--lw-input)', borderRadius: '10px', border: '1px solid var(--lw-border)', padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.25)'; e.currentTarget.style.background = 'rgba(212,175,55,0.04)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lw-border)'; e.currentTarget.style.background = 'var(--lw-input)' }}>
                  <div>
                    <p style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)' }}>
                      {report.neighborhood || report.property_type} · {report.price_range}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--lw-text-muted)' }}>
                      {report.beds}bd / {report.baths}ba · {report.sqft} sqft · {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: '500' }}>View →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* PRICE RANGE HERO */}
            <div style={{ background: 'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04))', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.2)', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#a08040', letterSpacing: '1px', margin: '0 0 8px' }}>SUGGESTED LIST PRICE RANGE</p>
                  <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#d4af37', margin: '0', letterSpacing: '-1px' }}>{result.priceRange}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '6px 0 0' }}>{result.confidence}</p>
                </div>
                <button onClick={() => handleCopy('range', result.priceRange)}
                  style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)', fontSize: '12px', cursor: 'pointer', fontWeight: '600', background: copied === 'range' ? '#d4af37' : 'rgba(212,175,55,0.1)', color: copied === 'range' ? '#000' : '#d4af37' }}>
                  {copied === 'range' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* OUTPUT CARDS */}
            {[
              { key: 'strategy', label: 'Pricing Strategy', icon: '🎯', color: '#1D9E75', desc: 'How to position this listing' },
              { key: 'sellerTalkingPoints', label: 'Seller Talking Points', icon: '💬', color: '#8b5cf6', desc: 'How to explain the price to your seller' },
              { key: 'keyFactors', label: 'Key Pricing Factors', icon: '📊', color: '#d4af37', desc: 'What drove this recommendation' },
              { key: 'objectionResponses', label: 'Objection Responses', icon: '🛡️', color: '#ef4444', desc: 'Answers to common seller pushback' },
              { key: 'marketPositioning', label: 'Market Positioning', icon: '🏆', color: '#f59e0b', desc: 'How this home compares to the market' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{ ...styles.card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${card.color}15`, border: `1px solid ${card.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{card.icon}</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0' }}>{card.label}</p>
                      <p style={{ fontSize: '11px', color: '#5a5f72', margin: '0' }}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '500', background: copied === card.key ? card.color : 'var(--lw-input)', color: copied === card.key ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === card.key ? card.color : 'var(--lw-border)' }}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.85', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{result[card.key]}</p>
              </div>
            ))}

            {/* ACTIONS */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '8px' }}>
              <a href="/seller-prep" style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '600', boxShadow: '0 0 20px rgba(29,158,117,0.3)' }}>
                📋 Open Seller Prep
              </a>
              <button onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ padding: '10px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', borderRadius: '10px', border: '1px solid var(--lw-border)', fontSize: '13px', cursor: 'pointer' }}>
                ↺ Run Again
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
