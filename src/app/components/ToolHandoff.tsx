'use client'
import Link from 'next/link'
import { trackEvent } from '@/app/lib/analytics'

interface Handoff {
  emoji: string
  text: string
  cta: string
  href: string
}

export default function ToolHandoff({ from, handoffs }: { from: string; handoffs: Handoff[] }) {
  if (!handoffs || handoffs.length === 0) return null
  return (
    <div style={{ marginTop: '32px', padding: '20px 24px', background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px' }}>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--lw-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>
        What&apos;s next?
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {handoffs.map((h, i) => (
          <Link
            key={i}
            href={h.href}
            onClick={() => trackEvent('tool_handoff_clicked', { from, to: h.href.replace(/^\//, '') })}
            style={{ display: 'block', padding: '14px 16px', background: 'var(--lw-bg)', border: '1px solid var(--lw-border)', borderRadius: '8px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--lw-accent)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lw-border)' }}
          >
            <p style={{ fontSize: '14px', color: 'var(--lw-text)', margin: '0 0 6px' }}>{h.emoji} {h.text}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--lw-accent)', margin: 0 }}>{h.cta} →</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
