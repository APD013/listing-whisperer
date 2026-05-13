'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DemoPage() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnterDemo = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })
      if (sessionError) throw sessionError
      window.location.href = '/dashboard'
    } catch {
      setError('Demo is temporarily unavailable. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', minHeight: '100vh', background: 'linear-gradient(180deg, #f0fdf8 0%, #f9fafb 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* NAV */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#fff', borderBottom: '1px solid #eee', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none', fontSize: '17px', fontWeight: '800', color: '#111' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
        </a>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/login" style={{ fontSize: '14px', color: '#555', textDecoration: 'none' }}>Sign In</a>
          <a href="/signup" style={{ fontSize: '13px', background: '#1D9E75', color: '#fff', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', boxShadow: '0 2px 8px rgba(29,158,117,0.3)' }}>Start Free</a>
        </div>
      </div>

      <div style={{ maxWidth: '680px', width: '100%', textAlign: 'center', paddingTop: '4rem' }}>

        {/* LABEL */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#E1F5EE', color: '#085041', fontSize: '11px', fontWeight: '700', padding: '5px 14px', borderRadius: '20px', marginBottom: '1.75rem', letterSpacing: '0.08em', border: '1px solid #bbf0d9' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', display: 'inline-block', boxShadow: '0 0 6px rgba(29,158,117,0.7)' }}/>
          LIVE PRODUCT DEMO
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: '800', color: '#111', letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 1.25rem' }}>
          See Listing Whisperer in action
        </h1>
        <p style={{ fontSize: '1.0625rem', color: '#555', lineHeight: '1.75', margin: '0 auto 2.5rem', maxWidth: '520px' }}>
          Explore a fully populated demo account — real listings, real AI output, real workflows. No signup required.
        </p>

        {/* FEATURE CALLOUTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '🏠', title: '3 Active Listings', desc: 'See full AI-generated marketing suites' },
            { icon: '👥', title: '5 Sample Leads', desc: 'Explore the CRM and follow-up tools' },
            { icon: '⏰', title: 'Live Reminders', desc: 'See how agents stay organized' },
          ].map((item) => (
            <div key={item.title} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e5e7eb', padding: '1.375rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '1.875rem', marginBottom: '10px' }}>{item.icon}</div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: '0 0 6px' }}>{item.title}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleEnterDemo}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '16px 44px', background: loading ? '#085041' : 'linear-gradient(135deg, #1D9E75, #085041)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(29,158,117,0.35)', transition: 'all 0.2s', fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '1rem' }}>
          {loading && (
            <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.75s linear infinite', flexShrink: 0 }}/>
          )}
          {loading ? 'Signing in...' : 'Enter Demo →'}
        </button>

        {error && (
          <p style={{ fontSize: '13px', color: '#ef4444', margin: '0 0 1rem' }}>{error}</p>
        )}

        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 14px', lineHeight: '1.6' }}>
          Demo data resets nightly. Your changes won't affect real accounts.
        </p>
        <a href="/signup" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
          Ready to use your own data?{' '}
          <span style={{ color: '#1D9E75', fontWeight: '700' }}>Start free →</span>
        </a>

      </div>
    </main>
  )
}
