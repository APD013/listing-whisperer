'use client'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function clean(text: string): string {
  return text
    .replace(/\[([^\]]+)\]/g, '')
    .replace(/---+/g, '')
    .replace(/\*\*/g, '')
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[︀-﻿]/gu, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const hStyle: React.CSSProperties = { background: '#f8fafb', borderLeft: '3px solid #1D9E75', padding: '6px 12px', marginBottom: '8px', borderRadius: '0 4px 4px 0' }
const hLabel: React.CSSProperties = { fontSize: '9px', fontWeight: 700, color: '#1D9E75', textTransform: 'uppercase', letterSpacing: '0.6px' }
const body: React.CSSProperties = { fontSize: '11px', lineHeight: 1.65, color: '#1a1a2e', whiteSpace: 'pre-wrap', padding: '0 4px', hyphens: 'none', overflowWrap: 'normal', wordBreak: 'normal' }
const sectionWrap: React.CSSProperties = { marginBottom: '18px', pageBreakInside: 'avoid' }

function PrintContent() {
  const id = useSearchParams().get('id')
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    supabase.from('market_snapshots').select('*').eq('id', id).single().then(({ data }) => {
      setRecord(data); setLoading(false)
    })
  }, [id])

  useEffect(() => { if (record) setTimeout(() => window.print(), 500) }, [record])

  if (loading) return <p style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>Preparing document…</p>
  if (!record) return <p style={{ padding: '2rem' }}>Record not found.</p>

  const o = record.outputs || {}
  const area = record.neighborhood || 'Untitled'

  const combined = (o.market_summary || '') + ' ' + (o.price_trends || '')
  const priceMatch = combined.match(/\$[\d,.]+[kKmM]?/)
  const domMatch = combined.match(/\d+[-–]\d+\s*days?/i) || combined.match(/\d+\s*days?/i)
  const condition = /seller['']?s\s+market/i.test(o.buyer_seller_assessment || '') ? "Seller's Market"
    : /buyer['']?s\s+market/i.test(o.buyer_seller_assessment || '') ? "Buyer's Market" : "Balanced Market"

  const stats = [
    { label: 'Median Price', value: priceMatch ? priceMatch[0] : '—' },
    { label: 'Days on Market', value: domMatch ? domMatch[0] : '—' },
    { label: 'Market Condition', value: condition },
  ]

  const sections = [
    { label: 'Market Summary', content: o.market_summary },
    { label: 'Price Trends', content: o.price_trends },
    { label: 'Inventory Analysis', content: o.inventory_analysis },
    { label: 'Buyer / Seller Assessment', content: o.buyer_seller_assessment },
    { label: 'Client Email', content: o.client_email },
  ]

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif', maxWidth: '760px', margin: '0 auto', padding: '24px 20px', color: '#1a1a2e', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #1D9E75', paddingBottom: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            <span style={{ color: '#1a1a2e' }}>Listing</span><span style={{ color: '#1D9E75' }}>Whisperer</span>
          </div>
          <div style={{ fontSize: '10px', color: '#718096', marginTop: '2px', fontFamily: 'sans-serif' }}>Market Snapshot</div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'sans-serif' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e' }}>{area}</div>
          <div style={{ fontSize: '10px', color: '#718096' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ flex: 1, background: '#f8fafb', borderRadius: '6px', borderTop: '2px solid #1D9E75', padding: '10px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1D9E75' }}>{stat.value}</div>
            <div style={{ fontSize: '9px', color: '#718096', marginTop: '3px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {sections.filter(s => s.content?.trim()).map((s, i) => (
        <div key={i} style={sectionWrap}>
          <div style={hStyle}><span style={hLabel}>{s.label}</span></div>
          <div style={body}>{clean(s.content)}</div>
        </div>
      ))}

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#718096', fontFamily: 'sans-serif' }}>
        <span>Generated by ListingWhisperer.com</span>
        <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <button onClick={() => window.print()} style={{ padding: '10px 28px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: 600 }}>
          🖨️ Print / Save as PDF
        </button>
      </div>
    </div>
  )
}

export default function PrintMarketSnapshot() {
  return <Suspense fallback={<p style={{ padding: '2rem', textAlign: 'center' }}>Loading…</p>}><PrintContent /></Suspense>
}
