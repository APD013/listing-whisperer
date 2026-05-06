'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingModal() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!localStorage.getItem('lw_onboarding_complete')) setVisible(true)
    }
  }, [])

  const close = () => {
    localStorage.setItem('lw_onboarding_complete', 'true')
    setVisible(false)
  }

  const go = (href?: string, chatPrompt?: string) => {
    close()
    if (chatPrompt) {
      window.dispatchEvent(new CustomEvent('lw-chat-prompt', { detail: chatPrompt }))
    } else if (href) {
      router.push(href)
    }
  }

  if (!visible) return null

  const options = [
    {
      icon: '🏠',
      title: 'Create Listing Marketing',
      desc: 'Turn 1 photo into full listing content in seconds',
      href: '/quick-listing',
      highlighted: true,
    },
    {
      icon: '📋',
      title: 'Prepare for a Seller Meeting',
      desc: 'Walk in confident with everything ready',
      href: '/seller-prep',
    },
    {
      icon: '✦',
      title: 'Ask the AI Assistant',
      desc: 'Get instant answers to real estate questions',
      chatPrompt: 'Help me get started with Listing Whisperer',
    },
    {
      icon: '👥',
      title: 'Follow Up with a Lead',
      desc: 'Turn conversations into signed clients',
      href: '/leads',
    },
  ]

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'var(--font-plus-jakarta), sans-serif',
    }}>
      <div style={{
        background: 'var(--lw-card)',
        borderRadius: '20px',
        border: '1px solid var(--lw-border)',
        padding: '2.5rem',
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.5rem', fontWeight: '800',
            color: 'var(--lw-text)', margin: '0 0 10px',
            letterSpacing: '-0.3px',
          }}>
            Welcome to Listing Whisperer 👋
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--lw-text-muted)', margin: 0 }}>
            What do you want to do first?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.75rem' }}>
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => go(opt.href, opt.chatPrompt)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '1.125rem 1.25rem',
                background: opt.highlighted ? 'rgba(29,158,117,0.06)' : 'var(--lw-bg)',
                border: opt.highlighted ? '1.5px solid rgba(29,158,117,0.4)' : '1px solid var(--lw-border)',
                borderRadius: '13px', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-plus-jakarta), sans-serif',
                width: '100%',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = '#1D9E75'
                e.currentTarget.style.background = 'rgba(29,158,117,0.08)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = opt.highlighted ? 'rgba(29,158,117,0.4)' : 'var(--lw-border)'
                e.currentTarget.style.background = opt.highlighted ? 'rgba(29,158,117,0.06)' : 'var(--lw-bg)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: opt.highlighted ? 'rgba(29,158,117,0.12)' : 'var(--lw-card)',
                border: opt.highlighted ? '1px solid rgba(29,158,117,0.25)' : '1px solid var(--lw-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
              }}>
                {opt.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 3px', fontSize: '14px', fontWeight: '700',
                  color: 'var(--lw-text)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
                }}>
                  {opt.title}
                  {opt.highlighted && (
                    <span style={{
                      fontSize: '9px', fontWeight: '700',
                      color: '#fff', background: '#1D9E75',
                      padding: '2px 7px', borderRadius: '20px',
                      letterSpacing: '0.5px', flexShrink: 0,
                    }}>
                      START HERE
                    </span>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>
                  {opt.desc}
                </p>
              </div>
              <span style={{ fontSize: '14px', color: 'var(--lw-text-muted)', flexShrink: 0 }}>→</span>
            </button>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={close}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'var(--lw-text-muted)',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              textDecoration: 'underline', textUnderlineOffset: '3px',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
