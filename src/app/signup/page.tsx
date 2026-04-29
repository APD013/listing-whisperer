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
    if (ref) setRefCode(ref)
  }, [])

  const handleSignup = async () => {
    trackSignupStarted()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) {
        setMessage(error.message)
      } else {
        if (refCode && data.user) {
          await supabase.rpc('handle_referral', {
            referral_code_used: refCode,
            new_user_id: data.user.id
          })
        }
        trackSignupCompleted('new_user')
        // Auto sign in after signup
        await supabase.auth.signInWithPassword({ email, password })
        window.location.href = '/dashboard'
      }
    } catch(e) {
      setMessage('Something went wrong, try again.')
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

        {success ? (
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.2)',padding:'2.5rem',boxShadow:'0 24px 48px rgba(0,0,0,0.4)',textAlign:'center'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>✅</div>
            <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Check your email!</h2>
            <p style={{fontSize:'14px',color:'#6b7280',lineHeight:'1.7',marginBottom:'1.5rem'}}>
              We sent a confirmation link to <strong style={{color:'#f0f0f0'}}>{email}</strong>. Click it to activate your account and start generating listings.
            </p>
            <div style={{background:'rgba(29,158,117,0.1)',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'10px',padding:'1rem',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'12px',color:'#1D9E75',margin:'0',lineHeight:'1.8'}}>
                ✓ 24 hours of full Pro access<br/>
                ✓ 2 listings included in your trial<br/>
                ✓ All AI assistant tools unlocked<br/>
                ✓ No credit card required
                {refCode && <><br/>✓ <strong>Referral bonus — 24 hours of Pro free!</strong></>}
              </p>
            </div>
            <a href="/login" style={{display:'block',padding:'12px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>
              Go to Sign In →
            </a>
          </div>
        ) : (
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',boxShadow:'0 24px 48px rgba(0,0,0,0.4)'}}>

            <h1 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>Create your account</h1>
            <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'1.5rem'}}>24 hours of Pro free · No credit card required</p>

            {/* FEATURE PILLS */}
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'1.5rem'}}>
              {['24hr Pro trial','2 listings free','All AI tools','No credit card'].map(f => (
                <span key={f} style={{fontSize:'11px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.2)'}}>✓ {f}</span>
              ))}
            </div>

            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Full Name</label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}
              />
            </div>

            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}
              />
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Password</label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
                style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}
              />
            </div>

            {message && (
              <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',padding:'10px 14px',marginBottom:'16px'}}>
                <p style={{fontSize:'13px',color:'#f87171',margin:'0'}}>{message}</p>
              </div>
            )}

            <button onClick={handleSignup} disabled={loading}
              style={{width:'100%',padding:'13px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s',letterSpacing:'0.3px'}}>
              {loading ? 'Creating account...' : 'Create Free Account →'}
            </button>

            <div style={{marginTop:'1.5rem',paddingTop:'1.5rem',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
              <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>
                Already have an account?{' '}
                <a href="/login" style={{color:'#1D9E75',textDecoration:'none',fontWeight:'600'}}>Sign in</a>
              </p>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:'center',marginTop:'1.5rem'}}>
          <p style={{fontSize:'12px',color:'#444'}}>
            Use code <strong style={{color:'#1D9E75'}}>WELCOME50</strong> at checkout for 50% off Pro
          </p>
        </div>
      </div>
    </main>
  )
}