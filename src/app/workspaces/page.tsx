'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PROPERTY_TYPES = ['Single family', 'Condo', 'Townhome', 'Luxury estate', 'Multi-family', 'Land', 'Commercial']
const STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']

const STATUS_COLORS: Record<string, string> = {
  Active: '#1D9E75',
  Pending: '#f59e0b',
  Sold: '#6366f1',
  Cancelled: '#ef4444',
}

const TOTAL_ASSETS = 8
const ASSET_KEYS = [
  { key: 'mls_description', label: 'MLS Description' },
  { key: 'social_posts', label: 'Social Posts' },
  { key: 'launch_kit', label: 'Launch Kit' },
  { key: 'seller_prep', label: 'Seller Prep' },
  { key: 'open_house_kit', label: 'Open House Kit' },
  { key: 'virtual_staging', label: 'Virtual Staging' },
  { key: 'follow_up', label: 'Follow-Up' },
  { key: 'price_drop_kit', label: 'Price Drop Kit' },
]
const FILTER_TABS = ['All', 'Active', 'Pending', 'Sold']

function assetCount(assets: any) {
  if (!assets || typeof assets !== 'object') return 0
  return Object.values(assets).filter(v => v && String(v).trim().length > 0).length
}

function nextMissingAsset(assets: any): string | null {
  if (!assets) return ASSET_KEYS[0].label
  const missing = ASSET_KEYS.find(a => !assets[a.key] || !String(assets[a.key]).trim())
  return missing ? missing.label : null
}

export default function WorkspacesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')
  const [form, setForm] = useState({
    address: '', city: '', state: '', propertyType: 'Single family',
    beds: '', baths: '', sqft: '', price: '', status: 'Active',
  })

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '14px', border: '1px solid var(--lw-border)', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
    input: { width: '100%', padding: '10px 13px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '10px 13px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const loadWorkspaces = async (uid: string) => {
    const { data } = await supabase
      .from('listing_workspaces')
      .select('id, address, city, state, property_type, beds, baths, sqft, price, status, assets, updated_at, created_at')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false })
    if (data) setWorkspaces(data)
    setLoaded(true)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadWorkspaces(user.id)
    }
    getUser()
  }, [])

  const handleCreate = async () => {
    if (!form.address.trim()) { alert('Property address is required.'); return }
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('listing_workspaces')
        .insert({
          user_id: userId,
          address: form.address.trim(),
          city: form.city,
          state: form.state,
          property_type: form.propertyType,
          beds: form.beds,
          baths: form.baths,
          sqft: form.sqft,
          price: form.price,
          status: form.status,
          assets: {},
          notes: '',
        })
        .select('id')
        .single()
      if (error) throw error
      router.push(`/workspace/${data.id}`)
    } catch(e: any) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workspace? This cannot be undone.')) return
    await supabase.from('listing_workspaces').delete().eq('id', id)
    if (userId) loadWorkspaces(userId)
  }

  return (
    <main style={styles.page}>
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.03em' }}>My Listing Workspaces</h1>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', margin: 0 }}>One workspace per listing — all your copy, tools, and notes in one place.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 0 20px rgba(29,158,117,0.25)', flexShrink: 0 }}
          >
            + New Workspace
          </button>
        </div>

        {/* Filter Tabs */}
        {loaded && workspaces.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '7px 16px', borderRadius: '20px', border: '1px solid',
                  borderColor: activeFilter === tab ? '#1D9E75' : 'var(--lw-border)',
                  background: activeFilter === tab ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)',
                  color: activeFilter === tab ? '#1D9E75' : 'var(--lw-text-muted)',
                  fontSize: '12px', fontWeight: activeFilter === tab ? '700' : '500',
                  cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                {tab}
                {tab !== 'All' && (
                  <span style={{ marginLeft: '5px', fontSize: '10px', opacity: 0.7 }}>
                    {workspaces.filter(w => w.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Workspace list */}
        {!loaded ? null : workspaces.length === 0 ? (
          <div style={{ ...styles.card, textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📁</div>
            <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 8px' }}>No workspaces yet.</p>
            <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: '0 0 20px', lineHeight: '1.6' }}>Create your first listing workspace to get started.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              + New Workspace
            </button>
          </div>
        ) : (() => {
          const filtered = activeFilter === 'All' ? workspaces : workspaces.filter(w => w.status === activeFilter)
          if (filtered.length === 0) return (
            <div style={{ ...styles.card, textAlign: 'center', padding: '2rem', color: 'var(--lw-text-muted)', fontSize: '13px' }}>
              No {activeFilter} workspaces.
            </div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map(ws => {
                const count = assetCount(ws.assets)
                const statusColor = STATUS_COLORS[ws.status] || '#6b7280'
                const nextMissing = nextMissingAsset(ws.assets)
                const pct = Math.round((count / TOTAL_ASSETS) * 100)
                return (
                  <div key={ws.id} style={{ ...styles.card, borderLeft: `3px solid ${statusColor}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--lw-text)' }}>{ws.address}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>{ws.status}</span>
                        </div>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--lw-text-muted)' }}>
                          {[ws.city, ws.state, ws.property_type].filter(Boolean).join(' · ')}
                          {ws.price && ` · ${ws.price}`}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ flex: 1, height: '5px', background: 'var(--lw-border)', borderRadius: '3px', overflow: 'hidden', maxWidth: '200px' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: count === TOTAL_ASSETS ? 'linear-gradient(90deg,#d4af37,#b8962e)' : 'linear-gradient(90deg,#1D9E75,#085041)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: count > 0 ? (count === TOTAL_ASSETS ? '#d4af37' : '#1D9E75') : 'var(--lw-text-muted)', flexShrink: 0 }}>
                            {count === TOTAL_ASSETS ? '🎉 Complete' : `${count}/${TOTAL_ASSETS} assets`}
                          </span>
                        </div>
                        {nextMissing && count < TOTAL_ASSETS && (
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--lw-text-muted)' }}>
                            Next: <span style={{ color: '#f59e0b', fontWeight: '600' }}>{nextMissing}</span>
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                        <a
                          href={`/workspace/${ws.id}`}
                          style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}
                        >
                          Open →
                        </a>
                        <button
                          onClick={() => handleDelete(ws.id)}
                          style={{ padding: '8px 14px', background: 'var(--lw-input)', color: '#6b7280', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--lw-card)', borderRadius: '18px', border: '1px solid var(--lw-border)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>New Listing Workspace</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--lw-text-muted)', padding: '0 4px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Property Address *</label>
                <input placeholder="123 Main St" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={styles.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>City</label>
                  <input placeholder="Newport Beach" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>State</label>
                  <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={styles.select}>
                    <option value="">Select</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Property Type</label>
                <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} style={styles.select}>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>Beds</label>
                  <input placeholder="4" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Baths</label>
                  <input placeholder="3" value={form.baths} onChange={e => setForm({ ...form, baths: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Sq Ft</label>
                  <input placeholder="2,200" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>List Price</label>
                  <input placeholder="$850,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={styles.select}>
                    <option>Active</option>
                    <option>Pending</option>
                    <option>Sold</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{ flex: 1, padding: '12px', background: saving ? '#a0c4ba' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Creating...' : 'Create Workspace →'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '12px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
