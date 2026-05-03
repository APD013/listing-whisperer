'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STATUS_OPTIONS = ['New Lead', 'Meeting Scheduled', 'Listed', 'Under Contract', 'Sold', 'Dead']
const STATUS_COLORS: Record<string, string> = {
  'New Lead': '#3b82f6',
  'Meeting Scheduled': '#f59e0b',
  'Listed': '#1D9E75',
  'Under Contract': '#8b5cf6',
  'Sold': '#10b981',
  'Dead': '#6b7280',
}

export default function LeadsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLead, setEditingLead] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')

  const emptyForm = {
    name: '', phone: '', email: '', address: '',
    est_price: '', status: 'New Lead', last_contacted: '',
    notes: '', zillow_url: ''
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
      await loadLeads(user.id)
      window.addEventListener('lead_added', () => loadLeads(user.id))
    }
    getUser()
  }, [])

  const loadLeads = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('leads').select('*').eq('user_id', uid).order('id', { ascending: false })
    if (data) setLeads(data)
    setLoading(false)
  }

  const saveLead = async () => {
    if (!form.name) { alert('Please enter a name!'); return }
    setSaving(true)
    if (editingLead) {
      const { error } = await supabase.from('leads').update(form).eq('id', editingLead.id)
      if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('leads').insert({ ...form, user_id: userId })
      if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    }
    await loadLeads(userId!)
    setShowForm(false)
    setEditingLead(null)
    setForm(emptyForm)
    setSaving(false)
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const openEdit = (lead: any) => {
    setEditingLead(lead)
    setForm({
      name: lead.name || '', phone: lead.phone || '', email: lead.email || '',
      address: lead.address || '', est_price: lead.est_price || '',
      status: lead.status || 'New Lead', last_contacted: lead.last_contacted || '',
      notes: lead.notes || '', zillow_url: lead.zillow_url || ''
    })
    setShowForm(true)
  }

  const filteredLeads = filterStatus === 'All' ? leads : leads.filter(l => l.status === filterStatus)

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '600' as const, color: 'var(--lw-text-muted)',
    display: 'block' as const, marginBottom: '6px'
  }

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle' }}>PRO</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
          <a href="/" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>Sign out</a>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>👥 Leads & Clients</h1>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', margin: 0 }}>{leads.length} total leads</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingLead(null); setForm(emptyForm) }}
            style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(29,158,117,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            + Add Lead
          </button>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
          {STATUS_OPTIONS.map(s => (
            <div key={s} style={{ ...cardStyle, padding: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', color: STATUS_COLORS[s], margin: '0 0 4px', letterSpacing: '-0.03em' }}>
                {leads.filter(l => l.status === s).length}
              </p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: 0 }}>{s}</p>
            </div>
          ))}
        </div>

        {/* STATUS FILTER */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {['All', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{
                padding: '7px 14px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer',
                fontWeight: filterStatus === s ? '700' : '500',
                borderColor: filterStatus === s ? '#1D9E75' : 'var(--lw-border)',
                background: filterStatus === s ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)',
                color: filterStatus === s ? '#1D9E75' : 'var(--lw-text-muted)',
                fontFamily: 'var(--font-plus-jakarta), sans-serif'
              }}>
              {s}
            </button>
          ))}
        </div>

        {/* LEADS LIST */}
        {loading ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--lw-text-muted)', fontWeight: '500' }}>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '8px' }}>No leads yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem' }}>Add your first potential client to get started.</p>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              + Add First Lead
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredLeads.map(lead => (
              <div key={lead.id} style={{ ...cardStyle, padding: '1.25rem', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(29,158,117,0.35)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,158,117,0.08)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lw-border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--lw-text)', margin: 0 }}>{lead.name}</h3>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: `${STATUS_COLORS[lead.status]}18`, color: STATUS_COLORS[lead.status], border: `1px solid ${STATUS_COLORS[lead.status]}35` }}>
                        {lead.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {lead.phone && <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>📞 {lead.phone}</span>}
                      {lead.email && <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>📧 {lead.email}</span>}
                      {lead.address && <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>🏠 {lead.address}</span>}
                      {lead.est_price && <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700' }}>💰 {lead.est_price}</span>}
                      {lead.last_contacted && <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>📅 Last: {lead.last_contacted}</span>}
                    </div>
                    {lead.notes && (
                      <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', marginTop: '6px', fontStyle: 'italic', lineHeight: '1.5' }}>"{lead.notes}"</p>
                    )}
                    {lead.zillow_url && (
                      <a href={lead.zillow_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', marginTop: '4px', display: 'inline-block', fontWeight: '600' }}>
                        🔗 View on Zillow →
                      </a>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                    <a href={`/dashboard?generate=true&neighborhood=${encodeURIComponent(lead.address || '')}&price=${encodeURIComponent(lead.est_price || '')}&name=${encodeURIComponent(lead.name || '')}`}
                      style={{ fontSize: '11px', padding: '7px 11px', borderRadius: '8px', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', textDecoration: 'none', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      ✨ Generate
                    </a>
                    <button onClick={() => openEdit(lead)}
                      style={{ fontSize: '11px', padding: '7px 11px', borderRadius: '8px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                      Edit
                    </button>
                    <button onClick={() => deleteLead(lead.id)}
                      style={{ fontSize: '11px', padding: '7px 11px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid var(--lw-border)', padding: '2rem', maxWidth: '520px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => { setShowForm(false); setEditingLead(null); setForm(emptyForm) }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', color: 'var(--lw-text-muted)', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>✕</button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 1.5rem', letterSpacing: '-0.02em' }}>
              {editingLead ? '✏️ Edit Lead' : '+ Add New Lead'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Full Name *</label>
                <input placeholder="Jane Smith" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input placeholder="(714) 555-0100" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input placeholder="jane@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Property Address</label>
                <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Est. Listing Price</label>
                <input placeholder="$899,000" value={form.est_price} onChange={e => setForm({ ...form, est_price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Last Contacted</label>
                <input type="date" value={form.last_contacted} onChange={e => setForm({ ...form, last_contacted: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zillow URL</label>
                <input placeholder="https://zillow.com/..." value={form.zillow_url} onChange={e => setForm({ ...form, zillow_url: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  placeholder="Seller motivation, property condition, timeline..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                />
              </div>
            </div>

            <button onClick={saveLead} disabled={saving}
              style={{ width: '100%', padding: '13px', background: saving ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(29,158,117,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {saving ? 'Saving...' : editingLead ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}