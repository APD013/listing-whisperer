'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import AskAiHint from '../components/AskAiHint'
import Navbar from '../components/Navbar'
import jsPDF from 'jspdf'
import { pdfHeader, pdfSections } from '../lib/pdfStyles'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SellerPrepPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('meeting_outline')
  const [copied, setCopied] = useState(false)
  const [showComps, setShowComps] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const [form, setForm] = useState({
    address: '', city: '', state: '', neighborhood: '', type: 'Single family', beds: '', baths: '',
    sqft: '', estimatedPrice: '', sellerGoals: '', timeframe: '',
    propertyCondition: 'Good', notes: '', agentName: '',
    comps: [
      { address: '', salePrice: '', beds: '', baths: '', sqft: '', dom: '' },
      { address: '', salePrice: '', beds: '', baths: '', sqft: '', dom: '' },
      { address: '', salePrice: '', beds: '', baths: '', sqft: '', dom: '' },
    ],
  })

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('seller_preps')
      .select('id, address, created_at, outputs')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setHistory(data)
    setHistoryLoaded(true)
  }

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'seller_prep' })
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
      loadHistory(user.id)
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.address && !form.neighborhood) { alert('Please enter at least the property address or neighborhood!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/seller-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('meeting_outline')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
        await supabase.from('seller_preps').insert({
          user_id: userId,
          address: form.address || form.neighborhood || 'Untitled',
          form_data: form,
          outputs: data.outputs
        })
        if (userId) loadHistory(userId)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const updateComp = (index: number, field: string, value: string) => {
    setForm(prev => {
      const comps = [...prev.comps]
      comps[index] = { ...comps[index], [field]: value }
      return { ...prev, comps }
    })
  }

  const downloadPDF = () => {
    if (!outputs) return
    const doc = new jsPDF()
    const addr = form.address || form.neighborhood || 'Untitled'
    const y = pdfHeader(doc, 'Seller Prep Package', addr)
    pdfSections(doc, [
      { label: 'Meeting Outline', content: outputs.meeting_outline || '' },
      { label: 'Talking Points', content: outputs.talking_points || '' },
      { label: 'Questions to Ask', content: outputs.seller_questions || '' },
      { label: 'Marketing Preview', content: outputs.marketing_preview || '' },
      { label: 'Selling Angles', content: outputs.selling_angles || '' },
      { label: 'Follow-Up Email', content: outputs.followup_email || '' },
      { label: 'Presentation Intro', content: outputs.presentation_intro || '' },
      { label: 'CMA & Pricing', content: outputs.cma_analysis || '' },
      { label: 'Objection Responses', content: outputs.objection_responses || '' },
    ], y, { agentName: form.agentName })
    doc.save(`SellerPrep-${addr.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
  }

  const tabs = [
    { key: 'meeting_outline', label: 'Meeting Outline', icon: '📋' },
    { key: 'talking_points', label: 'Talking Points', icon: '🎤' },
    { key: 'seller_questions', label: 'Questions to Ask', icon: '❓' },
    { key: 'marketing_preview', label: 'Marketing Preview', icon: '📣' },
    { key: 'selling_angles', label: 'Selling Angles', icon: '🎯' },
    { key: 'followup_email', label: 'Follow-Up Email', icon: '📧' },
    { key: 'presentation_intro', label: 'Presentation Intro', icon: '📊' },
    { key: 'cma_analysis', label: 'CMA & Pricing', icon: '📈' },
    { key: 'objection_responses', label: 'Objection Responses', icon: '🛡️' },
  ]

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' }
  const labelStyle = { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }
  const cardStyle = { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' }
  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  const scrollToForm = () => {
    document.getElementById('seller-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* ambient glow */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(139,92,246,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            Walk into your next listing appointment fully prepared.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Answer a few questions about the seller and property — we'll create everything you need to win the listing.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            📋 Prepare My Listing Kit
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            9 sections generated · Takes about 20–30 seconds
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '📋', title: 'Enter seller details', desc: "Tell us about the seller's goals, timeline, and motivations" },
              { step: '2', icon: '🏠', title: 'Add property information', desc: 'Include address, type, price expectations, and condition' },
              { step: '3', icon: '✅', title: 'Get your complete prep kit', desc: '7 tailored sections ready to use in your appointment' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <AskAiHint hint="Need help with a tough seller situation? Ask AI →" />
        <div id="seller-form" style={{ ...cardStyle, border: '1px solid rgba(139,92,246,0.18)', boxShadow: '0 4px 32px rgba(139,92,246,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>APPOINTMENT DETAILS</p>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Property Address</label>
            <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Property Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
                <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Beds</label>
              <input placeholder="3" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Baths</label>
              <input placeholder="2" value={form.baths || ''} onChange={e => setForm({ ...form, baths: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sq Ft</label>
              <input placeholder="1,850" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Est. Price Range</label>
              <input placeholder="$800k - $900k" value={form.estimatedPrice} onChange={e => setForm({ ...form, estimatedPrice: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Condition</label>
              <select value={form.propertyCondition} onChange={e => setForm({ ...form, propertyCondition: e.target.value })} style={inputStyle}>
                <option>Excellent</option><option>Good</option><option>Average</option><option>Needs work</option><option>Unknown</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Seller Goals</label>
            <input placeholder="Downsizing, relocating, quick sale, maximize price..." value={form.sellerGoals} onChange={e => setForm({ ...form, sellerGoals: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Timeframe</label>
              <input placeholder="ASAP, 30 days, flexible..." value={form.timeframe} onChange={e => setForm({ ...form, timeframe: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({ ...form, agentName: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Additional Notes</label>
            <textarea placeholder="Anything else you know about the property or seller..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
          </div>
        </div>

        {/* COMPARABLE SALES */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowComps(!showComps)}
            style={{
              width: '100%', padding: '13px 16px',
              background: 'var(--lw-card)', border: '1px solid var(--lw-border)',
              borderRadius: '12px', fontSize: '13px', fontWeight: '600',
              color: 'var(--lw-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            <span>{showComps ? '▾' : '▸'}</span>
            <span>{showComps ? '− Hide Comparable Sales' : '+ Add Comparable Sales'}</span>
            <span style={{ fontSize: '11px', color: 'var(--lw-text-muted)', fontWeight: '400', marginLeft: 'auto', opacity: 0.7 }}>Optional · Improves CMA analysis</span>
          </button>
          {showComps && (
            <div style={{ ...cardStyle, marginTop: '8px', marginBottom: '0', border: '1px solid rgba(139,92,246,0.18)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '1px', margin: '0 0 4px' }}>COMPARABLE SALES</p>
              <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0 0 16px', lineHeight: '1.5' }}>
                Add recent sold comps to get a pricing narrative and objection responses
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {form.comps.map((comp, i) => (
                  <div key={i}>
                    <p style={{ ...labelStyle, marginBottom: '7px' }}>Comp {i + 1}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                      <input placeholder="Address" value={comp.address} onChange={e => updateComp(i, 'address', e.target.value)} style={inputStyle} />
                      <input placeholder="Sale Price" value={comp.salePrice} onChange={e => updateComp(i, 'salePrice', e.target.value)} style={inputStyle} />
                      <input placeholder="3" value={comp.beds} onChange={e => updateComp(i, 'beds', e.target.value)} style={inputStyle} />
                      <input placeholder="2" value={comp.baths} onChange={e => updateComp(i, 'baths', e.target.value)} style={inputStyle} />
                      <input placeholder="Sqft" value={comp.sqft} onChange={e => updateComp(i, 'sqft', e.target.value)} style={inputStyle} />
                      <input placeholder="Days on Market" value={comp.dom} onChange={e => updateComp(i, 'dom', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '👤', label: 'Seller situation summary', desc: "A clear overview of the seller's goals and motivations" },
              { icon: '💰', label: 'Pricing strategy talking points', desc: 'Data-backed price positioning for your appointment' },
              { icon: '🛡️', label: 'Objection responses', desc: 'Ready-made answers to the most common seller pushback' },
              { icon: '📊', label: 'Listing presentation outline', desc: 'A structured walkthrough for your appointment' },
              { icon: '📧', label: 'Follow-up plan', desc: 'A complete follow-up sequence after the meeting' },
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
            background: loading ? '#6366f1' : 'linear-gradient(135deg,#8b5cf6,#6366f1)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 0 28px rgba(139,92,246,0.3)',
            transition: 'all 0.2s', marginBottom: '1.5rem',
          }}
        >
          {loading ? '⏳ Preparing your meeting kit...' : '📋 Generate My Prep Kit'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Preparing your meeting kit...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Creating meeting outline, talking points, seller questions, and follow-up email...</p>
          </div>
        )}

        {/* RESULTS */}
        {outputs && (
          <div id="results" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 4px' }}>MEETING PREP KIT READY</p>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--lw-text)', margin: '0' }}>{tabs.length} sections generated</h2>
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
                    fontWeight: activeTab === t.key ? '600' : '400' }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--lw-input)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--lw-border)', position: 'relative', minHeight: '120px' }}>
              <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)', color: copied ? '#fff' : '#6b7280', border: '1px solid', borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)', cursor: 'pointer', fontWeight: '500' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--lw-text)', margin: '0', paddingRight: '90px' }}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Generate Full Marketing Kit
              </a>
              <a href="/snap-start" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', textDecoration: 'none', fontWeight: '500' }}>
                📸 Snap &amp; Start On-Site
              </a>
              <button onClick={downloadPDF}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}>
                📄 Download PDF
              </button>
              <button onClick={() => setOutputs(null)}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                🔄 New Prep Kit
              </button>
            </div>
          </div>
        )}

        {/* PAST PREP KITS */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={sectionHeadStyle}>Past Prep Kits</p>
          {!historyLoaded ? null : history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--lw-text-muted)', fontSize: '13px', padding: '1.5rem' }}>
              Your past prep kits will appear here.
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
                      onClick={() => {
                        setOutputs(item.outputs)
                        setActiveTab('meeting_outline')
                        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
                      }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this prep kit?')) return
                        await supabase.from('seller_preps').delete().eq('id', item.id)
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
