'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import AskAiHint from '../components/AskAiHint'

import Navbar from '../components/Navbar'

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
    beds: '', baths: '', sqft: '', timeline: '', preApproval: 'Yes',
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
  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  const scrollToForm = () => {
    document.getElementById('buyer-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(99,102,241,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            Prepare for your buyer consultation in minutes.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Tell us about your buyer — we'll create a tailored consultation kit to help you understand their needs and win their trust.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            🏡 Prepare My Consultation Kit
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            6 sections generated · Takes about 20–30 seconds
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '👤', title: 'Describe your buyer', desc: "Tell us about the buyer's profile and financing status" },
              { step: '2', icon: '🎯', title: 'Add their goals and timeline', desc: 'Include must-haves, deal breakers, and when they need to move' },
              { step: '3', icon: '✅', title: 'Get your buyer consultation kit', desc: '6 tailored sections ready for your appointment' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <AskAiHint hint="Have a tricky buyer situation? Ask AI for guidance →" />
        <div id="buyer-form" style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 4px 32px rgba(99,102,241,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>APPOINTMENT DETAILS</p>

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
              <label style={labelStyle}>Sq Ft</label>
              <input placeholder="1,850" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} />
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

          <div>
            <label style={labelStyle}>Additional Notes</label>
            <textarea placeholder="Anything else about the buyers or their situation..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '👤', label: 'Buyer profile summary', desc: "A clear picture of who your buyer is and what they need" },
              { icon: '❓', label: 'Needs assessment questions', desc: 'Questions to ask to fully understand their priorities' },
              { icon: '📈', label: 'Market education talking points', desc: 'Key market context to set expectations early' },
              { icon: '💰', label: 'Financing overview', desc: 'Talking points around pre-approval and financing steps' },
              { icon: '📋', label: 'Next steps plan', desc: 'A clear action plan from consultation to offer' },
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
            background: loading ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.3)',
            transition: 'all 0.2s', marginBottom: '1.5rem',
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
          }}
        >
          {loading ? '⏳ Preparing your consultation kit...' : '🏡 Generate My Consultation Kit'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏡</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Preparing your consultation kit...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Creating meeting outline, buyer questions, needs assessment, and follow-up email...</p>
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
