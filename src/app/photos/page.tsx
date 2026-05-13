'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PhotosPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const loadPhotos = async (uid: string) => {
    const { data: files } = await supabase.storage
      .from('listing-photos')
      .list(uid, { sortBy: { column: 'created_at', order: 'desc' } })
    if (files) {
      const photoUrls = files.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(`${uid}/${file.name}`)
        return { name: file.name, url: publicUrl, created_at: file.created_at }
      })
      setPhotos(photoUrls)
    }
    setLoading(false)
  }

  const uploadPhoto = async (file: File) => {
    if (!userId) return
    setUploading(true)
    const fileName = `${userId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage
      .from('listing-photos')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) { alert('Upload error: ' + error.message); setUploading(false); return }
    await loadPhotos(userId)
    setUploading(false)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
      loadPhotos(user.id)
    }
    getUser()
  }, [])

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(225,48,108,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(131,58,180,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/snap-start" style={{ fontSize: '13px', fontWeight: '600', color: '#e1306c', textDecoration: 'none' }}>📸 Snap & Start</a>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
            Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
            {planLoaded && plan === 'pro' && (
              <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#e1306c,#833ab4)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(225,48,108,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>PHOTO LIBRARY</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>All your property photos in one place.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Every photo uploaded via Snap & Start lives here — organized, ready to reuse for any listing.</p>
          <a href="/snap-start"
            style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)', textDecoration: 'none' }}>
            + Upload Photos →
          </a>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '📸', title: 'Upload via Snap & Start', desc: 'Take or upload photos in Snap & Start and they\'re saved here automatically.' },
              { s: '2', icon: '🖼️', title: 'Browse your library', desc: 'See all your property photos in a clean grid — click to view full size.' },
              { s: '3', icon: '♻️', title: 'Reuse across listings', desc: 'Your photos are always available to use in new listings and tools.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#e1306c,#833ab4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '🗂️', label: 'Organized Photo Library', desc: 'All listing photos from Snap & Start, sorted by upload date.' },
              { icon: '🔍', label: 'Lightbox Viewer', desc: 'Click any photo to view it full screen with a clean overlay.' },
              { icon: '☁️', label: 'Cloud Storage', desc: 'Photos are stored securely and accessible from any device.' },
              { icon: '📅', label: 'Upload Date', desc: 'Each photo shows when it was uploaded so you can find it fast.' },
              { icon: '🔗', label: 'Snap & Start Integration', desc: 'Photos upload automatically when you use Snap & Start.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UPLOAD ZONE */}
        <div
          style={{ border: isDragging ? '2px dashed var(--lw-accent)' : '2px dashed var(--lw-border)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', background: isDragging ? 'rgba(29,158,117,0.04)' : 'var(--lw-card)', cursor: 'pointer', marginBottom: '1.5rem', transition: 'border-color 0.2s' }}
          onClick={() => document.getElementById('photos-upload-input')?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) uploadPhoto(file) }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--lw-text)', margin: '0 0 4px' }}>
            {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0 }}>JPG, PNG, WEBP accepted</p>
          <input id="photos-upload-input" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const file = e.target.files?.[0]; if (file) uploadPhoto(file) }} />
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--lw-text-muted)', fontWeight: '500', margin: 0 }}>Loading your photos...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && photos.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '8px' }}>No photos yet</h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', marginBottom: '1.5rem' }}>Upload property photos via Snap & Start and they'll appear here.</p>
            <a href="/snap-start"
              style={{ display: 'inline-block', padding: '11px 24px', background: 'linear-gradient(135deg,#e1306c,#833ab4)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 16px rgba(225,48,108,0.3)' }}>
              Go to Snap & Start
            </a>
          </div>
        )}

        {/* PHOTO GRID */}
        {!loading && photos.length > 0 && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', marginBottom: '1rem' }}>{photos.length} photo{photos.length > 1 ? 's' : ''} saved</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {photos.map((photo, i) => (
                <div key={i}
                  onClick={() => setSelectedPhoto(photo.url)}
                  style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--lw-border)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#e1306c'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,48,108,0.15)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--lw-border)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <img src={photo.url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '8px 10px', background: 'var(--lw-card)', borderTop: '1px solid var(--lw-border)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '500', color: 'var(--lw-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </div>

      {/* LIGHTBOX */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <img src={selectedPhoto} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }} />
          <button
            onClick={() => setSelectedPhoto(null)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}
    </main>
  )
}
