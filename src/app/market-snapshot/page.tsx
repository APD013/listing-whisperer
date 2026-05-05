'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SnapshotResult = {
  market_summary: string
  price_trends: string
  inventory_analysis: string
  buyer_seller_assessment: string
  client_email: string
}

export default function MarketSnapshotPage() {
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SnapshotResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const [form, setForm] = useState({
    neighborhood: '',
    propertyType: 'Single Family',
    bedrooms: '',
    priceMin: '',
    priceMax: '',
    notes: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setAuthReady(true)
    }
    checkAuth()
  }, [])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const submit = async () => {
    if (!form.neighborhood.trim()) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/market-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const raw = await res.text()
      let data
      try { data = JSON.parse(raw) } catch { setError('Raw error: ' + raw.slice(0, 200)); setLoading(false); return }
      if (data.result) setResult(data.result)
      else setError((data.error || 'Something went wrong.') + (data.raw ? ' | RAW: ' + data.raw.slice(0, 300) : ''))
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' },
    label: { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(29,158,117,0.3)', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={s.page}>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)' }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--lw-text)' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
        </div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* PAGE HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📊</div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--lw-text)', margin: '0', letterSpacing: '-0.3px' }}>Market Snapshot</h1>
              <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0' }}>Instant market analysis for any neighborhood or property type</p>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <div style={{ ...s.card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>MARKET DETAILS</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={s.label}>Neighborhood / City *</label>
            <input value={form.neighborhood} onChange={set('neighborhood')} placeholder="e.g. Midtown Atlanta, GA" style={s.input} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={s.label}>Property Type</label>
              <select value={form.propertyType} onChange={set('propertyType')} style={s.input}>
                <option>Single Family</option>
                <option>Condo</option>
                <option>Townhouse</option>
                <option>Multi-Family</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Bedrooms</label>
              <input value={form.bedrooms} onChange={set('bedrooms')} placeholder="e.g. 3" style={s.input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={s.label}>Price Range — Min</label>
              <input value={form.priceMin} onChange={set('priceMin')} placeholder="e.g. $400,000" style={s.input} />
            </div>
            <div>
              <label style={s.label}>Price Range — Max</label>
              <input value={form.priceMax} onChange={set('priceMax')} placeholder="e.g. $600,000" style={s.input} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={s.label}>Additional Notes</label>
            <textarea value={form.notes} onChange={set('notes')} placeholder="e.g. Client is relocating, prefers turnkey condition, interested in school districts..." rows={3} style={{ ...s.input, resize: 'vertical' as const }} />
          </div>

          <button
            onClick={submit}
            disabled={loading || !form.neighborhood.trim()}
            style={{ width: '100%', padding: '14px', background: loading || !form.neighborhood.trim() ? 'rgba(29,158,117,0.35)' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading || !form.neighborhood.trim() ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(29,158,117,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
          >
            {loading ? '⏳ Generating market snapshot...' : '📊 Generate Market Snapshot'}
          </button>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...s.card, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(29,158,117,0.3)', borderTop: '2px solid #1D9E75', borderRadius: '50%', flexShrink: 0, animation: 'spin 0.9s linear infinite' }} />
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', margin: 0 }}>Analyzing market conditions — this takes a few seconds…</p>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, fontWeight: '500' }}>{error}</p>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {([
              { key: 'market_summary', label: 'Market Summary', icon: '🏘️', color: '#1D9E75', desc: 'Current conditions in this market' },
              { key: 'price_trends', label: 'Price Trends', icon: '📈', color: '#6366f1', desc: 'Recent pricing movement and trajectory' },
              { key: 'inventory_analysis', label: 'Inventory Analysis', icon: '🗂️', color: '#f59e0b', desc: 'Supply and days on market' },
              { key: 'buyer_seller_assessment', label: 'Buyer / Seller Assessment', icon: '⚖️', color: '#8b5cf6', desc: 'Who has leverage right now' },
            ] as const).map(card => (
              <div key={card.key} style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: `${card.color}18`, border: `1px solid ${card.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{card.icon}</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0' }}>{card.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0' }}>{card.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copy(card.key, result[card.key])}
                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '600', background: copied === card.key ? card.color : 'var(--lw-input)', color: copied === card.key ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === card.key ? card.color : 'var(--lw-border)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
                  >
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.85', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{result[card.key]}</p>
              </div>
            ))}

            {/* CLIENT EMAIL — special card */}
            <div style={{ ...s.card, border: '1px solid rgba(29,158,117,0.25)', background: 'linear-gradient(135deg, var(--lw-card) 0%, rgba(29,158,117,0.04) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✉️</div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0' }}>Client Email</p>
                    <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0' }}>Ready-to-send market update for your client</p>
                  </div>
                </div>
                <button
                  onClick={() => copy('client_email', result.client_email)}
                  style={{ padding: '7px 18px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: '700', background: copied === 'client_email' ? '#1D9E75' : 'rgba(29,158,117,0.1)', color: copied === 'client_email' ? '#fff' : '#1D9E75', borderColor: '#1D9E75', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
                >
                  {copied === 'client_email' ? '✓ Copied!' : '📋 Copy Email'}
                </button>
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.9', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{result.client_email}</p>
            </div>

            {/* RUN AGAIN */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ padding: '10px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', borderRadius: '10px', border: '1px solid var(--lw-border)', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
              >
                ↺ Run Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
