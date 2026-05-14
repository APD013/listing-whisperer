'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import Navbar from '../components/Navbar'
import jsPDF from 'jspdf'
import { pdfHeader, pdfSections } from '../lib/pdfStyles'
import { saveToWorkspace } from '../lib/workspace'
import SaveToWorkspace from '../components/SaveToWorkspace'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LaunchKitPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [form, setForm] = useState({
    type: 'Single family', beds: '', baths: '', sqft: '', price: '',
    neighborhood: '', city: '', state: '', features: '', notes: ''
  })
  const [launchPlan, setLaunchPlan] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('day1')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceAddress, setWorkspaceAddress] = useState<string | null>(null)
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('launch_kits')
      .select('id, address, created_at, outputs')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setHistory(data)
    setHistoryLoaded(true)
  }

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'launch_kit' })
    const wsId = new URLSearchParams(window.location.search).get('workspace')
    if (wsId) setWorkspaceId(wsId)
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
          try { setBrandVoice(JSON.parse(profile.brand_voice)) } catch(e) {}
        }
      } else {
        setPlanLoaded(true)
      }
      loadHistory(user.id)
      if (wsId) {
        const { data: ws } = await supabase.from('listing_workspaces').select('address').eq('id', wsId).single()
        if (ws) setWorkspaceAddress(ws.address)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.neighborhood && !form.features) { alert('Please fill in at least the neighborhood and features!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/launch-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form, userId })
      })
      const data = await res.json()
      if (data.plan) {
        setLaunchPlan(data.plan)
        setActiveTab('day1')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
        await supabase.from('launch_kits').insert({
          user_id: userId,
          address: form.neighborhood || form.city || 'Untitled',
          form_data: form,
          outputs: data.plan
        })
        if (userId) loadHistory(userId)
        if (workspaceId) {
          await saveToWorkspace(workspaceId, 'launch_kit', data.plan.day1 || JSON.stringify(data.plan).slice(0, 500))
          const toast = `✅ Saved to ${workspaceAddress || 'workspace'}`
          setWorkspaceToast(toast)
          setTimeout(() => setWorkspaceToast(null), 3500)
        }
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const downloadPDF = () => {
    if (!launchPlan) return
    const doc = new jsPDF()
    const addr = form.neighborhood || form.city || '7-Day Launch Kit'
    const y = pdfHeader(doc, '7-Day Launch Kit', addr)
    pdfSections(doc, [
      { label: 'Day 1 — Launch Day', content: launchPlan.day1 || '' },
      { label: 'Day 2 — Follow Up', content: launchPlan.day2 || '' },
      { label: 'Day 3 — Mid Week', content: launchPlan.day3 || '' },
      { label: 'Day 4 — Spotlight', content: launchPlan.day4 || '' },
      { label: 'Day 5 — Open House', content: launchPlan.day5 || '' },
      { label: 'Day 6 — Weekend', content: launchPlan.day6 || '' },
      { label: 'Day 7 — Final Push', content: launchPlan.day7 || '' },
      { label: 'Email Sequence', content: launchPlan.email_sequence || '' },
      { label: 'Social Calendar', content: launchPlan.social_calendar || '' },
      { label: 'Pro Tips', content: launchPlan.pro_tips || '' },
    ], y, brandVoice?.agentName ? { agentName: brandVoice.agentName } : null)
    doc.save(`LaunchKit-${addr.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
  }

  const tabs = [
    { key: 'day1', label: 'Day 1', icon: '📅', sublabel: 'Launch Day' },
    { key: 'day2', label: 'Day 2', icon: '📅', sublabel: 'Follow Up' },
    { key: 'day3', label: 'Day 3', icon: '📅', sublabel: 'Mid Week' },
    { key: 'day4', label: 'Day 4', icon: '📅', sublabel: 'Spotlight' },
    { key: 'day5', label: 'Day 5', icon: '📅', sublabel: 'Open House' },
    { key: 'day6', label: 'Day 6', icon: '📅', sublabel: 'Weekend' },
    { key: 'day7', label: 'Day 7', icon: '📅', sublabel: 'Final Push' },
    { key: 'email_sequence', label: 'Emails', icon: '📧', sublabel: '3-Part Sequence' },
    { key: 'social_calendar', label: 'Social', icon: '📱', sublabel: 'Full Calendar' },
    { key: 'pro_tips', label: 'Pro Tips', icon: '💡', sublabel: 'Expert Advice' },
  ]

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' }
  const labelStyle = { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }
  const cardStyle = { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' }
  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(217,119,6,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {workspaceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '10px', padding: '10px 16px', marginBottom: '1rem' }}>
            <span>📁</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75' }}>
              Saving to workspace{workspaceAddress ? `: ${workspaceAddress}` : ''}
            </span>
            <a href={`/workspace/${workspaceId}`} style={{ marginLeft: 'auto', fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>View Workspace →</a>
          </div>
        )}

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(245,158,11,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            7-DAY LAUNCH KIT
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            🚀 Launch your listing with a 7-day marketing plan.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>
            Enter your listing details — get a complete launch strategy with daily action items.
          </p>
          <button
            onClick={() => document.getElementById('launch-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            🚀 Build My Launch Plan
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '🏠', title: 'Enter listing details', desc: 'Property type, beds, price, neighborhood, and key features' },
              { s: '2', icon: '🎯', title: 'Set your launch goals', desc: 'Agent notes, open house date, urgency — all optional' },
              { s: '3', icon: '📅', title: 'Get your 7-day launch plan', desc: 'Daily social posts, email sequences, and pro tips — all done' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="launch-form" style={{ ...cardStyle, border: '1px solid rgba(245,158,11,0.18)', boxShadow: '0 4px 32px rgba(245,158,11,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>LISTING DETAILS</p>

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
              <label style={labelStyle}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Neighborhood / City</label>
            <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={inputStyle} />
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

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Best Features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage..." value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Agent Notes (optional)</label>
            <textarea placeholder="Open house date, special story, urgency..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '📅', label: 'Day-by-day action plan', desc: '7 days of specific tasks and content for your listing' },
              { icon: '📱', label: 'Social media schedule', desc: 'Daily posts for Instagram, Facebook, and more' },
              { icon: '📧', label: 'Email campaign', desc: '3-part email sequence to your buyer list' },
              { icon: '🏡', label: 'Open house strategy', desc: 'Promotion plan and day-of talking points' },
              { icon: '🔄', label: 'Follow-up sequence', desc: 'Post-showing follow-up messages and next steps' },
              { icon: '📣', label: 'PR talking points', desc: 'Key messages for networking and outreach' },
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
        <button onClick={generate} disabled={loading}
          style={{ width: '100%', padding: '15px', background: loading ? '#d97706' : 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 28px rgba(245,158,11,0.35)', transition: 'all 0.2s', marginBottom: '8px' }}>
          {loading ? '⏳ Building your launch plan...' : '🚀 Generate 7-Day Launch Kit'}
        </button>
        <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>Takes about 20-30 seconds · 10 sections generated</p>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚀</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Building your 7-day launch plan...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Creating daily social posts, email sequences, and pro tips tailored to your listing...</p>
          </div>
        )}

        {/* RESULTS */}
        {launchPlan && (
          <>
          {workspaceToast && (
            <div style={{ display:'flex',alignItems:'center',gap:'8px',background:'rgba(29,158,117,0.1)',border:'1px solid rgba(29,158,117,0.25)',borderRadius:'8px',padding:'8px 14px',marginBottom:'12px',fontSize:'13px',fontWeight:'600',color:'#1D9E75' }}>
              {workspaceToast}
            </div>
          )}
          <div id="results" style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', letterSpacing: '1px', margin: '0 0 4px' }}>LAUNCH KIT READY</p>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--lw-text)', margin: '0' }}>🎉 Your 7-Day Plan is ready!</h2>
              </div>
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '500' }}>10 sections</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.25rem' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    fontSize: '12px', padding: '6px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: activeTab === t.key ? '#f59e0b' : 'var(--lw-border)',
                    background: activeTab === t.key ? 'rgba(245,158,11,0.1)' : 'var(--lw-input)',
                    color: activeTab === t.key ? '#f59e0b' : 'var(--lw-text-muted)',
                    boxShadow: activeTab === t.key ? '0 0 12px rgba(245,158,11,0.2)' : 'none',
                    fontWeight: activeTab === t.key ? '600' : '400'
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label} — {tabs.find(t => t.key === activeTab)?.sublabel}
              </span>
            </div>

            <div style={{ background: 'var(--lw-input)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--lw-border)', position: 'relative', minHeight: '120px' }}>
              <button onClick={() => { navigator.clipboard.writeText(launchPlan[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: copied ? '#f59e0b' : 'var(--lw-input)', color: copied ? '#fff' : 'var(--lw-text-muted)', border: '1px solid', borderColor: copied ? '#f59e0b' : 'var(--lw-border)', cursor: 'pointer', fontWeight: '500' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--lw-text)', margin: '0', paddingRight: '90px' }}>
                {launchPlan[activeTab] || ''}
              </p>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Generate Full Copy Kit
              </a>
              <button onClick={downloadPDF}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                📄 Download PDF
              </button>
              <button onClick={() => setLaunchPlan(null)}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}>
                🔄 New Launch Kit
              </button>
            </div>
          </div>
          {!workspaceId && userId && launchPlan && (
            <SaveToWorkspace
              userId={userId}
              assetKey="launch_kit"
              assetValue={launchPlan.day1 || JSON.stringify(launchPlan).slice(0, 500)}
              onSaved={addr => { const t = `✅ Saved to ${addr} workspace`; setWorkspaceToast(t); setTimeout(() => setWorkspaceToast(null), 3500) }}
            />
          )}
          </>
        )}

        {/* PAST LAUNCH KITS */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={sectionHeadStyle}>Past Launch Kits</p>
          {!historyLoaded ? null : history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--lw-text-muted)', fontSize: '13px', padding: '1.5rem' }}>
              Your past launch kits will appear here.
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
                        setLaunchPlan(item.outputs)
                        setActiveTab('day1')
                        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
                      }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this launch kit?')) return
                        await supabase.from('launch_kits').delete().eq('id', item.id)
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
