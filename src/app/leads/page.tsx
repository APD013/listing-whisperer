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
    }
    getUser()
  }, [])

  const loadLeads = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', uid)
      .order('id', { ascending: false })
    if (data) setLeads(data)
    setLoading(false)
  }

  const saveLead = async () => {
    if (!form.name) { alert('Please enter a name!'); return }
    setSaving(true)
    if (editingLead) {
      await supabase.from('leads').update(form).eq('id', editingLead.id)
    } else {
      await supabase.from('leads').insert({ ...form, user_id: userId })
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

  const inputStyle = { width:'100%', padding:'10px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
          <a href="/" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'2rem'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
          <div>
            <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>👥 Leads & Clients</h1>
            <p style={{fontSize:'14px',color:'#6b7280'}}>{leads.length} total leads</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingLead(null); setForm(emptyForm) }}
            style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
            + Add Lead
          </button>
        </div>

        {/* STATUS FILTER */}
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'1.5rem'}}>
          {['All', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{padding:'6px 14px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontWeight: filterStatus === s ? '600' : '400',
                borderColor: filterStatus === s ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                background: filterStatus === s ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                color: filterStatus === s ? '#1D9E75' : '#6b7280'}}>
              {s}
            </button>
          ))}
        </div>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))',gap:'12px',marginBottom:'1.5rem'}}>
          {STATUS_OPTIONS.map(s => (
            <div key={s} style={{...cardStyle,padding:'1rem',textAlign:'center'}}>
              <p style={{fontSize:'1.5rem',fontWeight:'700',color: STATUS_COLORS[s],margin:'0 0 4px'}}>
                {leads.filter(l => l.status === s).length}
              </p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>{s}</p>
            </div>
          ))}
        </div>

        {/* LEADS LIST */}
        {loading ? (
          <div style={{...cardStyle,textAlign:'center',padding:'3rem'}}>
            <p style={{color:'#6b7280'}}>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{...cardStyle,textAlign:'center',padding:'3rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>👥</div>
            <h2 style={{fontSize:'1.25rem',fontWeight:'600',color:'#f0f0f0',marginBottom:'8px'}}>No leads yet</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem'}}>Add your first potential client to get started.</p>
            <button onClick={() => setShowForm(true)}
              style={{padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
              + Add First Lead
            </button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {filteredLeads.map(lead => (
              <div key={lead.id} style={{...cardStyle,padding:'1.25rem'}}
                onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'4px'}}>
                      <h3 style={{fontSize:'15px',fontWeight:'600',color:'#f0f0f0',margin:'0'}}>{lead.name}</h3>
                      <span style={{fontSize:'11px',fontWeight:'600',padding:'2px 10px',borderRadius:'20px',background: `${STATUS_COLORS[lead.status]}20`,color: STATUS_COLORS[lead.status],border:`1px solid ${STATUS_COLORS[lead.status]}40`}}>
                        {lead.status}
                      </span>
                    </div>
                    <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                      {lead.phone && <span style={{fontSize:'12px',color:'#6b7280'}}>📞 {lead.phone}</span>}
                      {lead.email && <span style={{fontSize:'12px',color:'#6b7280'}}>📧 {lead.email}</span>}
                      {lead.address && <span style={{fontSize:'12px',color:'#6b7280'}}>🏠 {lead.address}</span>}
                      {lead.est_price && <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'600'}}>💰 {lead.est_price}</span>}
                      {lead.last_contacted && <span style={{fontSize:'12px',color:'#6b7280'}}>📅 Last: {lead.last_contacted}</span>}
                    </div>
                    {lead.notes && (
                      <p style={{fontSize:'12px',color:'#6b7280',marginTop:'6px',fontStyle:'italic'}}>"{lead.notes}"</p>
                    )}
                    {lead.zillow_url && (
                      <a href={lead.zillow_url} target="_blank" rel="noopener noreferrer"
                        style={{fontSize:'12px',color:'#1D9E75',textDecoration:'none',marginTop:'4px',display:'inline-block'}}>
                        🔗 View on Zillow →
                      </a>
                    )}
                  </div>
                  <div style={{display:'flex',gap:'8px',marginLeft:'12px',flexShrink:0}}>
                    <a href={`/dashboard`}
                      style={{fontSize:'11px',padding:'6px 10px',borderRadius:'8px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',textDecoration:'none',fontWeight:'500',whiteSpace:'nowrap'}}>
                      ✨ Generate Copy
                    </a>
                    <button onClick={() => openEdit(lead)}
                      style={{fontSize:'11px',padding:'6px 10px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                      Edit
                    </button>
                    <button onClick={() => deleteLead(lead.id)}
                      style={{fontSize:'11px',padding:'6px 10px',borderRadius:'8px',background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.2)',cursor:'pointer'}}>
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
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem',overflowY:'auto'}}>
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',maxWidth:'520px',width:'100%',boxShadow:'0 0 60px rgba(0,0,0,0.5)',position:'relative',margin:'auto'}}>
            <button onClick={() => { setShowForm(false); setEditingLead(null); setForm(emptyForm) }}
              style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',fontSize:'16px',cursor:'pointer'}}>✕</button>

            <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'1.5rem'}}>
              {editingLead ? '✏️ Edit Lead' : '+ Add New Lead'}
            </h2>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Full Name *</label>
                <input placeholder="Jane Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input placeholder="(714) 555-0100" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input placeholder="jane@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Property Address</label>
                <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Est. Listing Price</label>
                <input placeholder="$899,000" value={form.est_price} onChange={e=>setForm({...form,est_price:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Last Contacted</label>
                <input type="date" value={form.last_contacted} onChange={e=>setForm({...form,last_contacted:e.target.value})} style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Zillow URL</label>
                <input placeholder="https://zillow.com/..." value={form.zillow_url} onChange={e=>setForm({...form,zillow_url:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Notes</label>
                <textarea placeholder="Seller motivation, property condition, timeline, anything important..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  style={{...inputStyle, minHeight:'80px', resize:'vertical' as const}}/>
              </div>
            </div>

            <button onClick={saveLead} disabled={saving}
              style={{width:'100%',padding:'13px',background: saving ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: saving ? 'not-allowed' : 'pointer',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
              {saving ? 'Saving...' : editingLead ? 'Save Changes' : 'Add Lead'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}