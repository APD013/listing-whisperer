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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }

      const { data: files } = await supabase.storage
        .from('listing-photos')
        .list(user.id, { sortBy: { column: 'created_at', order: 'desc' } })

      if (files) {
        const photoUrls = files.map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('listing-photos')
            .getPublicUrl(`${user.id}/${file.name}`)
          return { name: file.name, url: publicUrl, created_at: file.created_at }
        })
        setPhotos(photoUrls)
      }
      setLoading(false)
    }
    getUser()
  }, [])

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
          <a href="/snap-start" style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75', textDecoration: 'none' }}>📸 Snap & Start</a>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HEADER */}
        <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 4px', letterSpacing: '-0.03em' }}>📸 Photo Library</h1>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', margin: 0 }}>All property photos uploaded via Snap & Start</p>
          </div>
          <a href="/snap-start"
            style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
            + Upload Photos
          </a>
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
              style={{ display: 'inline-block', padding: '11px 24px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
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
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#1D9E75'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,158,117,0.15)' }}
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