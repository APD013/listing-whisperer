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
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:'sans-serif'}}>
      <div style={{width:'100%',maxWidth:'360px'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'500',marginBottom:'0.5rem'}}>Welcome back</h1>
        <p style={{color:'#666',fontSize:'0.875rem',marginBottom:'2rem'}}>Sign in to Listing Whisperer</p>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'10px',fontSize:'14px'}}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}/>
        {message && <p style={{fontSize:'13px',marginBottom:'10px',color:'red'}}>{message}</p>}
        <button onClick={handleLogin} disabled={loading}
          style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p style={{textAlign:'center',fontSize:'13px',color:'#666',marginTop:'1rem'}}>
          No account? <a href="/signup" style={{color:'#1D9E75'}}>Sign up free</a>
        </p>
      </div>
    </main>
  )
}