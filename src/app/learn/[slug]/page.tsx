import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { guides } from '../guides'

export const dynamicParams = false

export async function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const guide = guides.find((g) => g.slug === slug)
  if (!guide) return {}
  return {
    title: `${guide.title} | Listing Whisperer`,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: 'article',
    },
  }
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const guide = guides.find((g) => g.slug === slug)
  if (!guide) notFound()

  const relatedGuides = guide.related
    .map((r) => guides.find((g) => g.slug === r))
    .filter(Boolean) as typeof guides

  const cardBase: React.CSSProperties = {
    background: 'var(--lw-card)',
    borderRadius: '16px',
    border: '1px solid var(--lw-border)',
    padding: '1.75rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  }

  return (
    <main style={{ fontFamily: 'var(--font-plus-jakarta), sans-serif', background: 'var(--lw-bg)', minHeight: '100vh' }}>
      <style>{`
        .learn-related-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .learn-related-card:hover { border-color: rgba(29,158,117,0.3) !important; box-shadow: 0 8px 24px rgba(29,158,117,0.1) !important; }
      `}</style>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="/" style={{ textDecoration: 'none', fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
            Listing<span style={{ color: 'var(--lw-accent)' }}>Whisperer</span>
          </a>
          <a href="/learn" style={{ fontSize: '13px', color: 'var(--lw-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
            ← All Guides
          </a>
        </div>
        <a href="/signup" style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '700', boxShadow: '0 4px 12px rgba(29,158,117,0.3)' }}>
          Try Free →
        </a>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>

        {/* HERO */}
        <div style={{ padding: '3rem 0 2.5rem', borderBottom: '1px solid var(--lw-border)', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-accent)', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(29,158,117,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)' }}>
              Real Estate Guide
            </span>
            <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>{guide.readTime}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.625rem, 4vw, 2.5rem)', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.03em', lineHeight: '1.2', margin: '0 0 1rem', maxWidth: '700px' }}>
            {guide.title}
          </h1>
          <p style={{ fontSize: '1.0625rem', color: 'var(--lw-text-muted)', lineHeight: '1.7', margin: 0, maxWidth: '600px' }}>
            {guide.intro}
          </p>
        </div>

        {/* TABLE OF CONTENTS */}
        <div style={{ ...cardBase, marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.875rem' }}>
            In this guide
          </p>
          <ol style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {guide.toc.map((item) => (
              <li key={item.id} style={{ lineHeight: '1.5' }}>
                <a
                  href={`#${item.id}`}
                  style={{ color: 'var(--lw-text)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ARTICLE CONTENT */}
        <article style={{ marginBottom: '3rem' }}>
          {guide.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              style={{ marginBottom: '3rem', scrollMarginTop: '80px' }}
            >
              <h2 style={{
                fontSize: '1.375rem',
                fontWeight: '800',
                color: 'var(--lw-text)',
                letterSpacing: '-0.025em',
                lineHeight: '1.3',
                margin: '0 0 1.125rem',
                paddingBottom: '0.75rem',
                borderBottom: '2px solid rgba(29,158,117,0.15)',
              }}>
                {section.heading}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {section.paragraphs.map((para, i) => (
                  <p key={i} style={{ fontSize: '15px', color: 'var(--lw-text)', lineHeight: '1.8', margin: 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        {/* CTA CARD */}
        <div style={{ background: 'linear-gradient(135deg, rgba(29,158,117,0.08), rgba(8,80,65,0.05))', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.25)', padding: '2.5rem', marginBottom: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.75rem' }}>
            Ready to put this into practice?
          </p>
          <h3 style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.025em', margin: '0 0 0.75rem' }}>
            Try this in Listing Whisperer
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', lineHeight: '1.7', margin: '0 0 1.75rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
            Stop writing from scratch. Use AI to generate professional copy, presentations, and follow-up messages in seconds.
          </p>
          <a
            href={guide.ctaLink}
            style={{ display: 'inline-block', padding: '13px 30px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 20px rgba(29,158,117,0.35)' }}
          >
            {guide.ctaLabel} →
          </a>
        </div>

        {/* RELATED GUIDES */}
        {relatedGuides.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em', margin: '0 0 1.25rem' }}>
              Related Guides
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {relatedGuides.map((related) => (
                <a
                  key={related.slug}
                  href={`/learn/${related.slug}`}
                  className="learn-related-card"
                  style={{ ...cardBase, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-accent)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
                    Guide
                  </p>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4', margin: 0 }}>
                    {related.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.6', margin: 0, flexGrow: 1 }}>
                    {related.description}
                  </p>
                  <span style={{ fontSize: '13px', color: 'var(--lw-accent)', fontWeight: '700' }}>
                    Read guide →
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid var(--lw-border)' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--lw-text-muted)', margin: 0 }}>
            Powered by{' '}
            <a href="/" style={{ color: 'var(--lw-accent)', textDecoration: 'none', fontWeight: '700' }}>ListingWhisperer.com</a>
            {' · '}
            <a href="/learn" style={{ color: 'var(--lw-text-muted)', textDecoration: 'none' }}>All Guides</a>
          </p>
        </div>

      </div>
    </main>
  )
}
