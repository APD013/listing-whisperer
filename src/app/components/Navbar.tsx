'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Navbar() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [hoverSignOut, setHoverSignOut] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
      }
    }
    getUser()
  }, [])

  const handleLogoClick = () => {
    sessionStorage.setItem('lw_scroll_position', String(window.scrollY))
    router.push('/dashboard')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div style={{
      background: 'var(--lw-bg)',
      borderBottom: '1px solid var(--lw-border)',
      height: '52px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%',
      boxSizing: 'border-box' as const,
    }}>
      <button
        onClick={handleLogoClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontSize: '16px',
          fontWeight: '700',
          color: 'var(--lw-text)',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
        }}
      >
        Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
        {planLoaded && plan === 'pro' && (
          <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
        )}
      </button>
      <button
        onClick={handleSignOut}
        onMouseEnter={() => setHoverSignOut(true)}
        onMouseLeave={() => setHoverSignOut(false)}
        style={{
          fontSize: '13px',
          color: hoverSignOut ? '#1D9E75' : 'var(--lw-text-muted)',
          fontWeight: '500',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
          transition: 'color 0.15s ease',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
