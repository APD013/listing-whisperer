'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FollowUpSequencePage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sequence, setSequence] = useState<any[] | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '',
    situationType: 'After a showing',
    notes: '',
    touchpoints: '5',
    tone: 'Warm & Conversational',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: seqs } = await supabase
        .from('follow_up_sequences')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (seqs) setHistory(seqs)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, brand_voice')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        if (profile.brand_voice) {
          try {
            const bv = typeof profile.brand_voice === 'string'
              ? JSON.parse(profile.brand_voice)
              : profile.brand_voice
            setBrandVoice(bv)
          } catch (e) {}
        }
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.contactName.trim()) {
      alert('Please enter the contact name.')
      return
    }
    setLoading(true)
    setSequence(null)
    try {
      const res = await fetch('/api/follow-up-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: form.contactName,
          situationType: form.situationType,
          notes: form.notes,
          touchpoints: form.touchpoints,
          tone: form.tone,
          brandVoice,
          userId,
        }),
      })
      const data = await res.json()
      if (data.sequence) {
        setSequence(data.sequence)
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + (data.error || 'Unknown error'))
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const scrollToForm = () => {
    document.getElementById('sequence-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)',
    borderRadius: '8px',
    fontSize: '13px',
    color: 'var(--lw-text)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }
  const labelStyle = {
    fontSize: '11px',
    fontWeight: '600' as const,
    color: 'var(--lw-text-muted)',
    display: 'block' as const,
    marginBottom: '5px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  }
  const cardStyle = {
    background: 'var(--lw-card)',
    borderRadius: '16px',
    border: '1px solid var(--lw-border)',
    padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    marginBottom: '1rem',
  }
  const sectionHeadStyle = {
    fontSize: '11px',
    fontWeight: '700' as const,
    color: 'var(--lw-text-muted)',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  }

  if (planLoaded && plan !== 'pro') {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Pro Feature</h1>
          <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
            Follow-Up Sequence Generator is a Pro-only feature. Upgrade to turn every interaction into a personalized multi-touchpoint follow-up sequence.
          </p>
          <a href="/pricing" style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', marginBottom: '12px' }}>
            Upgrade to Pro — $20/mo
          </a>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* ambient glows */}
      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(99,102,241,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING WHISPERER PRO
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            🔄 Follow-Up Sequence Generator
          </h1>
          <p style={{ fontSize: '1.15rem', fontWeight: '700', color: '#fff', marginBottom: '10px', lineHeight: '1.4' }}>
            Turn every conversation into a signed client.
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', marginBottom: '18px', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 18px' }}>
            Describe the interaction and your follow-up goals — get a complete personalized sequence of emails, texts, and voicemails ready to send.
          </p>
          <button
            onClick={scrollToForm}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', marginBottom: '16px' }}
          >
            🔄 Generate My Follow-Up Sequence
          </button>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', margin: '0', letterSpacing: '0.2px' }}>
            Personalized to your brand voice. Never sounds like a template.
          </p>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { step: '1', icon: '💬', title: 'Describe the interaction', desc: 'Tell us who you met, what happened, and any relevant context' },
              { step: '2', icon: '🎯', title: 'Set your follow-up goals', desc: 'Choose your touchpoints, tone, and sequence length' },
              { step: '3', icon: '📬', title: 'Get your complete sequence', desc: 'Receive personalized emails, texts, and voicemail scripts — ready to send' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{step}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="sequence-form" style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.18)', boxShadow: '0 4px 32px rgba(99,102,241,0.08)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>CONTACT DETAILS</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input
                type="text"
                placeholder="e.g. Sarah & Mike Johnson"
                value={form.contactName}
                onChange={e => setForm({ ...form, contactName: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Situation Type</label>
              <select value={form.situationType} onChange={e => setForm({ ...form, situationType: e.target.value })} style={inputStyle}>
                <option>After a showing</option>
                <option>After a listing appointment</option>
                <option>After a buyer consultation</option>
                <option>After an open house</option>
                <option>Cold lead re-engagement</option>
                <option>Under contract check-in</option>
                <option>Post-closing follow-up</option>
                <option>Sphere of influence nurture</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Notes (situation, objections, timeline, anything relevant)</label>
            <textarea
              placeholder="e.g. Sarah and Mike loved the kitchen but were worried about the school district. Pre-approved for $450k, want to move by summer..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: '1.6', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={labelStyle}>Number of Touchpoints</label>
              <select value={form.touchpoints} onChange={e => setForm({ ...form, touchpoints: e.target.value })} style={inputStyle}>
                <option value="3">3 touchpoints</option>
                <option value="5">5 touchpoints</option>
                <option value="7">7 touchpoints</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tone</label>
              <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} style={inputStyle}>
                <option>Warm &amp; Conversational</option>
                <option>Professional &amp; Direct</option>
                <option>Friendly &amp; Casual</option>
              </select>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#8b5cf6' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ Building your follow-up sequence...' : '🔄 Generate My Follow-Up Sequence'}
          </button>

          {brandVoice?.agentName && (
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '10px' }}>
              Personalized for {brandVoice.agentName}{brandVoice.brokerage ? ` · ${brandVoice.brokerage}` : ''}
            </p>
          )}
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>{"What You'll Get"}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '📧', label: 'Personalized emails', desc: 'Subject lines and full body copy tailored to each touchpoint' },
              { icon: '📱', label: 'Text message versions', desc: 'Short, casual texts for quick follow-up moments' },
              { icon: '📅', label: 'Suggested send schedule', desc: 'Know exactly which day to send each touchpoint' },
              { icon: '🗣️', label: 'Voicemail scripts', desc: "What to say when they don't pick up — natural and friendly" },
              { icon: '💡', label: 'Subject lines', desc: "Open-worthy subject lines that don't feel spammy" },
              { icon: '🔄', label: 'Re-engagement message', desc: 'A final touchpoint designed to re-spark cold leads' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔄</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '700', marginBottom: '6px', fontSize: '15px' }}>Building your follow-up sequence...</p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px' }}>Crafting personalized emails, texts, and voicemail scripts...</p>
          </div>
        )}

        {/* RESULTS */}
        {sequence && (
          <div id="results">
            <div style={{ ...cardStyle, border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', marginBottom: '16px' }}>
                🔄 YOUR FOLLOW-UP SEQUENCE — {form.contactName.toUpperCase()} · {form.situationType.toUpperCase()}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sequence.map((touch: any, i: number) => (
                  <div key={i} style={{ background: 'var(--lw-input)', borderRadius: '14px', padding: '1.25rem', border: '1px solid var(--lw-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <span style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>Day {touch.day}</span>
                    </div>

                    {touch.email_subject && (
                      <div style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.3px' }}>📧 Email</span>
                          <button
                            onClick={() => copy(`email-${i}`, `Subject: ${touch.email_subject}\n\n${touch.email_body}`)}
                            style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid', fontSize: '10px', cursor: 'pointer', fontWeight: '500', background: copied === `email-${i}` ? '#6366f1' : 'transparent', color: copied === `email-${i}` ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === `email-${i}` ? '#6366f1' : 'var(--lw-border)', transition: 'all 0.15s' }}
                          >
                            {copied === `email-${i}` ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0 0 4px', fontWeight: '600' }}>Subject: {touch.email_subject}</p>
                        <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{touch.email_body}</p>
                      </div>
                    )}

                    {touch.text_message && (
                      <div style={{ marginBottom: '10px', paddingTop: '10px', borderTop: '1px solid var(--lw-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.3px' }}>📱 Text</span>
                          <button
                            onClick={() => copy(`text-${i}`, touch.text_message)}
                            style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid', fontSize: '10px', cursor: 'pointer', fontWeight: '500', background: copied === `text-${i}` ? '#6366f1' : 'transparent', color: copied === `text-${i}` ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === `text-${i}` ? '#6366f1' : 'var(--lw-border)', transition: 'all 0.15s' }}
                          >
                            {copied === `text-${i}` ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{touch.text_message}</p>
                      </div>
                    )}

                    {touch.voicemail_script && (
                      <div style={{ paddingTop: '10px', borderTop: '1px solid var(--lw-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.3px' }}>🗣️ Voicemail</span>
                          <button
                            onClick={() => copy(`vm-${i}`, touch.voicemail_script)}
                            style={{ padding: '3px 10px', borderRadius: '6px', border: '1px solid', fontSize: '10px', cursor: 'pointer', fontWeight: '500', background: copied === `vm-${i}` ? '#6366f1' : 'transparent', color: copied === `vm-${i}` ? '#fff' : 'var(--lw-text-muted)', borderColor: copied === `vm-${i}` ? '#6366f1' : 'var(--lw-border)', transition: 'all 0.15s' }}
                          >
                            {copied === `vm-${i}` ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                        <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--lw-text)', margin: '0', whiteSpace: 'pre-wrap' }}>{touch.voicemail_script}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <a href="/dashboard" style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '500' }}>
                🏠 Back to Dashboard
              </a>
              <button
                onClick={() => { setSequence(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
              >
                🔄 New Sequence
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ fontSize: '12px', padding: '8px 14px', borderRadius: '8px', background: 'transparent', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
                >
                  🕘 {showHistory ? 'Hide' : 'View'} History ({history.length})
                </button>
              )}
            </div>

            {showHistory && history.length > 0 && (
              <div style={cardStyle}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', marginBottom: '12px' }}>PAST SEQUENCES</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((seq: any) => (
                    <div
                      key={seq.id}
                      onClick={() => {
                        setSequence(seq.sequence)
                        setForm({
                          contactName: seq.contact_name,
                          situationType: seq.situation_type,
                          notes: seq.notes || '',
                          touchpoints: String(seq.touchpoints || 5),
                          tone: seq.tone || 'Warm & Conversational',
                        })
                        setShowHistory(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      style={{ padding: '12px 14px', background: 'var(--lw-input)', borderRadius: '10px', border: '1px solid var(--lw-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 2px' }}>{seq.contact_name} · {seq.situation_type}</p>
                        <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0' }}>{new Date(seq.created_at).toLocaleDateString()} · {seq.touchpoints} touchpoints</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: '600' }}>Load →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
