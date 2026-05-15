'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackRewriteUsed, trackUpgradeClick, trackEvent } from '../lib/analytics'

import Navbar from '../components/Navbar'

import { isDemoUser, hasUsedDemoGeneration, getDemoGenerationTool, markDemoGenerationUsed } from '../lib/demoMode'
import DemoLockedCard from '../components/DemoLockedCard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RewritePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [listing, setListing] = useState('')
  const [style, setStyle] = useState('Professional and compelling')
  const [outputs, setOutputs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('standard')
  const [showExample, setShowExample] = useState(false)
  const [rewritesUsed, setRewritesUsed] = useState(0)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      if (isDemoUser(user)) setIsDemo(true)
      trackEvent('rewrite_page_view')
      const { data: profile } = await supabase
        .from('profiles').select('rewrites_used, plan').eq('id', user.id).single()
      if (profile) {
        setRewritesUsed(profile.rewrites_used || 0)
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const rewrite = async () => {
    if (!listing.trim()) { alert('Please paste a listing first!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, style, userId })
      })
      const data = await res.json()
      if (data.error === 'REWRITE_LIMIT_REACHED') { router.push('/pricing'); return }
      if (data.outputs) {
        setOutputs(data.outputs)
        if (isDemo) markDemoGenerationUsed('rewrite')
        setActiveTab('standard')
        setRewritesUsed(prev => prev + 1)
        trackRewriteUsed(plan)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const tabs = [
    { key: 'standard', label: 'Standard MLS', icon: '🏠' },
    { key: 'luxury', label: 'Luxury', icon: '✨' },
    { key: 'short', label: 'Short Version', icon: '⚡' },
    { key: 'social', label: 'Instagram', icon: '📸' },
    { key: 'headline', label: 'Headlines', icon: '📣' },
    { key: 'improvements', label: 'What Changed', icon: '✅' },
  ]

  const styles_list = ['Professional and compelling', 'Luxury and aspirational', 'Warm and inviting', 'Modern and minimal', 'Family-friendly', 'Investment-focused', 'High urgency']

  const inputStyle = { width: '100%', padding: '12px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }
  const cardStyle = { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '1rem' }
  const sectionHeadStyle = { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px' }

  if (isDemo && hasUsedDemoGeneration() && getDemoGenerationTool() !== 'rewrite') return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <Navbar />
      <DemoLockedCard reason="limit_reached" usedTool={getDemoGenerationTool()} />
    </div>
  )

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '15%', left: '5%', width: '360px', height: '360px', background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(99,102,241,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
            LISTING REWRITER
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            ✨ Transform any listing description into something buyers love.
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>
            Paste your existing copy — we'll rewrite it to be more compelling, emotional, and conversion-focused.
          </p>
          <button
            onClick={() => document.getElementById('rewrite-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            ✨ Rewrite My Listing
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '📋', title: 'Paste your existing listing copy', desc: 'Even boring, basic, or outdated MLS copy works perfectly' },
              { s: '2', icon: '🎯', title: 'Choose your tone and target buyer', desc: 'Luxury, warm, modern, family-friendly — we match your audience' },
              { s: '3', icon: '✨', title: 'Get your rewritten listing', desc: 'Polished, buyer-ready copy in multiple formats instantly' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BEFORE/AFTER EXAMPLE */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button onClick={() => setShowExample(!showExample)}
            style={{ fontSize: '13px', fontWeight: '600', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            {showExample ? '▲ Hide example' : '▼ See a before/after example'}
          </button>
          {showExample && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '1.25rem' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', marginBottom: '8px', letterSpacing: '1px' }}>BEFORE — BORING</p>
                <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.8', fontStyle: 'italic', margin: 0 }}>
                  "3 bed 2 bath home in Newport Beach. Has a kitchen and living room. Good size backyard. Close to schools. $899,000."
                </p>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1.25rem' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', marginBottom: '8px', letterSpacing: '1px' }}>AFTER — POLISHED</p>
                <p style={{ fontSize: '13px', color: 'var(--lw-text)', lineHeight: '1.8', margin: 0 }}>
                  "Welcome to this beautifully appointed 3-bedroom coastal retreat in the heart of Newport Beach..."
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FORM */}
        <div id="rewrite-form">
          <div style={cardStyle}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', margin: '0 0 12px' }}>PASTE YOUR LISTING</p>
            <textarea
              placeholder="Paste your current MLS description here... even if it's boring or basic, we'll make it shine."
              value={listing}
              onChange={e => setListing(e.target.value)}
              style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' as const, lineHeight: '1.7' }}
            />
          </div>

          <div style={cardStyle}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '1px', margin: '0 0 12px' }}>REWRITE STYLE</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {styles_list.map(s => (
                <button key={s} onClick={() => setStyle(s)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: style === s ? '#6366f1' : 'var(--lw-border)',
                    background: style === s ? 'rgba(99,102,241,0.1)' : 'var(--lw-input)',
                    color: style === s ? '#6366f1' : 'var(--lw-text-muted)',
                    fontWeight: style === s ? '700' : '500',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif'
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '✨', label: 'Rewritten listing description', desc: 'Polished, buyer-focused MLS copy that converts' },
              { icon: '📣', label: 'Improved headline', desc: 'A compelling hook to lead every format' },
              { icon: '🎯', label: 'Tone-matched copy', desc: 'Written to match your chosen style and audience' },
              { icon: '💬', label: 'Buyer-focused language', desc: 'Emotional, benefit-driven writing buyers respond to' },
              { icon: '🔍', label: 'SEO-friendly version', desc: 'Optimized copy for online listing discovery' },
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
        {plan === 'starter' && rewritesUsed >= 3 ? (
          <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontWeight: '700', fontSize: '15px', margin: '0 0 8px', color: 'var(--lw-text)' }}>You've used all 3 free rewrites!</p>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0 0 12px' }}>Upgrade to Pro for unlimited rewrites, full marketing kits, and saved listing history.</p>
            <a href="/pricing" onClick={() => trackUpgradeClick('rewrite_limit', plan)}
              style={{ display: 'inline-block', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', padding: '11px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
              Upgrade to Pro — $20/mo
            </a>
          </div>
        ) : (
          <button onClick={rewrite} disabled={loading}
            style={{ width: '100%', padding: '15px', background: loading ? '#4f46e5' : 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1.5rem', boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.3)', transition: 'all 0.2s', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            {loading ? '⏳ Rewriting your listing...' : '✨ Make This Listing Shine'}
          </button>
        )}

        {/* RESULTS */}
        {outputs && (
          <div>
            <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', margin: '0 0 6px', letterSpacing: '1px' }}>✅ WHAT WE IMPROVED</p>
              <p style={{ fontSize: '13px', color: 'var(--lw-text)', lineHeight: '1.8', whiteSpace: 'pre-wrap', margin: 0 }}>{outputs.improvements}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    fontSize: '12px', padding: '7px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                    borderColor: activeTab === t.key ? '#6366f1' : 'var(--lw-border)',
                    background: activeTab === t.key ? 'rgba(99,102,241,0.1)' : 'var(--lw-input)',
                    color: activeTab === t.key ? '#6366f1' : 'var(--lw-text-muted)',
                    fontWeight: activeTab === t.key ? '700' : '500',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif'
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ ...cardStyle, position: 'relative' }}>
              <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: copied ? '#6366f1' : 'var(--lw-input)', color: copied ? '#fff' : 'var(--lw-text-muted)', border: '1px solid', borderColor: copied ? '#6366f1' : 'var(--lw-border)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--lw-text)', margin: 0, paddingRight: '90px' }}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--lw-text-muted)', margin: '0 0 12px', letterSpacing: '0.5px' }}>DO MORE WITH THIS LISTING</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a href="/dashboard" style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '700' }}>
                  Generate Full Marketing Kit →
                </a>
                <button onClick={() => { setListing(outputs.standard); setOutputs(null); window.scrollTo(0, 0) }}
                  style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  Rewrite Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
