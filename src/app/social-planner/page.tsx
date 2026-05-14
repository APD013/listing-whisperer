'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import { saveToWorkspace } from '../lib/workspace'
import SaveToWorkspace from '../components/SaveToWorkspace'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SocialPlannerPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [calendar, setCalendar] = useState<any>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceAddress, setWorkspaceAddress] = useState<string | null>(null)
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)
  const [workspaceAssets, setWorkspaceAssets] = useState<any>({})
  const [mlsOfferAccepted, setMlsOfferAccepted] = useState<boolean | null>(null)
  const [form, setForm] = useState({
    address: '',
    neighborhood: '',
    price: '',
    beds: '',
    features: '',
    tone: 'Warm & inviting',
    startDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'social_planner' })
    const params = new URLSearchParams(window.location.search)
    const wsId = params.get('workspace')
    if (wsId) setWorkspaceId(wsId)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
      if (wsId) {
        const { data: ws } = await supabase.from('listing_workspaces').select('*').eq('id', wsId).single()
        if (ws) {
          setWorkspaceAddress(ws.address)
          setWorkspaceAssets(ws.assets || {})
          setForm(prev => ({
            ...prev,
            address: ws.address || prev.address,
            neighborhood: ws.address || prev.neighborhood,
            price: ws.price || prev.price,
            beds: ws.beds ? String(ws.beds) : prev.beds,
          }))
        }
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.neighborhood && !form.features) { alert('Please fill in at least the neighborhood and features!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/social-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.calendar) {
        setCalendar(data.calendar)
        setActiveDay(0)
        setTimeout(() => document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth' }), 100)
        if (workspaceId) {
          await saveToWorkspace(workspaceId, 'social_posts', data.calendar)
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

  const getDayDate = (index: number) => {
    const date = new Date(form.startDate)
    date.setDate(date.getDate() + index)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const platforms = [
    { key: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c' },
    { key: 'facebook', label: 'Facebook', icon: '👥', color: '#1877f2' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0a66c2' },
    { key: 'twitter', label: 'X / Twitter', icon: '🐦', color: '#1da1f2' },
    { key: 'sms', label: 'SMS Blast', icon: '📱', color: '#10b981' },
  ]

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' }
  const labelStyle = { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.5px', textTransform: 'uppercase' as const }
  const cardStyle = { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' }
  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(225,48,108,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      {workspaceId && (
        <div style={{ background: 'rgba(29,158,117,0.08)', borderBottom: '1px solid rgba(29,158,117,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--lw-text)' }}>
          <span style={{ fontSize: '16px' }}>📁</span>
          <span>Working in workspace: <strong>{workspaceAddress || workspaceId}</strong> — social posts will be saved automatically.</span>
          <a href={`/workspace/${workspaceId}`} style={{ marginLeft: 'auto', color: '#1D9E75', fontWeight: '600', textDecoration: 'none', fontSize: '12px' }}>View Workspace →</a>
        </div>
      )}
      {workspaceId && workspaceAssets?.mls_description && mlsOfferAccepted === null && (
        <div style={{ background: 'rgba(29,158,117,0.08)', borderBottom: '1px solid rgba(29,158,117,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '13px', color: 'var(--lw-text)' }}>
          <span>💬 Use your saved MLS description as the base for this social calendar?</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => { setForm(prev => ({ ...prev, features: String(workspaceAssets.mls_description).slice(0, 600) })); setMlsOfferAccepted(true) }} style={{ padding: '6px 16px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Yes</button>
            <button onClick={() => setMlsOfferAccepted(false)} style={{ padding: '6px 14px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>No</button>
          </div>
        </div>
      )}
      {workspaceId && workspaceAssets?.social_posts && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span>📋</span>
          <span style={{ fontWeight: '600', color: '#f59e0b' }}>This workspace already has Social Posts. Generate again to update it.</span>
        </div>
      )}

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#e1306c,#f59e0b)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(225,48,108,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            SOCIAL CONTENT PLANNER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            📅 7 days of social content — ready in 60 seconds.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>
            Tell us about your listing — get a full week of platform-ready social media posts.
          </p>
          <button
            onClick={() => document.getElementById('social-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            📅 Create My Social Calendar
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '🏠', title: 'Enter listing details', desc: 'Address, price, beds, features, and your campaign start date' },
              { s: '2', icon: '📱', title: 'Choose your platforms', desc: 'We generate for Instagram, Facebook, LinkedIn, Twitter, and SMS' },
              { s: '3', icon: '📅', title: 'Get your 7-day social calendar', desc: '35 ready-to-post pieces of content — one per platform per day' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#e1306c,#f59e0b)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="social-form" style={{ ...cardStyle, border: '1px solid rgba(225,48,108,0.18)', boxShadow: '0 4px 32px rgba(225,48,108,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>LISTING DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Property Address</label>
              <input placeholder="123 Main St" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Neighborhood / City</label>
              <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Beds / Baths</label>
              <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Key Features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage..." value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Tone</label>
              <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} style={inputStyle}>
                <option>Warm & inviting</option>
                <option>Luxury & aspirational</option>
                <option>Modern & minimal</option>
                <option>Family-friendly</option>
                <option>Investment-focused</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Campaign Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '💡', label: '7 daily post ideas', desc: 'One theme per day to keep content fresh all week' },
              { icon: '📝', label: 'Platform-specific captions', desc: 'Instagram, Facebook, LinkedIn, Twitter, and SMS' },
              { icon: '#️⃣', label: 'Hashtag sets', desc: 'Relevant hashtags per platform and listing type' },
              { icon: '📖', label: 'Story content', desc: 'Short-form copy optimized for Stories and Reels' },
              { icon: '💬', label: 'Engagement prompts', desc: 'Questions and CTAs to drive comments and shares' },
              { icon: '📅', label: 'Posting schedule', desc: 'Best times and days to post for maximum reach' },
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
          style={{ width: '100%', padding: '15px', background: loading ? '#f59e0b' : 'linear-gradient(135deg,#e1306c,#f59e0b)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 28px rgba(225,48,108,0.3)', transition: 'all 0.2s', marginBottom: '8px' }}>
          {loading ? '⏳ Building your content calendar...' : '📅 Generate 7-Day Social Calendar'}
        </button>
        <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginBottom: '1.5rem' }}>7 days · 5 platforms · 35 posts total</p>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📅</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '600', marginBottom: '6px' }}>Building your 7-day content calendar...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Creating posts for Instagram, Facebook, LinkedIn, Twitter and SMS...</p>
          </div>
        )}

        {/* CALENDAR */}
        {calendar && (
          <div id="calendar">
            {workspaceToast && (
              <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '12px', fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>
                {workspaceToast}
              </div>
            )}
            <div style={{ ...cardStyle, border: '1px solid rgba(225,48,108,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#e1306c', letterSpacing: '1px', marginBottom: '16px' }}>📅 7-DAY CONTENT CALENDAR</p>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {calendar.days.map((day: any, i: number) => (
                  <button key={i} onClick={() => setActiveDay(i)}
                    style={{
                      fontSize: '11px', padding: '6px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                      borderColor: activeDay === i ? '#e1306c' : 'var(--lw-border)',
                      background: activeDay === i ? 'rgba(225,48,108,0.1)' : 'var(--lw-input)',
                      color: activeDay === i ? '#e1306c' : 'var(--lw-text-muted)',
                      fontWeight: activeDay === i ? '600' : '400'
                    }}>
                    Day {i + 1} — {getDayDate(i)}
                  </button>
                ))}
              </div>

              {calendar.days[activeDay] && (
                <div>
                  <div style={{ marginBottom: '12px', padding: '10px 14px', background: 'rgba(225,48,108,0.06)', borderRadius: '10px', border: '1px solid rgba(225,48,108,0.1)' }}>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#e1306c', margin: '0 0 2px' }}>🎯 Day {activeDay + 1} Theme</p>
                    <p style={{ fontSize: '13px', color: 'var(--lw-text)', margin: '0' }}>{calendar.days[activeDay].theme}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {platforms.map(platform => (
                      <div key={platform.key} style={{ background: 'var(--lw-input)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--lw-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '16px' }}>{platform.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: platform.color }}>{platform.label}</span>
                          </div>
                          <button onClick={() => {
                            navigator.clipboard.writeText(calendar.days[activeDay][platform.key] || '')
                            setCopied(`${activeDay}-${platform.key}`)
                            setTimeout(() => setCopied(null), 2000)
                          }}
                            style={{
                              padding: '4px 12px', borderRadius: '6px', border: '1px solid', fontSize: '11px', cursor: 'pointer', fontWeight: '500',
                              background: copied === `${activeDay}-${platform.key}` ? platform.color : 'var(--lw-input)',
                              color: copied === `${activeDay}-${platform.key}` ? '#fff' : 'var(--lw-text-muted)',
                              borderColor: copied === `${activeDay}-${platform.key}` ? platform.color : 'var(--lw-border)'
                            }}>
                            {copied === `${activeDay}-${platform.key}` ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>
                          {calendar.days[activeDay][platform.key] || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Back to Dashboard
              </a>
              <button onClick={() => { setCalendar(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}>
                🔄 New Calendar
              </button>
            </div>
            {!workspaceId && userId && (
              <SaveToWorkspace
                userId={userId}
                assetKey="social_posts"
                assetValue={calendar}
                onSaved={(address) => {
                  setWorkspaceToast(`✅ Saved to ${address} workspace`)
                  setTimeout(() => setWorkspaceToast(null), 3500)
                }}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
