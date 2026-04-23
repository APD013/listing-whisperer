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
  const [email, setEmail] = useState('')
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
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif",display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      
      {/* BACKGROUND GLOW */}
      <div style={{position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',width:'600px',height:'600px',background:'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)',pointerEvents:'none'}}/>

      <div style={{width:'100%',maxWidth:'420px',position:'relative',zIndex:1}}>
        
        {/* LOGO */}
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <a href="/" style={{textDecoration:'none'}}>
            <div style={{fontSize:'24px',fontWeight:'700',color:'#f0f0f0'}}>
              Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
            </div>
            <div style={{fontSize:'12px',color:'#6b7280',marginTop:'4px'}}>AI Assistant for Real Estate Agents</div>
          </a>
        </div>

        {/* CARD */}
        <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',boxShadow:'0 24px 48px rgba(0,0,0,0.4)'}}>
          
          <h1 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>Welcome back</h1>
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'1.5rem'}}>Sign in to your workspace</p>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}
            />
          </div>

          <div style={{marginBottom:'1.5rem'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}
            />
          </div>

          {message && (
            <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px'}}>
              <p style={{fontSize:'13px',color:'#f87171',margin:'0'}}>{message}</p>
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            style={{width:'100%',padding:'13px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s',letterSpacing:'0.3px'}}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>

          <div style={{marginTop:'1.5rem',paddingTop:'1.5rem',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>
              Don't have an account?{' '}
              <a href="/signup" style={{color:'#1D9E75',textDecoration:'none',fontWeight:'600'}}>Sign up free</a>
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{textAlign:'center',marginTop:'1.5rem'}}>
          <p style={{fontSize:'12px',color:'#444'}}>
            No credit card required · 2 free listings to start
          </p>
        </div>
      </div>
    </main>
  )
}