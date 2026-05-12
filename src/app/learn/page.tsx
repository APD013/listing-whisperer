import type { Metadata } from 'next'
import { guides } from './guides'

export const metadata: Metadata = {
  title: 'Real Estate Agent Guides & Resources | Listing Whisperer',
  description: 'Free real estate marketing guides for agents. Learn how to write listings, win presentations, use AI, and grow your business.',
  openGraph: {
    title: 'Real Estate Agent Guides & Resources | Listing Whisperer',
    description: 'Free real estate marketing guides for agents. Learn how to write listings, win presentations, use AI, and grow your business.',
    type: 'website',
  },
}

export default function LearnPage() {
  return (
    <main style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', background: 'var(--lw-bg)', minHeight: '100vh' }}>
      <style>{`
        .learn-guide-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .learn-guide-card:hover { border-color: rgba(29,158,117,0.3) !important; box-shadow: 0 8px 32px rgba(29,158,117,0.1) !important; transform: translateY(-2px); }
      `}</style>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <a href="/" style={{ textDecoration: 'none', fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: 'var(--lw-accent)' }}>Whisperer</span>
        </a>
        <a href="/signup" style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 12px rgba(29,158,117,0.3)' }}>
          Try Free →
        </a>
      </div>

      {/* HERO */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 1.5rem 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '20px', padding: '5px 14px', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '13px', color: 'var(--lw-accent)', fontWeight: '600' }}>Free Resources</span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.03em', lineHeight: '1.15', margin: '0 0 1rem' }}>
          Real Estate Agent Resource Center
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--lw-text-muted)', lineHeight: '1.7', margin: '0 auto', maxWidth: '540px' }}>
          Free guides to help you win more listings, close more deals, and grow your business.
        </p>
      </div>

      {/* GUIDES GRID */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {guides.map((guide, i) => (
            <a
              key={guide.slug}
              href={`/learn/${guide.slug}`}
              className="learn-guide-card"
              style={{
                background: 'var(--lw-card)',
                borderRadius: '16px',
                border: '1px solid var(--lw-border)',
                padding: '1.75rem',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Guide {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>{guide.readTime}</span>
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4', margin: 0, letterSpacing: '-0.01em' }}>
                {guide.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.6', margin: 0, flexGrow: 1 }}>
                {guide.description}
              </p>
              <span style={{ fontSize: '13px', color: 'var(--lw-accent)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Read guide →
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div style={{ background: 'var(--lw-card)', borderTop: '1px solid var(--lw-border)', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.625rem', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>
            Put these strategies to work today
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--lw-text-muted)', lineHeight: '1.7', margin: '0 0 2rem' }}>
            Listing Whisperer gives you AI-powered tools for every step — from listing descriptions to follow-up sequences to listing presentations.
          </p>
          <a href="/signup" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 20px rgba(29,158,117,0.35)' }}>
            Start Free Trial →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ textAlign: 'center', padding: '1.5rem', borderTop: '1px solid var(--lw-border)' }}>
        <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--lw-text-muted)', margin: 0 }}>
          <a href="/" style={{ color: 'var(--lw-accent)', textDecoration: 'none', fontWeight: '700' }}>ListingWhisperer.com</a>
          {' · '}
          <a href="/privacy" style={{ color: 'var(--lw-text-muted)', textDecoration: 'none' }}>Privacy</a>
          {' · '}
          <a href="/terms" style={{ color: 'var(--lw-text-muted)', textDecoration: 'none' }}>Terms</a>
        </p>
      </div>

    </main>
  )
}
