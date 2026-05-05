'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OpenHouseSignInHome() {
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [customName, setCustomName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('listings').select('id, name').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      setListings(data || [])
      setAuthReady(true)
    }
    init()
  }, [])

  const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const getId = () => {
    if (selected) return selected
    if (customName.trim()) return slugify(customName.trim())
    return null
  }

  const url = typeof window !== 'undefined' && getId()
    ? `${window.location.origin}/open-house-signin/${getId()}`
    : null

  const copy = () => {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const s = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' },
    label: { fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  if (!authReady) return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(29,158,117,0.3)', borderTop: '3px solid #1D9E75', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--lw-text)' }}>Listing<span style={{ color: '#1D9E75' }}>Whisperer</span></div>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>📋</div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--lw-text)', margin: '0' }}>Open House Sign-In</h1>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0' }}>Generate a tablet-friendly sign-in link for your open house</p>
          </div>
        </div>

        <div style={{ ...s.card, marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 16px', paddingBottom: '12px', borderBottom: '1px solid var(--lw-border)' }}>SELECT A LISTING</p>

          {listings.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <label style={s.label}>Pick from your listings</label>
              <select value={selected} onChange={e => { setSelected(e.target.value); setCustomName('') }} style={s.input}>
                <option value=''>— Choose a listing —</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0', color: 'var(--lw-text-muted)', fontSize: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--lw-border)' }} />
            {listings.length > 0 ? 'or enter manually' : 'Enter property name'}
            <div style={{ flex: 1, height: '1px', background: 'var(--lw-border)' }} />
          </div>

          <div>
            <label style={s.label}>Property address or name</label>
            <input value={customName} onChange={e => { setCustomName(e.target.value); setSelected('') }} placeholder="e.g. 123 Oak Street" style={s.input} />
          </div>
        </div>

        {url && (
          <div style={{ ...s.card, border: '1px solid rgba(29,158,117,0.25)', background: 'linear-gradient(135deg, var(--lw-card) 0%, rgba(29,158,117,0.04) 100%)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 12px' }}>YOUR SIGN-IN LINK</p>
            <div style={{ background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: 'var(--lw-text-muted)', wordBreak: 'break-all' as const, marginBottom: '12px', lineHeight: '1.6' }}>{url}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={copy} style={{ flex: 1, padding: '11px', background: copied ? '#1D9E75' : 'rgba(29,158,117,0.1)', color: copied ? '#fff' : '#1D9E75', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {copied ? '✓ Copied!' : '📋 Copy Link'}
              </button>
              <button onClick={() => window.open(url, '_blank')} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                📱 Open on Tablet
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '10px 0 0', textAlign: 'center' as const }}>Share this link or open it on a tablet at your open house</p>
          </div>
        )}
      </div>
    </div>
  )
}