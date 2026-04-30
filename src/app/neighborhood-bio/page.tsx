'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NeighborhoodBioPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [highlights, setHighlights] = useState('')
  const [tone, setTone] = useState('Professional')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'neighborhood_bio' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      if (profile) setPlan(profile.plan || 'starter')
      setPlanLoaded(true)
    }
    getUser()
  }, [])

  const detectLocation = async () => {
    setLocating(true)
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
          const data = await res.json()
          const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || ''
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const state = data.address?.state || ''
          if (suburb) setNeighborhood(suburb)
          if (city) setCity(`${city}, ${state}`)
          trackEvent('location_detected', { tool: 'neighborhood_bio' })
        } catch(e) {
          setLocationError('Could not detect neighborhood. Please enter manually.')
        }
        setLocating(false)
      },
      (error) => {
        setLocationError('Location access denied. Please enter neighborhood manually.')
        setLocating(false)
      }
    )
  }

  const generate = async () => {
    if (!neighborhood.trim()) return
    setLoading(true)
    setOutput('')
    try {
      const prompt = `Write a compelling neighborhood bio for ${neighborhood}${city ? ` in ${city}` : ''}.

${highlights ? `Agent notes about this neighborhood: ${highlights}` : ''}

Tone: ${tone}

Write a professional neighborhood bio that includes:
- What makes this neighborhood unique and desirable
- Lifestyle and community feel
- Nearby amenities, schools, parks, dining, shopping
- Who this neighborhood is perfect for (families, young professionals, retirees, etc.)
- Real estate appeal and value proposition

Format it as 3-4 engaging paragraphs. Make it sound like it was written by a local expert who loves this neighborhood. Do not use generic filler — make it specific and compelling.`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          currentPage: '/neighborhood-bio'
        })
      })
      const data = await res.json()
      setOutput(data.message || '')
      trackEvent('neighborhood_bio_generated', { neighborhood, tone })
    } catch(e) {
      setOutput('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent('output_copied', { tool: 'neighborhood_bio' })
  }

  if (!planLoaded) return (
    <div style={{minHeight:'100vh',background:'#111318',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'40px',height:'40px',border:'3px solid rgba(29,158,117,0.3)',borderTop:'3px solid #1D9E75',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
    </div>
  )

  return (
    <main style={{minHeight:'100vh',background:'#111318',color:'#f0f0f0',fontFamily:"'Inter', sans-serif"}}>
      <div style={{maxWidth:'800px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HEADER */}
        <div style={{marginBottom:'2rem'}}>
          <a href="/dashboard" style={{color:'#1D9E75',textDecoration:'none',fontSize:'13px',display:'inline-flex',alignItems:'center',gap:'6px',marginBottom:'1.5rem'}}>← Back to Dashboard</a>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'44px',height:'44px',background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>🏘️</div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:'700',margin:'0'}}>Neighborhood Bio Generator</h1>
              <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>Generate compelling neighborhood descriptions for listings, websites, and client emails</p>
            </div>
          </div>
        </div>

        {/* FORM CARD */}
        <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'1.5rem',marginBottom:'1.5rem'}}>

          {/* LOCATION BUTTON */}
          <div style={{marginBottom:'1.5rem',padding:'1rem',background:'rgba(29,158,117,0.06)',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)'}}>
            <p style={{fontSize:'12px',color:'#1D9E75',fontWeight:'700',margin:'0 0 8px',letterSpacing:'0.5px'}}>📍 AUTO-DETECT LOCATION</p>
            <p style={{fontSize:'12px',color:'#6b7280',margin:'0 0 12px',lineHeight:'1.6'}}>Tap below while you're in the neighborhood — we'll detect it instantly.</p>
            <button onClick={detectLocation} disabled={locating}
              style={{padding:'10px 20px',background: locating ? 'rgba(29,158,117,0.3)' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor: locating ? 'not-allowed' : 'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
              {locating ? '📍 Detecting...' : '📍 Detect My Location'}
            </button>
            {locationError && <p style={{fontSize:'12px',color:'#f87171',margin:'8px 0 0'}}>{locationError}</p>}
          </div>

          {/* NEIGHBORHOOD */}
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Neighborhood Name *</label>
            <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
              placeholder="e.g. Newport Heights, Balboa Island, Turtle Rock"
              style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}/>
          </div>

          {/* CITY */}
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>City / Area</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="e.g. Newport Beach, CA"
              style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none'}}/>
          </div>

          {/* HIGHLIGHTS */}
          <div style={{marginBottom:'1rem'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Your Notes (optional)</label>
            <textarea value={highlights} onChange={e => setHighlights(e.target.value)}
              placeholder="e.g. Great schools, walking distance to beach, lots of young families, new coffee shops opening up, quiet streets..."
              rows={3}
              style={{width:'100%',padding:'11px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',boxSizing:'border-box',outline:'none',resize:'vertical'}}/>
          </div>

          {/* TONE */}
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Tone</label>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {['Professional','Warm & Friendly','Luxury','Energetic'].map(t => (
                <button key={t} onClick={() => setTone(t)}
                  style={{padding:'7px 16px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontWeight:'600',
                    borderColor: tone === t ? '#1D9E75' : 'rgba(255,255,255,0.1)',
                    background: tone === t ? 'rgba(29,158,117,0.15)' : 'transparent',
                    color: tone === t ? '#1D9E75' : '#6b7280'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading || !neighborhood.trim()}
            style={{width:'100%',padding:'13px',background: loading || !neighborhood.trim() ? 'rgba(29,158,117,0.3)' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: loading || !neighborhood.trim() ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)'}}>
            {loading ? 'Generating neighborhood bio...' : '✨ Generate Neighborhood Bio'}
          </button>
        </div>

        {/* OUTPUT */}
        {output && (
          <div style={{background:'#1a1d2e',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.2)',padding:'1.5rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#1D9E75',margin:'0'}}>✅ Neighborhood Bio Ready</p>
              <button onClick={copy}
                style={{padding:'7px 16px',background: copied ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color: copied ? '#1D9E75' : '#f0f0f0',fontSize:'12px',cursor:'pointer',fontWeight:'600'}}>
                {copied ? '✅ Copied!' : '📋 Copy'}
              </button>
            </div>
            <p style={{fontSize:'14px',lineHeight:'1.9',color:'#d1d5db',whiteSpace:'pre-wrap',margin:'0'}}>{output}</p>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}