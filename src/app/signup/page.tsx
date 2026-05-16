'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackSignupStarted, trackSignupCompleted, preserveUTMs } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  useEffect(() => { preserveUTMs() }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [refCode, setRefCode] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setRefCode(ref)
      localStorage.setItem('lw_referral_code', ref)
    }
  }, [])

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) { setMessage('Please enter your email and password.'); return }
    if (password.length < 6) { setMessage('Password must be at least 6 characters.'); return }
    trackSignupStarted()
    setLoading(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: name } }
      })
      if (error) { setMessage(error.message); setLoading(false); return }
      if (!data.user) { setMessage('Account could not be created. Please try again.'); setLoading(false); return }

      trackSignupCompleted(data.user.id)

      if (refCode && data.user) {
        try {
          await supabase.rpc('handle_referral', { referral_code_used: refCode, new_user_id: data.user.id })
          await fetch('/api/referral/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: refCode, newUserId: data.user.id })
          })
        } catch(refErr) {}
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError || !signInData?.session) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password })
        if (retryError || !retryData?.session) {
          setMessage('Account created! Please sign in to continue.')
          setTimeout(() => { window.location.href = '/login?email=' + encodeURIComponent(email) }, 1500)
          setLoading(false)
          return
        }
      }

      window.location.href = '/dashboard'
    } catch(e: any) {
      setMessage('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
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

        {success ? (
          <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)', padding: '2.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Check your email!</h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              We sent a confirmation link to <strong style={{ color: 'var(--lw-text)' }}>{email}</strong>. Click it to activate your account.
            </p>
            <div style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '12px', color: '#1D9E75', margin: 0, lineHeight: '1.9', fontWeight: '500' }}>
                ✓ 7 days of full Pro access<br />
                ✓ Unlimited listings in your trial<br />
                ✓ All AI assistant tools unlocked<br />
                ✓ No credit card required
                {refCode && <><br />✓ <strong>Referral bonus — 7 days of Pro free!</strong></>}
              </p>
            </div>
            <a href="/login" style={{ display: 'block', padding: '13px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
              Go to Sign In →
            </a>
          </div>
        ) : (
          <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid var(--lw-border)', padding: '2rem', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Create your account</h1>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0 0 1.25rem' }}>7 days of Pro free · No credit card required</p>

            {/* FEATURE PILLS */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {['7-day Pro trial', 'Unlimited listings', 'All AI tools', 'No credit card'].map(f => (
                <span key={f} style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)' }}>✓ {f}</span>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Password</label>
              <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignup()} style={inputStyle} />
            </div>

            {message && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, fontWeight: '500' }}>{message}</p>
              </div>
            )}

            <button onClick={handleSignup} disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(29,158,117,0.3)', transition: 'all 0.2s', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--lw-border)', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0 }}>
                Already have an account?{' '}
                <a href="/login" style={{ color: '#1D9E75', textDecoration: 'none', fontWeight: '700' }}>Sign in</a>
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--lw-text-muted)', margin: 0 }}>
            Use code <strong style={{ color: '#1D9E75' }}>WELCOME50</strong> at checkout for 50% off Pro
          </p>
        </div>
      </div>
    </main>
  )
}