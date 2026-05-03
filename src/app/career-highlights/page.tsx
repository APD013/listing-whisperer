'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CareerHighlightsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [highlights, setHighlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    address: '', price: '', closing_date: '', quote: '', notes: '', photo_url: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else setPlanLoaded(true)
      loadHighlights(user.id)
    }
    getUser()
  }, [])

  const loadHighlights = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('career_highlights').select('*').eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (data) setHighlights(data)
    setLoading(false)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('career-highlights')
      .upload(fileName, file, { upsert: true })
    if (error) { alert('Upload error: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage
      .from('career-highlights')
      .getPublicUrl(fileName)
    setForm(prev => ({ ...prev, photo_url: urlData.publicUrl }))
    setUploading(false)
  }

  const saveHighlight = async () => {
    if (!form.address) { alert('Please enter a property address!'); return }
    setSaving(true)
    const { error } = await supabase.from('career_highlights').insert({
      user_id: userId,
      address: form.address,
      price: form.price,
      closing_date: form.closing_date || null,
      quote: form.quote,
      notes: form.notes,
      photo_url: form.photo_url,
    })
    if (error) { alert('Error saving: ' + error.message); setSaving(false); return }
    setForm({ address: '', price: '', closing_date: '', quote: '', notes: '', photo_url: '' })
    setShowForm(false)
    setSaving(false)
    loadHighlights(userId!)
  }

  const deleteHighlight = async (id: string) => {
    if (!confirm('Delete this highlight?')) return
    await supabase.from('career_highlights').delete().eq('id', id)
    loadHighlights(userId!)
  }

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '13px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }

  const labelStyle = {
    fontSize: '12px', fontWeight: '600' as const, color: 'var(--lw-text-muted)',
    display: 'block' as const, marginBottom: '6px'
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle' }}>PRO</span>
          )}
        </div>
        <button onClick={() => setShowForm(true)}
          style={{ padding: '8px 18px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
          + Add Highlight
        </button>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', borderRadius: '20px', padding: '1.75rem 2rem', marginBottom: '1.75rem', boxShadow: '0 8px 32px rgba(29,158,117,0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏆</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Career Highlights</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.6' }}>
            Market the listing today — remember the moment tomorrow. Your favorite closings, captured forever.
          </p>
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div style={{ ...cardStyle, marginBottom: '1.5rem', border: '1px solid rgba(29,158,117,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', margin: 0 }}>✦ Add a Closing Moment</p>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--lw-text-muted)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* PHOTO UPLOAD */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Photo</label>
              <div style={{ border: '2px dashed var(--lw-border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', background: 'var(--lw-input)', cursor: 'pointer', position: 'relative' }}
                onClick={() => document.getElementById('photo-upload')?.click()}>
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Highlight" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', width: '100%' }} />
                ) : (
                  <>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
                    <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', margin: 0 }}>{uploading ? 'Uploading...' : 'Click to upload a photo'}</p>
                  </>
                )}
                <input id="photo-upload" type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Property Address *</label>
              <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Sale Price</label>
                <input placeholder="$1,295,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Closing Date</label>
                <input type="date" value={form.closing_date} onChange={e => setForm({ ...form, closing_date: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Your Memory / Quote</label>
              <textarea placeholder="e.g. First-time buyers — they cried at the closing table. One of my favorite moments in 10 years of real estate." value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} rows={3}
                style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Additional Notes (optional)</label>
              <input placeholder="e.g. Multiple offers, sold in 3 days, referred by past client..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={inputStyle} />
            </div>

            <button onClick={saveHighlight} disabled={saving || uploading}
              style={{ width: '100%', padding: '13px', background: saving ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(29,158,117,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              {saving ? 'Saving...' : '✦ Save This Moment'}
            </button>
          </div>
        )}

        {/* HIGHLIGHTS GRID */}
        {loading ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--lw-text-muted)' }}>Loading your highlights...</p>
          </div>
        ) : highlights.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '8px' }}>No highlights yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
              Start capturing your favorite closing moments. Every deal has a story worth remembering.
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              + Add Your First Highlight
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {highlights.map(h => (
              <div key={h.id} style={{ ...cardStyle, padding: '0', overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(29,158,117,0.35)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,158,117,0.1)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lw-border)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}>
                {h.photo_url ? (
                  <img src={h.photo_url} alt={h.address} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg,rgba(29,158,117,0.1),rgba(8,80,65,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏠</div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--lw-text)', margin: '0 0 4px' }}>{h.address}</p>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {h.price && <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700' }}>{h.price}</span>}
                    {h.closing_date && <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>📅 {new Date(h.closing_date).toLocaleDateString()}</span>}
                  </div>
                  {h.quote && <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', fontStyle: 'italic', lineHeight: '1.6', margin: '0 0 10px' }}>"{h.quote}"</p>}
                  {h.notes && <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0 0 10px', lineHeight: '1.5' }}>{h.notes}</p>}
                  <button onClick={() => deleteHighlight(h.id)}
                    style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.06)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}