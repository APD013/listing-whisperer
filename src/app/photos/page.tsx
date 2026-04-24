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
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
      } else {
        setPlanLoaded(true)
      }

      // Load photos from Supabase Storage
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

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      {/* BACKGROUND GLOW */}
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
          <a href="/snap-start" style={{fontSize:'13px',color:'#1D9E75',textDecoration:'none',fontWeight:'500'}}>📸 Snap & Start</a>
        </div>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'2rem'}}>

        {/* HEADER */}
        <div style={{marginBottom:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>📸 Photo Library</h1>
            <p style={{fontSize:'14px',color:'#6b7280'}}>All property photos uploaded via Snap & Start</p>
          </div>
          <a href="/snap-start"
            style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
            + Upload Photos
          </a>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{...cardStyle,textAlign:'center',padding:'3rem'}}>
            <p style={{color:'#6b7280'}}>Loading your photos...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && photos.length === 0 && (
          <div style={{...cardStyle,textAlign:'center',padding:'3rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📸</div>
            <h2 style={{fontSize:'1.25rem',fontWeight:'600',color:'#f0f0f0',marginBottom:'8px'}}>No photos yet</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem'}}>Upload property photos via Snap & Start and they'll appear here.</p>
            <a href="/snap-start"
              style={{display:'inline-block',padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
              Go to Snap & Start
            </a>
          </div>
        )}

        {/* PHOTO GRID */}
        {!loading && photos.length > 0 && (
          <div>
            <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'1rem'}}>{photos.length} photo{photos.length > 1 ? 's' : ''} saved</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'12px'}}>
              {photos.map((photo, i) => (
                <div key={i}
                  onClick={() => setSelectedPhoto(photo.url)}
                  style={{borderRadius:'12px',overflow:'hidden',border:'1px solid rgba(255,255,255,0.07)',cursor:'pointer',transition:'all 0.2s',position:'relative'}}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                  <img src={photo.url} alt="" style={{width:'100%',height:'160px',objectFit:'cover',display:'block'}}/>
                  <div style={{padding:'8px 10px',background:'rgba(26,29,46,0.95)'}}>
                    <p style={{fontSize:'11px',color:'#6b7280',margin:'0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
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
          style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <img src={selectedPhoto} alt="" style={{maxWidth:'100%',maxHeight:'90vh',borderRadius:'12px',objectFit:'contain'}}/>
          <button
            onClick={() => setSelectedPhoto(null)}
            style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:'40px',height:'40px',borderRadius:'50%',fontSize:'18px',cursor:'pointer'}}>
            ✕
          </button>
        </div>
      )}
    </main>
  )
}