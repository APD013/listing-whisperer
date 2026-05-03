'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BuyerConsultationPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('consultation_outline')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    buyerName: '', budget: '', neighborhood: '', type: 'Single family',
    beds: '', baths: '', timeline: '', preApproval: 'Yes',
    mustHaves: '', dealBreakers: '', notes: '', agentName: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'buyer_consultation' })
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
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            if (bv.agentName) setForm(prev => ({ ...prev, agentName: bv.agentName }))
          } catch(e) {}
        }
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.budget && !form.neighborhood) { alert('Please enter at least a budget or desired neighborhood!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/buyer-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('consultation_outline')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const tabs = [
    { key: 'consultation_outline', label: 'Meeting Outline', icon: '📋' },
    { key: 'questions_to_ask', label: 'Questions to Ask', icon: '❓' },
    { key: 'needs_assessment', label: 'Needs Assessment', icon: '🎯' },
    { key: 'financing_talking_points', label: 'Financing Talk', icon: '💰' },
    { key: 'property_search_strategy', label: 'Search Strategy', icon: '🔍' },
    { key: 'followup_email', label: 'Follow-Up Email', icon: '📧' },
  ]

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }
  const labelStyle = { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }
  const cardStyle = { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* BACKGROUND GLOW */}
      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
          )}
        </div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(29,158,117,0.2)' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>🏡 Buyer Consultation Kit</h1>
          <p style={{ fontSize: '14px', color: '#a8f0d4', margin: '0', lineHeight: '1.6' }}>
            Walk into every buyer appointment fully prepared. Get a meeting outline, questions to ask, needs assessment, financing talking points, and a follow-up email — all tailored to your buyer.
          </p>
        </div>

        {/* FORM */}
        <div style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>APPOINTMENT DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Buyer Name</label>
              <input placeholder="John & Jane Smith" value={form.buyerName} onChange={e => setForm({ ...form, buyerName: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Budget / Price Range</label>
              <input placeholder="$600k – $750k" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Desired Neighborhood / Area</label>
            <input placeholder="Newport Beach, Costa Mesa, Irvine..." value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Property Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option>Single family</option>
                <option>Condo</option>
                <option>Townhome</option>
                <option>Luxury estate</option>
                <option>Multi-family</option>
                <option>Any</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Beds Needed</label>
              <input placeholder="3+" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Baths Needed</label>
              <input placeholder="2+" value={form.baths} onChange={e => setForm({ ...form, baths: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Timeline to Buy</label>
              <input placeholder="30 days, 3 months, flexible..." value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pre-Approved?</label>
              <select value={form.preApproval} onChange={e => setForm({ ...form, preApproval: e.target.value })} style={inputStyle}>
                <option>Yes</option>
                <option>In Progress</option>
                <option>No</option>
                <option>Cash buyer</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Must-Have Features</label>
            <input placeholder="Pool, home office, good schools, garage, yard..." value={form.mustHaves} onChange={e => setForm({ ...form, mustHaves: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Deal Breakers</label>
            <input placeholder="HOA, busy street, no garage, flood zone..." value={form.dealBreakers} onChange={e => setForm({ ...form, dealBreakers: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea placeholder="Anything else about the buyers or their situation..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
          </div>

          <div style={{ borderTop: '1px solid var(--lw-border)', paddingTop: '16px' }}>
            <button onClick={generate} disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)', transition: 'all 0.2s', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {loading ? '⏳ Preparing your consultation kit...' : '🏡 Generate Consultation Kit'}
            </button>
            <p style={{ fontSize: '11px', color: '#444', textAlign: 'center', marginTop: '8px' }}>Takes about 20–30 seconds · 6 sections generated</p>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏡</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Preparing your consultation kit...</p>
            <p style={{ color: '#6b7280', fontSize: '13px' }}>Creating meeting outline, buyer questions, needs assessment, and follow-up email...</p>
          </div>
        )}

        {/* RESULTS */}
        {outputs && (
          <div id="results" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 4px' }}>CONSULTATION KIT READY</p>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--lw-text)', margin: '0' }}>6 sections generated</h2>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: activeTab === t.key ? '#1D9E75' : 'var(--lw-border)',
                    background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'var(--lw-input)',
                    color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                    boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none',
                    fontWeight: activeTab === t.key ? '600' : '400',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--lw-input)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--lw-border)', position: 'relative', minHeight: '120px' }}>
              <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)', color: copied ? '#fff' : '#6b7280', border: '1px solid', borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)', cursor: 'pointer', fontWeight: '500', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--lw-text)', margin: '0', paddingRight: '90px' }}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="/follow-up" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                📧 Follow-Up Generator
              </a>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Dashboard
              </a>
              <button onClick={() => setOutputs(null)}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                🔄 New Consultation Kit
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
