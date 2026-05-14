'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import { pdfHeader, pdfSections } from '../../lib/pdfStyles'
import Navbar from '../../components/Navbar'

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

const ASSET_DEFINITIONS = [
  { key: 'mls_description', label: 'MLS Description', icon: '🏠', href: '/quick-listing' },
  { key: 'social_posts', label: 'Social Posts', icon: '📱', href: '/social-planner' },
  { key: 'launch_kit', label: 'Launch Kit', icon: '🚀', href: '/launch-kit' },
  { key: 'seller_prep', label: 'Seller Prep', icon: '📋', href: '/seller-prep' },
  { key: 'open_house_kit', label: 'Open House Kit', icon: '🏡', href: '/open-house' },
  { key: 'virtual_staging', label: 'Virtual Staging', icon: '🛋️', href: '/virtual-staging' },
  { key: 'follow_up', label: 'Follow-Up', icon: '📩', href: '/follow-up' },
  { key: 'price_drop_kit', label: 'Price Drop Kit', icon: '💰', href: '/price-drop' },
]

export default function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [workspace, setWorkspace] = useState<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [viewAsset, setViewAsset] = useState<{ key: string; content: string } | null>(null)

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif', color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '14px', border: '1px solid var(--lw-border)', padding: '1.5rem', marginBottom: '1.25rem' },
    input: { width: '100%', padding: '10px 13px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '10px 13px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
    sectionHead: { fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)', letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 14px' },
  }

  const loadWorkspace = async (uid: string) => {
    const { data, error } = await supabase
      .from('listing_workspaces')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single()
    if (error || !data) { router.push('/dashboard'); return }
    setWorkspace(data)
    setNotes(data.notes || '')
    setEditForm({
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      propertyType: data.property_type || 'Single family',
      beds: data.beds || '',
      baths: data.baths || '',
      sqft: data.sqft || '',
      price: data.price || '',
      status: data.status || 'Active',
    })
    setLoaded(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lw_active_workspace', JSON.stringify({
        id: data.id,
        address: data.address,
        assets: data.assets,
        property_type: data.property_type,
        beds: data.beds,
        baths: data.baths,
        sqft: data.sqft,
        price: data.price,
      }))
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadWorkspace(user.id)
    }
    getUser()
  }, [id])

  const saveNotes = async () => {
    if (!workspace) return
    await supabase.from('listing_workspaces').update({ notes, updated_at: new Date().toISOString() }).eq('id', id)
  }

  const saveEdit = async () => {
    if (!editForm.address?.trim()) { alert('Address is required.'); return }
    setSavingEdit(true)
    const { error } = await supabase.from('listing_workspaces').update({
      address: editForm.address.trim(),
      city: editForm.city,
      state: editForm.state,
      property_type: editForm.propertyType,
      beds: editForm.beds,
      baths: editForm.baths,
      sqft: editForm.sqft,
      price: editForm.price,
      status: editForm.status,
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (!error && userId) {
      await loadWorkspace(userId)
      setShowEditModal(false)
    }
    setSavingEdit(false)
  }

  const completedCount = workspace
    ? Object.values(workspace.assets || {}).filter((v: any) => v && String(v).trim().length > 0).length
    : 0

  const getNextActions = (assets: any) => {
    const actions: { label: string; desc: string; href: string; icon: string; priority: 'high' | 'medium' | 'low' }[] = []
    if (!assets?.mls_description) actions.push({ label: 'Create MLS Description', desc: 'Generate listing copy for MLS and marketing', href: `/quick-listing?workspace=${id}`, icon: '🏠', priority: 'high' })
    if (assets?.mls_description && !assets?.launch_kit) actions.push({ label: 'Build 7-Day Launch Kit', desc: 'Create a day-by-day marketing plan for launch', href: `/launch-kit?workspace=${id}`, icon: '🚀', priority: 'high' })
    if (assets?.mls_description && !assets?.social_posts) actions.push({ label: 'Create Social Posts', desc: 'Generate a full week of social content', href: `/social-planner?workspace=${id}`, icon: '📱', priority: 'medium' })
    if (!assets?.seller_prep) actions.push({ label: 'Prep Seller Meeting', desc: 'Talking points and objection responses', href: `/seller-prep?workspace=${id}`, icon: '📋', priority: 'medium' })
    if (!assets?.virtual_staging) actions.push({ label: 'Stage Photos with AI', desc: 'Virtually stage empty rooms', href: `/virtual-staging?workspace=${id}`, icon: '🛋️', priority: 'low' })
    if (!assets?.open_house_kit) actions.push({ label: 'Create Open House Kit', desc: 'Flyer, posts, and follow-up emails', href: `/open-house?workspace=${id}`, icon: '🏡', priority: 'low' })
    return actions.slice(0, 3)
  }

  const downloadFullPackage = () => {
    if (!workspace) return
    const doc = new jsPDF()
    const addr = workspace.address || 'Listing Package'
    const y = pdfHeader(doc, 'Full Listing Package', addr)
    const assets = workspace.assets || {}
    const sections = ASSET_DEFINITIONS
      .filter(a => assets[a.key])
      .map(a => ({ label: a.label, content: String(assets[a.key]) }))
    if (sections.length > 0) pdfSections(doc, sections, y, null)
    doc.save(`ListingPackage-${addr.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
  }

  if (!loaded) {
    return (
      <main style={styles.page}>
        <Navbar />
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--lw-text-muted)', fontSize: '14px' }}>Loading workspace...</p>
        </div>
      </main>
    )
  }

  if (!workspace) return null

  const statusColor = STATUS_COLORS[workspace.status] || '#6b7280'

  return (
    <main style={styles.page}>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Breadcrumb */}
        <a href="/workspaces" style={{ fontSize: '12px', color: 'var(--lw-text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' }}>
          ← My Workspaces
        </a>

        {/* HERO */}
        <div style={{ ...styles.card, background: 'linear-gradient(135deg, var(--lw-card) 0%, var(--lw-input) 100%)', borderLeft: `4px solid ${statusColor}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em' }}>{workspace.address}</h1>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                  {workspace.status}
                </span>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--lw-text-muted)' }}>
                {[workspace.city, workspace.state, workspace.property_type].filter(Boolean).join(' · ')}
                {(workspace.beds || workspace.baths) && ` · ${workspace.beds || ''}${workspace.beds && workspace.baths ? ' bd / ' : ''}${workspace.baths ? workspace.baths + ' ba' : ''}`}
                {workspace.sqft && ` · ${workspace.sqft} sq ft`}
                {workspace.price && ` · ${workspace.price}`}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--lw-text-muted)' }}>
                Last updated {new Date(workspace.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              style={{ padding: '8px 18px', background: 'var(--lw-input)', color: 'var(--lw-text)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 }}
            >
              ✏️ Edit Details
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
            <div style={{ flex: 1, height: '6px', background: 'var(--lw-border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(completedCount / 8) * 100}%`, background: 'linear-gradient(90deg,#1D9E75,#085041)', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '600', color: completedCount > 0 ? '#1D9E75' : 'var(--lw-text-muted)', flexShrink: 0 }}>
              {completedCount}/8 assets
            </span>
          </div>
        </div>

        {/* COMPLETION CELEBRATION */}
        {completedCount === 8 && (
          <div style={{ ...styles.card, background: 'linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.35)', borderLeft: '4px solid #d4af37' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#d4af37' }}>🎉 This listing workspace is complete!</p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--lw-text-muted)' }}>All 8 assets are ready. Download the full package to share with your seller.</p>
              </div>
              <button
                onClick={downloadFullPackage}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#d4af37,#b8962e)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' as const }}
              >
                ⬇ Download Full Listing Package
              </button>
            </div>
          </div>
        )}

        {/* ASSETS */}
        <div style={styles.card}>
          <p style={styles.sectionHead}>Assets</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '10px' }}>
            {ASSET_DEFINITIONS.map(asset => {
              const content = workspace.assets?.[asset.key]
              const exists = content && String(content).trim().length > 0
              return (
                <div
                  key={asset.key}
                  style={{
                    borderRadius: '12px',
                    border: exists ? '1px solid rgba(29,158,117,0.25)' : '1.5px dashed var(--lw-border)',
                    background: exists ? 'rgba(29,158,117,0.04)' : 'var(--lw-input)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '18px' }}>{asset.icon}</span>
                    {exists && (
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', letterSpacing: '0.3px' }}>
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: 'var(--lw-text)' }}>{asset.label}</p>
                  {exists ? (
                    <>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--lw-text-muted)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {String(content).slice(0, 100)}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setViewAsset({ key: asset.key, content: String(content) })}
                          style={{ padding: '5px 12px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '7px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          View
                        </button>
                        <a
                          href={`${asset.href}?workspace=${id}`}
                          style={{ padding: '5px 12px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '7px', fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}
                        >
                          Regenerate →
                        </a>
                      </div>
                    </>
                  ) : (
                    <a
                      href={`${asset.href}?workspace=${id}`}
                      style={{ marginTop: '4px', padding: '5px 12px', background: 'var(--lw-card)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '7px', fontSize: '11px', fontWeight: '600', textDecoration: 'none', alignSelf: 'flex-start' }}
                    >
                      Create →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RECOMMENDED NEXT ACTIONS */}
        {completedCount < 8 && (() => {
          const actions = getNextActions(workspace.assets || {})
          if (actions.length === 0) return null
          const priorityStyle = (p: string) => ({
            high: { color: '#1D9E75', bg: 'rgba(29,158,117,0.1)', border: 'rgba(29,158,117,0.2)' },
            medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
            low: { color: 'var(--lw-text-muted)', bg: 'var(--lw-input)', border: 'var(--lw-border)' },
          }[p] || { color: 'var(--lw-text-muted)', bg: 'var(--lw-input)', border: 'var(--lw-border)' })
          return (
            <div style={styles.card}>
              <p style={styles.sectionHead}>Recommended Next Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actions.map((action, i) => {
                  const ps = priorityStyle(action.priority)
                  return (
                    <a
                      key={i}
                      href={action.href}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', textDecoration: 'none', gap: '12px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{action.icon}</span>
                        <div>
                          <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{action.label}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--lw-text-muted)' }}>{action.desc}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 9px', borderRadius: '20px', background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, flexShrink: 0, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }}>
                        {action.priority}
                      </span>
                    </a>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* NOTES */}
        <div style={styles.card}>
          <p style={styles.sectionHead}>Notes</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes about this listing — seller motivations, showing feedback, pricing notes..."
            style={{ ...styles.input, minHeight: '100px', resize: 'vertical' as const }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--lw-text-muted)' }}>Auto-saves when you click away</p>
        </div>

        {/* ACTIVITY */}
        <div style={styles.card}>
          <p style={styles.sectionHead}>Activity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--lw-border)' }}>
              <span style={{ color: 'var(--lw-text-muted)' }}>Created</span>
              <span style={{ color: 'var(--lw-text)', fontWeight: '500' }}>{new Date(workspace.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid var(--lw-border)' }}>
              <span style={{ color: 'var(--lw-text-muted)' }}>Last updated</span>
              <span style={{ color: 'var(--lw-text)', fontWeight: '500' }}>{new Date(workspace.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0' }}>
              <span style={{ color: 'var(--lw-text-muted)' }}>Assets completed</span>
              <span style={{ color: completedCount > 0 ? '#1D9E75' : 'var(--lw-text-muted)', fontWeight: '600' }}>{completedCount} of 8</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--lw-card)', borderRadius: '18px', border: '1px solid var(--lw-border)', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Edit Property Details</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--lw-text-muted)', padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Property Address *</label>
                <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} style={styles.input} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>City</label>
                  <input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>State</label>
                  <select value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} style={styles.select}>
                    <option value="">Select</option>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Property Type</label>
                <select value={editForm.propertyType} onChange={e => setEditForm({ ...editForm, propertyType: e.target.value })} style={styles.select}>
                  {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>Beds</label>
                  <input value={editForm.beds} onChange={e => setEditForm({ ...editForm, beds: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Baths</label>
                  <input value={editForm.baths} onChange={e => setEditForm({ ...editForm, baths: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Sq Ft</label>
                  <input value={editForm.sqft} onChange={e => setEditForm({ ...editForm, sqft: e.target.value })} style={styles.input} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>List Price</label>
                  <input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={styles.input} />
                </div>
                <div>
                  <label style={styles.label}>Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={styles.select}>
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
                onClick={saveEdit}
                disabled={savingEdit}
                style={{ flex: 1, padding: '12px', background: savingEdit ? '#a0c4ba' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: savingEdit ? 'not-allowed' : 'pointer' }}
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '12px 20px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ASSET MODAL */}
      {viewAsset && (
        <div
          onClick={() => setViewAsset(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--lw-card)', borderRadius: '18px', border: '1px solid var(--lw-border)', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>
                {ASSET_DEFINITIONS.find(a => a.key === viewAsset.key)?.label}
              </h2>
              <button onClick={() => setViewAsset(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--lw-text-muted)', padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '13px', lineHeight: '1.8', color: 'var(--lw-text)', whiteSpace: 'pre-wrap', margin: 0 }}>{viewAsset.content}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
              <button
                onClick={() => { navigator.clipboard.writeText(viewAsset.content) }}
                style={{ padding: '9px 18px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Copy
              </button>
              <button onClick={() => setViewAsset(null)} style={{ padding: '9px 18px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
