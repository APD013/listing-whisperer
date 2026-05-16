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

export default function ReferralRequestPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    agentName: '',
    clientName: '',
    property: '',
    city: '',
    state: '',
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
      if (isDemoUser(user)) setIsDemo(true)
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
Property: ${form.property}${form.city ? ' in ' + form.city : ''}${form.state ? ', ' + form.state : ''}
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
      if (isDemo) markDemoGenerationUsed('referral-request')
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

  if (isDemo && hasUsedDemoGeneration() && getDemoGenerationTool() !== 'referral-request') return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <DemoLockedCard reason="limit_reached" usedTool={getDemoGenerationTool()} />
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <div style={{position:'fixed',top:'10%',right:'8%',width:'380px',height:'380px',background:'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'15%',left:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(5,150,105,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

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
        <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(16,185,129,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>REFERRAL SCRIPTS</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Turn every closing into your next listing.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Generate personalized referral requests for email, text, phone, and LinkedIn — in one click.</p>
          <button onClick={() => document.getElementById('referral-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            Generate My Scripts →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '🤝', title: 'Enter client details', desc: 'Add your client\'s name, the property, and closing date.' },
              { s: '2', icon: '✍️', title: 'Add the context', desc: 'Choose the relationship type and add any personal notes.' },
              { s: '3', icon: '📬', title: 'Get 4 ready-to-send scripts', desc: 'Email, text, phone, and LinkedIn — personalized to each.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="referral-form" style={cardStyle}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>CLIENT DETAILS</p>

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

          <div>
            <label style={labelStyle}>Additional Notes</label>
            <input placeholder="e.g. First time buyers, referral from past client, multiple offers..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '📧', label: 'Email Script', desc: 'Warm, personal email with subject line — ready to send.' },
              { icon: '💬', label: 'Text Message', desc: 'Short, casual text to copy and send from your phone.' },
              { icon: '📞', label: 'Phone Script', desc: 'Natural call script — read before you dial.' },
              { icon: '💼', label: 'LinkedIn Post', desc: 'Professional post celebrating the closing.' },
              { icon: '🎯', label: 'Personalized Touch', desc: 'Each script tailored to your relationship and the closing.' },
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
        <button onClick={generate} disabled={loading || !form.clientName.trim()}
          style={{ width: '100%', padding: '16px', background: loading || !form.clientName.trim() ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading || !form.clientName.trim() ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 40px rgba(16,185,129,0.35)', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '1.5rem' }}>
          {loading ? 'Generating referral scripts...' : '🤝 Generate Referral Scripts'}
        </button>

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
            <ToolHandoff from="referral-request" handoffs={[
              { emoji: '👥', text: 'Track your clients & leads', cta: 'Leads & CRM', href: '/leads' },
            ]} />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
