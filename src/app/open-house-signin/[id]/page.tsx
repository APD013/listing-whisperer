'use client'
import { useState, use } from 'react'

const SOURCES = [
  'Drive-by',
  'Zillow/Realtor.com',
  'Friend/Referral',
  'Agent',
  'Social Media',
  'Other',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 18px',
  background: 'var(--lw-input)',
  border: '1px solid var(--lw-border)',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '500',
  color: 'var(--lw-text)',
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: 'var(--font-plus-jakarta), sans-serif',
  appearance: 'none',
  WebkitAppearance: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: '700',
  color: 'var(--lw-text-muted)',
  display: 'block',
  marginBottom: '8px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

export default function OpenHouseSignInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [sourceDetail, setSourceDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/open-house-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, source_detail: sourceDetail, listing_id: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.03em' }}>
            Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--lw-text-muted)', marginTop: '4px' }}>Open House Sign-In</div>
        </div>

        <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid var(--lw-border)', padding: '2.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '52px', marginBottom: '1rem' }}>🏡</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>Thanks for stopping by!</h2>
              <p style={{ fontSize: '16px', color: 'var(--lw-text-muted)', margin: 0, lineHeight: '1.6' }}>
                We're glad you visited today. The agent will be in touch soon — enjoy the rest of your tour!
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome!</h1>
              <p style={{ fontSize: '15px', color: 'var(--lw-text-muted)', margin: '0 0 2rem', lineHeight: '1.5' }}>
                Sign in to learn more about this property and get updates from the agent.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>How did you hear about this property?</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={sourceDetail}
                      onChange={e => setSourceDetail(e.target.value)}
                      style={{ ...inputStyle, paddingRight: '44px', cursor: 'pointer' }}
                    >
                      <option value="">Select one...</option>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--lw-text-muted)' }}>
                      ▾
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '14px', color: '#ef4444', margin: 0, fontWeight: '500' }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  marginTop: '28px',
                  width: '100%',
                  padding: '18px',
                  background: loading ? '#085041' : '#1D9E75',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(29,158,117,0.35)',
                  transition: 'all 0.2s',
                  letterSpacing: '0.01em',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                {loading ? 'Submitting...' : 'Sign In →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--lw-text-muted)', marginTop: '16px', marginBottom: 0 }}>
                Your info is only shared with the listing agent.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
