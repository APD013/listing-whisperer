'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ReferralRequestPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    agentName: '',
    clientName: '',
    property: '',
    closingDate: '',
    relationship: 'Buyer',
    method: 'Email',
    notes: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'referral_request' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('plan, brand_voice, full_name').eq('id', user.id).single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            setForm(prev => ({ ...prev, agentName: bv.agentName || profile.full_name || '' }))
          } catch(e) {}
        }
      } else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.clientName) { alert('Please enter a client name!'); return }
    setLoading(true)
    setOutput(null)
    try {
      const prompt = `You are a real estate agent asking a past client for referrals. Generate referral request scripts.

Agent: ${form.agentName}
Client: ${form.clientName}
Property: ${form.property}
Closing Date: ${form.closingDate}
Relationship: ${form.relationship} client
Additional Notes: ${form.notes}

Generate 4 scripts and return ONLY a JSON object with no other text:
{
  "email_script": "A warm, personal email asking for referrals (3-4 paragraphs, subject line included at the top)",
  "text_script": "A short, casual text message asking for referrals (2-3 sentences max)",
  "phone_script": "A natural phone call script with opening, ask, and closing (conversational tone)",
  "linkedin_post": "A LinkedIn post celebrating the closing and subtly asking for referrals (professional tone, 3-4 sentences)"
}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          currentPage: '/referral-request'
        })
      })
      const data = await res.json()
      const text = data.message || ''
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        setOutput(parsed)
      } catch(e) {
        setOutput({ email_script: text, text_script: '', phone_script: '', linkedin_post: '' })
      }
      trackEvent('referral_request_generated', { relationship: form.relationship })
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

  if (!planLoaded) return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(29,158,117,0.3)', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

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

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '20px', padding: '1.75rem 2rem', marginBottom: '1.75rem', boxShadow: '0 8px 32px rgba(16,185,129,0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤝</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Referral Request Generator</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.6' }}>
            Turn every closing into your next listing. Generate personalized referral requests for email, text, phone, and LinkedIn.
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>CLIENT DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><label style={labelStyle}>Your Name</label><input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>Client Name *</label><input placeholder="John & Mary Smith" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} style={inputStyle} /></div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Property Address</label>
            <input placeholder="123 Main St, Newport Beach, CA" value={form.property} onChange={e => setForm({ ...form, property: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Closing Date</label>
              <input type="date" value={form.closingDate} onChange={e => setForm({ ...form, closingDate: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Relationship</label>
              <select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })} style={inputStyle}>
                <option>Buyer</option>
                <option>Seller</option>
                <option>Both</option>
                <option>Investor</option>
                <option>Renter</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Additional Notes</label>
            <input placeholder="e.g. First time buyers, referral from past client, multiple offers..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
          </div>

          <button onClick={generate} disabled={loading || !form.clientName.trim()}
            style={{ width: '100%', padding: '13px', background: loading || !form.clientName.trim() ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading || !form.clientName.trim() ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            {loading ? 'Generating referral scripts...' : '🤝 Generate Referral Scripts'}
          </button>
        </div>

        {/* OUTPUT */}
        {output && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '1px', margin: '0 0 4px' }}>✅ REFERRAL SCRIPTS READY</p>

            {[
              { key: 'email_script', label: '📧 Email Script', desc: 'Personal email with subject line — ready to send' },
              { key: 'text_script', label: '💬 Text Message', desc: 'Short, casual text — copy and send from your phone' },
              { key: 'phone_script', label: '📞 Phone Script', desc: 'Natural call script — read before you dial' },
              { key: 'linkedin_post', label: '💼 LinkedIn Post', desc: 'Professional post celebrating the closing' },
            ].map(card => output[card.key] && (
              <div key={card.key} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: '0 0 2px' }}>{card.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: 0 }}>{card.desc}</p>
                  </div>
                  <button onClick={() => copy(card.key, output[card.key])}
                    style={{ padding: '5px 14px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                      background: copied === card.key ? '#10b981' : 'var(--lw-input)',
                      color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',
                      borderColor: copied === card.key ? '#10b981' : 'var(--lw-border)' }}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '13px', lineHeight: '1.85', color: 'var(--lw-text)', margin: 0, whiteSpace: 'pre-wrap' }}>{output[card.key]}</p>
              </div>
            ))}

            <button onClick={() => { setOutput(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{ padding: '11px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', color: 'var(--lw-text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              ↺ Generate New Request
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}