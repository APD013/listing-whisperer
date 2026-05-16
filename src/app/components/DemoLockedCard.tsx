'use client'
import Link from 'next/link'

interface Props {
  reason: 'paid_feature' | 'limit_reached'
  toolName?: string
  usedTool?: string | null
}

export default function DemoLockedCard({ reason, toolName, usedTool }: Props) {
  const title = reason === 'paid_feature'
    ? `${toolName} is a Pro feature`
    : `You've used your free demo generation`

  const message = reason === 'paid_feature'
    ? `${toolName} uses premium AI services. Sign up free to unlock — no credit card required for the first 7 days of Pro.`
    : `You already tried ${usedTool ? usedTool.replace(/-/g, ' ') : 'a tool'} in this demo session. Sign up free to unlock all 30+ tools — no credit card required for the first 7 days of Pro.`

  return (
    <div style={{ background: 'var(--lw-card)', border: '2px solid #1D9E75', borderRadius: '12px', padding: '40px 32px', textAlign: 'center', maxWidth: '520px', margin: '40px auto' }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔒</div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lw-text)', marginBottom: '12px' }}>{title}</h2>
      <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>{message}</p>
      <Link href="/signup" style={{ display: 'inline-block', padding: '12px 28px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
        Sign up free — unlock everything
      </Link>
      <div style={{ fontSize: '12px', color: 'var(--lw-text-muted)', marginTop: '12px' }}>7 days of full Pro access · No credit card</div>
    </div>
  )
}
