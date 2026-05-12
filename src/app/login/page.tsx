'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackLoginCompleted, preserveUTMs } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  useEffect(() => { preserveUTMs() }, [])
  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return ''
    const params = new URLSearchParams(window.location.search)
    return params.get('email') || ''
  })
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      trackLoginCompleted(data.user?.id || 'unknown')
      localStorage.setItem('lw_user_id', data.user?.id || '')
      const redirect = localStorage.getItem('post_payment_redirect')
      if (redirect) {
        localStorage.removeItem('post_payment_redirect')
        window.location.href = redirect
      } else {
        window.location.href = '/dashboard'
      }
    }
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* LOGO */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.03em' }}>
              Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--lw-text-muted)', marginTop: '4px' }}>AI Assistant for Real Estate Agents</div>
          </a>
        </div>

        {/* CARD */}
        <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)', padding: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(29,158,117,0.05)' }}>

          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0 0 1.5rem' }}>Sign in to your workspace</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)' }}>Password</label>
              <a href="/forgot-password" style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>Forgot password?</a>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          {message && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, fontWeight: '500' }}>{message}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(29,158,117,0.3)', transition: 'all 0.2s', letterSpacing: '0.01em', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--lw-border)', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0 }}>
              Don't have an account?{' '}
              <a href="/signup" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '700' }}>Sign up free</a>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--lw-text-muted)', margin: 0 }}>
            🔒 Secure login · No credit card required · 24hr free trial
          </p>
        </div>
      </div>
    </main>
  )
}