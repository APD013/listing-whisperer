'use client'

interface Props {
  hint: string
}

export default function AskAiHint({ hint }: Props) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('lw-chat-prompt', { detail: hint }))
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      background: 'var(--lw-input)',
      border: '1px solid var(--lw-border)',
      borderRadius: '10px',
      padding: '10px 14px',
      marginBottom: '1rem',
    }}>
      <span style={{
        fontSize: '12px',
        color: 'var(--lw-text-muted)',
        lineHeight: '1.5',
      }}>
        💡 {hint.replace(/ →$/, '')}
      </span>
      <button
        onClick={handleClick}
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#1D9E75',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          padding: '0',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}>
        Ask AI →
      </button>
    </div>
  )
}
