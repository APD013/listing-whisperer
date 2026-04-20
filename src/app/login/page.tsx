'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',fontFamily:'sans-serif'}}>
      {/* LEFT SIDE */}
      <div style={{flex:1,background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'4rem',color:'#fff'}}>
        <div style={{fontSize:'22px',fontWeight:'700',marginBottom:'2rem'}}>Listing<span style={{color:'#a8f0d4'}}>Whisperer</span></div>
        <h2 style={{fontSize:'1.75rem',fontWeight:'600',lineHeight:'1.3',marginBottom:'1rem'}}>
          Turn rough listing notes into polished marketing copy — in seconds.
        </h2>
        <p style={{fontSize:'15px',color:'#a8f0d4',lineHeight:'1.8',marginBottom:'2rem'}}>
          MLS descriptions, Instagram captions, email blasts, and more. All from one set of notes.
        </p>
        {['8 copy formats in one click','MLS-ready formatting','Tone & buyer targeting','Saves listing history'].map(item => (
          <div key={item} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
            <span style={{color:'#a8f0d4',fontSize:'16px'}}>✓</span>
            <span style={{fontSize:'14px',color:'#e0f7ee'}}>{item}</span>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',background:'#fff'}}>
        <div style={{width:'100%',maxWidth:'360px'}}>
          <h1 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Welcome back</h1>
          <p style={{color:'#666',fontSize:'0.875rem',marginBottom:'2rem'}}>Sign in to your Listing Whisperer account</p>
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'12px',fontSize:'14px',boxSizing:'border-box'}}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
            style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'20px',fontSize:'14px',boxSizing:'border-box'}}/>
          {message && <p style={{fontSize:'13px',marginBottom:'12px',color:'red'}}>{message}</p>}
          <button onClick={handleLogin} disabled={loading}
            style={{width:'100%',padding:'13px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'600',cursor:'pointer',marginBottom:'16px'}}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#666'}}>
            No account? <a href="/signup" style={{color:'#1D9E75',fontWeight:'500'}}>Get started free →</a>
          </p>
          <p style={{textAlign:'center',fontSize:'12px',color:'#999',marginTop:'2rem'}}>
            3 free listings · No credit card required
          </p>
        </div>
      </div>
    </main>
  )
}