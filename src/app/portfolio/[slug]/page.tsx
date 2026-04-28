'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { use } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [agent, setAgent] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('listings')

  useEffect(() => {
    if (!slug) return
    const load = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('portfolio_slug', slug)
        .maybeSingle()

      console.log('Portfolio lookup:', slug, profile, error)
      if (!profile) { setNotFound(true); setLoading(false); return }
      setAgent(profile)

      const { data: agentListings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (agentListings) setListings(agentListings)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter', sans-serif"}}>
      <p style={{color:'#6b7280'}}>Loading portfolio...</p>
    </main>
  )

  if (notFound) return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Inter', sans-serif"}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🔍</div>
        <h1 style={{color:'#f0f0f0',fontSize:'1.5rem',marginBottom:'8px'}}>Portfolio not found</h1>
        <p style={{color:'#6b7280'}}>This agent portfolio doesn't exist or hasn't been set up yet.</p>
        <a href="/" style={{display:'inline-block',marginTop:'1.5rem',padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>
          Try Listing Whisperer Free
        </a>
      </div>
    </main>
  )

  const brandVoice = agent?.brand_voice ? (() => { try { return JSON.parse(agent.brand_voice) } catch(e) { return {} } })() : {}

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',left:'50%',transform:'translateX(-50%)',width:'600px',height:'600px',background:'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* HEADER */}
      <div style={{background:'rgba(13,17,23,0.95)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
        </div>
        <a href="/signup" style={{padding:'8px 18px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'8px',textDecoration:'none',fontSize:'12px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
          Try Free →
        </a>
      </div>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'2rem'}}>

        {/* AGENT HERO */}
        <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.2)',padding:'2.5rem',marginBottom:'2rem',boxShadow:'0 0 40px rgba(29,158,117,0.08)',textAlign:'center'}}>
          <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',margin:'0 auto 1rem',boxShadow:'0 0 24px rgba(29,158,117,0.4)'}}>
            {(brandVoice.agentName || agent?.full_name || 'A').charAt(0).toUpperCase()}
          </div>
          <h1 style={{fontSize:'1.75rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 6px'}}>
            {brandVoice.agentName || agent?.full_name || 'Real Estate Agent'}
          </h1>
          {brandVoice.brokerage && (
            <p style={{fontSize:'14px',color:'#1D9E75',fontWeight:'600',margin:'0 0 12px'}}>{brandVoice.brokerage}</p>
          )}
          {brandVoice.uniqueStyle && (
            <p style={{fontSize:'14px',color:'#8b8fa8',margin:'0 0 1.5rem',lineHeight:'1.7',maxWidth:'500px',marginLeft:'auto',marginRight:'auto'}}>{brandVoice.uniqueStyle}</p>
          )}

          <div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap',marginBottom:'1.5rem'}}>
            {brandVoice.phone && (
              <a href={`tel:${brandVoice.phone}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#6b7280',textDecoration:'none',fontSize:'13px'}}>
                📞 {brandVoice.phone}
              </a>
            )}
            {brandVoice.website && (
              <a href={`https://${brandVoice.website}`} target="_blank" style={{display:'flex',alignItems:'center',gap:'6px',color:'#1D9E75',textDecoration:'none',fontSize:'13px'}}>
                🌐 {brandVoice.website}
              </a>
            )}
            {agent?.email && (
              <a href={`mailto:${agent.email}`} style={{display:'flex',alignItems:'center',gap:'6px',color:'#6b7280',textDecoration:'none',fontSize:'13px'}}>
                ✉️ {agent.email}
              </a>
            )}
          </div>

          <div style={{display:'flex',justifyContent:'center',gap:'24px',flexWrap:'wrap'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'2rem',fontWeight:'700',color:'#1D9E75',margin:'0'}}>{listings.length}</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Listings</p>
            </div>
            {brandVoice.targetBuyers && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0'}}>{brandVoice.targetBuyers}</p>
                <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Specialty</p>
              </div>
            )}
            {brandVoice.preferredTone && (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0'}}>{brandVoice.preferredTone}</p>
                <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Style</p>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{display:'flex',gap:'8px',marginBottom:'1.5rem'}}>
          {['listings', 'about'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{padding:'8px 20px',borderRadius:'8px',border:'1px solid',cursor:'pointer',fontSize:'13px',fontWeight:'600',transition:'all 0.15s',
                borderColor: activeTab === tab ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                background: activeTab === tab ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                color: activeTab === tab ? '#1D9E75' : '#6b7280'}}>
              {tab === 'listings' ? `🏠 Listings (${listings.length})` : '👤 About'}
            </button>
          ))}
        </div>

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'3rem',textAlign:'center'}}>
                <p style={{color:'#6b7280'}}>No listings yet.</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                {listings.map(listing => (
                  <div key={listing.id} style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'1.5rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)',transition:'all 0.2s'}}
                    onMouseOver={e => e.currentTarget.style.borderColor='rgba(29,158,117,0.3)'}
                    onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}}>
                      <div>
                        <h3 style={{fontSize:'15px',fontWeight:'700',color:'#f0f0f0',margin:'0 0 4px'}}>
                          {listing.name || `${listing.property_type || 'Property'} — ${listing.neighborhood || ''}`}
                        </h3>
                        <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>
                          {listing.beds_baths && `${listing.beds_baths} · `}{listing.sqft && `${listing.sqft} sq ft · `}{listing.price && listing.price}
                        </p>
                      </div>
                      <span style={{fontSize:'11px',color:'#444'}}>{new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                    {listing.outputs?.mls_standard && (
                      <p style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'1.7',margin:'0',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' as const,overflow:'hidden'}}>
                        {listing.outputs.mls_standard}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
            <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'1.5rem'}}>About {brandVoice.agentName || agent?.full_name}</h2>
            {brandVoice.uniqueStyle && (
              <div style={{marginBottom:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>STYLE & APPROACH</p>
                <p style={{fontSize:'14px',color:'#c0c0c0',lineHeight:'1.8',margin:'0'}}>{brandVoice.uniqueStyle}</p>
              </div>
            )}
            {brandVoice.targetBuyers && (
              <div style={{marginBottom:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>SPECIALTY</p>
                <p style={{fontSize:'14px',color:'#c0c0c0',lineHeight:'1.8',margin:'0'}}>{brandVoice.targetBuyers}</p>
              </div>
            )}
            {brandVoice.ctaStyle && (
              <div style={{marginBottom:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>GET IN TOUCH</p>
                <p style={{fontSize:'14px',color:'#c0c0c0',lineHeight:'1.8',margin:'0'}}>{brandVoice.ctaStyle}</p>
              </div>
            )}
            <div style={{marginTop:'2rem',padding:'1.5rem',background:'rgba(29,158,117,0.06)',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)',textAlign:'center'}}>
              <p style={{fontSize:'13px',color:'#6b7280',margin:'0 0 12px'}}>Want AI-powered listings like these?</p>
              <a href="/signup" style={{display:'inline-block',padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
                Try Listing Whisperer Free →
              </a>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{textAlign:'center',marginTop:'3rem',paddingTop:'2rem',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
          <p style={{fontSize:'12px',color:'#333',margin:'0'}}>
            Powered by <a href="/" style={{color:'#1D9E75',textDecoration:'none',fontWeight:'600'}}>ListingWhisperer.com</a>
          </p>
        </div>
      </div>
    </main>
  )
}