'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'lw_checklist'
const HIDDEN_KEY = 'lw_checklist_hidden'

const ITEMS = [
  { key: 'first_listing', label: 'Generate your first listing', quickListing: true },
  { key: 'ask_ai', label: 'Ask the AI assistant a question', chatPrompt: 'What can Listing Whisperer help me with?' },
  { key: 'seller_prep', label: 'Create a seller prep kit', href: '/seller-prep' },
  { key: 'first_lead', label: 'Add your first lead', href: '/leads' },
]

export default function DashboardChecklist() {
  const router = useRouter()
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [hidden, setHidden] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(HIDDEN_KEY)) setHidden(true)
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setDone(saved)
    } catch {}
    setMounted(true)
  }, [])

  const mark = (key: string) => {
    const updated = { ...done, [key]: true }
    setDone(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const hide = () => {
    localStorage.setItem(HIDDEN_KEY, 'true')
    setHidden(true)
  }

  const handleItem = (item: typeof ITEMS[0]) => {
    if (done[item.key]) return
    mark(item.key)
    if ('chatPrompt' in item && item.chatPrompt) {
      window.dispatchEvent(new CustomEvent('lw-chat-prompt', { detail: item.chatPrompt }))
    } else if ('href' in item && item.href) {
      router.push(item.href)
    } else if ('quickListing' in item && item.quickListing) {
      router.push('/quick-listing')
    }
  }

  if (!mounted || hidden) return null

  const allDone = ITEMS.every(item => done[item.key])

  if (allDone) {
    return (
      <div style={{
        background: 'var(--lw-card)',
        borderRadius: '16px',
        border: '1px solid rgba(29,158,117,0.25)',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        fontFamily: 'var(--font-plus-jakarta), sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--lw-text)', margin: 0 }}>
          🎉 You've explored the essentials! You're ready to win listings.
        </p>
        <button onClick={hide} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lw-text-muted)', fontSize: '16px', padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
    )
  }

  const completedCount = ITEMS.filter(item => done[item.key]).length

  return (
    <div style={{
      background: 'var(--lw-card)',
      borderRadius: '16px',
      border: '1px solid var(--lw-border)',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
      fontFamily: 'var(--font-plus-jakarta), sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: 0 }}>
            Get started — try these first
          </p>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#1D9E75', background: 'rgba(29,158,117,0.08)', padding: '2px 8px', borderRadius: '20px' }}>
            {completedCount}/{ITEMS.length}
          </span>
        </div>
        <button onClick={hide} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lw-text-muted)', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => handleItem(item)}
            disabled={done[item.key]}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px',
              background: done[item.key] ? 'rgba(29,158,117,0.04)' : 'transparent',
              border: '1px solid',
              borderColor: done[item.key] ? 'rgba(29,158,117,0.15)' : 'var(--lw-border)',
              borderRadius: '9px',
              cursor: done[item.key] ? 'default' : 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
            onMouseOver={e => { if (!done[item.key]) { e.currentTarget.style.borderColor = '#1D9E75'; e.currentTarget.style.background = 'rgba(29,158,117,0.04)' } }}
            onMouseOut={e => { if (!done[item.key]) { e.currentTarget.style.borderColor = 'var(--lw-border)'; e.currentTarget.style.background = 'transparent' } }}
          >
            <span style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: done[item.key] ? '#1D9E75' : 'transparent',
              border: done[item.key] ? 'none' : '1.5px solid var(--lw-border)',
              fontSize: '11px', color: '#fff', fontWeight: '700',
            }}>
              {done[item.key] ? '✓' : ''}
            </span>
            <span style={{
              fontSize: '13px', fontWeight: '500',
              color: done[item.key] ? 'var(--lw-text-muted)' : 'var(--lw-text)',
              textDecoration: done[item.key] ? 'line-through' : 'none',
            }}>
              {item.label}
            </span>
            {!done[item.key] && (
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--lw-text-muted)' }}>→</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
