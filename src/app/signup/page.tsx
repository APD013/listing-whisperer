'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignup = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) setMessage(error.message)
      else setMessage('Success! Check your email to confirm.')
    } catch(e) {
      setMessage('Something went wrong, try again.')
    }
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',fontFamily:'sans-serif'}}>
      {/* LEFT SIDE */}
      <div style={{flex:1,background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',flexDirection:'column',justifyContent:'center',padding:'4rem',color:'#fff'}}>
        <div style={{fontSize:'22px',fontWeight:'700',marginBottom:'2rem'}}>Listing<span style={{color:'#a8f0d4'}}>Whisperer</span></div>
        <h2 style={{fontSize:'1.75rem',fontWeight:'600',lineHeight:'1.3',marginBottom:'1rem'}}>
          Write listing copy in under 60 seconds.
        </h2>
        <p style={{fontSize:'15px',color:'#a8f0d4',lineHeight:'1.8',marginBottom:'2rem'}}>
          Join agents already using Listing Whisperer to save hours every week.
        </p>
        {[
          '3 free listings to start',
          'No credit card required',
          '8 copy formats per listing',
          'MLS, Instagram, Email & more',
          'Cancel anytime',
        ].map(item => (
          <div key={item} style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'10px'}}>
            <span style={{color:'#a8f0d4',fontSize:'16px'}}>✓</span>
            <span style={{fontSize:'14px',color:'#e0f7ee'}}>{item}</span>
          </div>
        ))}
      </div>

      {/* RIGHT SIDE */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'4rem',background:'#fff'}}>
        <div style={{width:'100%',maxWidth:'360px'}}>
          <h1 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Create your account</h1>
          <p style={{color:'#666',fontSize:'0.875rem',marginBottom:'2rem'}}>Start with 3 free listings — no credit card needed</p>
          <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}
            style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'12px',fontSize:'14px',boxSizing:'border-box'}}/>
          <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'12px',fontSize:'14px',boxSizing:'border-box'}}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
            style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'20px',fontSize:'14px',boxSizing:'border-box'}}/>
          {message && <p style={{fontSize:'13px',marginBottom:'12px',color:message.includes('Success')?'green':'red'}}>{message}</p>}
          <button onClick={handleSignup} disabled={loading}
            style={{width:'100%',padding:'13px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'600',cursor:'pointer',marginBottom:'16px'}}>
            {loading ? 'Creating account...' : 'Create free account'}
          </button>
          <p style={{textAlign:'center',fontSize:'13px',color:'#666'}}>
            Already have an account? <a href="/login" style={{color:'#1D9E75',fontWeight:'500'}}>Sign in →</a>
          </p>
          <p style={{textAlign:'center',fontSize:'12px',color:'#999',marginTop:'2rem'}}>
            By signing up you agree to our terms of service.
          </p>
        </div>
      </div>
    </main>
  )
}