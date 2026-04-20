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
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:'sans-serif',background:'linear-gradient(180deg,#f0fdf8 0%,#fff 100%)'}}>
      <div style={{width:'100%',maxWidth:'360px'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{fontSize:'20px',fontWeight:'600',marginBottom:'8px'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'600',marginBottom:'0.5rem'}}>Create your account</h1>
          <p style={{color:'#666',fontSize:'0.875rem'}}>Start with 3 free listings — no credit card required</p>
        </div>
        <input type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'10px',fontSize:'14px',boxSizing:'border-box'}}/>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'10px',fontSize:'14px',boxSizing:'border-box'}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'16px',fontSize:'14px',boxSizing:'border-box'}}/>
        {message && <p style={{fontSize:'13px',marginBottom:'10px',color:message.includes('Success')?'green':'red'}}>{message}</p>}
        <button onClick={handleSignup} disabled={loading}
          style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'1rem'}}>
          Already have an account? <a href="/login" style={{color:'#1D9E75'}}>Sign in</a>
        </p>
      </div>
    </main>
  )
}