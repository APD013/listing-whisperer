'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import Navbar from '../components/Navbar'
import ToolHandoff from '../components/ToolHandoff'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Listing = {
  id: string
  name: string | null
  property_type: string | null
  neighborhood: string | null
  price: string | null
  created_at: string
  status: string | null
  list_price: string | null
  sold_price: string | null
  days_on_market: number | null
  price_changes: number | null
  showings: number | null
  offers: number | null
  performance_notes: string | null
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  'Active':    { bg: 'rgba(29,158,117,0.12)',  color: '#1D9E75' },
  'Pending':   { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  'Sold':      { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  'Withdrawn': { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
}

export default function ListingPerformancePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Listing>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await loadListings(user.id)
    }
    init()
  }, [])

  const loadListings = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('id, name, property_type, neighborhood, price, created_at, status, list_price, sold_price, days_on_market, price_changes, showings, offers, performance_notes')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const openEdit = (listing: Listing) => {
    setEditingId(listing.id)
    setEditForm({
      status: listing.status || 'Active',
      list_price: listing.list_price || listing.price || '',
      sold_price: listing.sold_price || '',
      days_on_market: listing.days_on_market ?? undefined,
      price_changes: listing.price_changes ?? undefined,
      showings: listing.showings ?? undefined,
      offers: listing.offers ?? undefined,
      performance_notes: listing.performance_notes || '',
    })
  }

  const saveEdit = async () => {
    if (!editingId || !userId) return
    setSaving(true)
    await supabase.from('listings').update(editForm).eq('id', editingId)
    setSaving(false)
    setEditingId(null)
    await loadListings(userId)
  }

  const activeListings = listings.filter(l => (l.status || 'Active') === 'Active')
  const soldListings = listings.filter(l => l.status === 'Sold')
  const thisYear = new Date().getFullYear()
  const soldThisYear = soldListings.filter(l => new Date(l.created_at).getFullYear() === thisYear)
  const domValues = listings.filter(l => l.days_on_market != null).map(l => l.days_on_market!)
  const avgDom = domValues.length ? domValues.reduce((a, b) => a + b, 0) / domValues.length : null
  const ratios = soldListings
    .filter(l => l.sold_price && l.list_price)
    .map(l => {
      const sold = parseFloat(l.sold_price!.replace(/[^0-9.]/g, ''))
      const list = parseFloat(l.list_price!.replace(/[^0-9.]/g, ''))
      return list > 0 ? (sold / list) * 100 : null
    })
    .filter((r): r is number => r !== null)
  const avgRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null

  const cardBase = {
    background: 'var(--lw-card)',
    borderRadius: '16px',
    border: '1px solid var(--lw-border)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px',
    color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif',
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '600' as const, color: 'var(--lw-text-muted)',
    display: 'block' as const, marginBottom: '4px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <Navbar />

      {/* EDIT MODAL */}
      {editingId && (
        <div onClick={() => setEditingId(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid var(--lw-border)', padding: '2rem', width: '100%', maxWidth: '520px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--lw-text)', margin: 0 }}>Edit Performance</h3>
              <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'var(--lw-text-muted)', fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={editForm.status || 'Active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                  {['Active', 'Pending', 'Sold', 'Withdrawn'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>List Price</label>
                <input placeholder="$500,000" value={editForm.list_price || ''} onChange={e => setEditForm({ ...editForm, list_price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sold Price</label>
                <input placeholder="$495,000" value={editForm.sold_price || ''} onChange={e => setEditForm({ ...editForm, sold_price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Days on Market</label>
                <input type="number" min="0" placeholder="0" value={editForm.days_on_market ?? ''} onChange={e => setEditForm({ ...editForm, days_on_market: e.target.value ? parseInt(e.target.value) : undefined })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Price Changes</label>
                <input type="number" min="0" placeholder="0" value={editForm.price_changes ?? ''} onChange={e => setEditForm({ ...editForm, price_changes: e.target.value ? parseInt(e.target.value) : undefined })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Showings</label>
                <input type="number" min="0" placeholder="0" value={editForm.showings ?? ''} onChange={e => setEditForm({ ...editForm, showings: e.target.value ? parseInt(e.target.value) : undefined })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Offers</label>
                <input type="number" min="0" placeholder="0" value={editForm.offers ?? ''} onChange={e => setEditForm({ ...editForm, offers: e.target.value ? parseInt(e.target.value) : undefined })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Performance Notes</label>
              <textarea placeholder="Notes about this listing's performance..." value={editForm.performance_notes || ''} onChange={e => setEditForm({ ...editForm, performance_notes: e.target.value })} style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' as const }} />
            </div>
            <button onClick={saveEdit} disabled={saving} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.75rem', boxShadow: '0 0 60px rgba(29,158,117,0.2)' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>PERFORMANCE</div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: '800', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Listing Performance Tracker</h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: '1.7', maxWidth: '540px' }}>Track every listing from active to sold. Monitor days on market, price changes, showings, and offers.</p>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Active Listings',  value: activeListings.length,                      icon: '🏠', color: '#1D9E75' },
            { label: 'Avg Days on Market', value: avgDom != null ? `${Math.round(avgDom)}d` : '—', icon: '📅', color: '#f59e0b' },
            { label: 'Sold This Year',   value: soldThisYear.length,                         icon: '🏆', color: '#6366f1' },
            { label: 'Avg Sale-to-List', value: avgRatio != null ? `${avgRatio.toFixed(1)}%` : '—', icon: '📊', color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} style={{ ...cardBase, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${stat.color}18`, border: `1px solid ${stat.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{stat.icon}</div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', margin: 0, letterSpacing: '0.5px' }}>{stat.label.toUpperCase()}</p>
              </div>
              <p style={{ fontSize: '1.875rem', fontWeight: '800', color: stat.color, margin: 0, letterSpacing: '-0.03em' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* LISTINGS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--lw-text-muted)', fontSize: '14px' }}>Loading listings...</div>
        ) : listings.length === 0 ? (
          <div style={{ ...cardBase, padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)', margin: '0 0 8px' }}>No listings yet.</p>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', margin: '0 0 1.5rem' }}>Start by creating your first listing.</p>
            <a href="/quick-listing" style={{ display: 'inline-block', padding: '11px 24px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
              Start a Listing →
            </a>
          </div>
        ) : (
          <div style={{ ...cardBase, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--lw-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', margin: 0 }}>All Listings ({listings.length})</p>
            </div>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--lw-border)' }}>
                    {['Listing', 'Status', 'List Price', 'Sold Price', 'DOM', 'Price ↓', 'Showings', 'Offers', ''].map(col => (
                      <th key={col} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '0.5px', whiteSpace: 'nowrap' as const, background: 'var(--lw-input)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, i) => {
                    const status = listing.status || 'Active'
                    const sc = STATUS_COLORS[status] || STATUS_COLORS['Active']
                    return (
                      <tr key={listing.id} style={{ borderBottom: i < listings.length - 1 ? '1px solid var(--lw-border)' : 'none', transition: 'background 0.15s' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--lw-input)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '13px 16px', maxWidth: '200px' }}>
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--lw-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {listing.name || listing.neighborhood || listing.property_type || 'Untitled'}
                          </p>
                          {listing.name && listing.neighborhood && (
                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--lw-text-muted)' }}>{listing.neighborhood}</p>
                          )}
                        </td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' as const }}>
                          <span style={{ background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>{status}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: 'var(--lw-text)', whiteSpace: 'nowrap' as const }}>{listing.list_price || listing.price || '—'}</td>
                        <td style={{ padding: '13px 16px', color: listing.sold_price ? '#6366f1' : 'var(--lw-text-muted)', fontWeight: listing.sold_price ? '600' : '400', whiteSpace: 'nowrap' as const }}>{listing.sold_price || '—'}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--lw-text)', textAlign: 'center' as const }}>{listing.days_on_market ?? '—'}</td>
                        <td style={{ padding: '13px 16px', color: listing.price_changes ? '#ef4444' : 'var(--lw-text-muted)', textAlign: 'center' as const, fontWeight: listing.price_changes ? '600' : '400' }}>{listing.price_changes ?? '—'}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--lw-text)', textAlign: 'center' as const }}>{listing.showings ?? '—'}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--lw-text)', textAlign: 'center' as const }}>{listing.offers ?? '—'}</td>
                        <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' as const }}>
                          <button onClick={() => openEdit(listing)} style={{ padding: '6px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--lw-accent)', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <ToolHandoff from="listing-performance" handoffs={[
          { emoji: '🚀', text: 'Build your full launch kit', cta: 'Launch Kit', href: '/launch-kit' },
          { emoji: '📉', text: 'Prepare a price drop kit', cta: 'Price Drop', href: '/price-drop' },
        ]} />
      </div>
    </main>
  )
}
