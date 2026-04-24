'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SnapStartPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [step, setStep] = useState<'upload' | 'confirm' | 'results'>('upload')
  const [photos, setPhotos] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [suggestedFeatures, setSuggestedFeatures] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    address: '', neighborhood: '', type: 'Single family',
    beds: '', sqft: '', price: '', notes: '',
    tone: 'Warm & inviting', buyer: 'Move-up families',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setAnalyzing(true)
    try {
      const base64Images = await Promise.all(
        files.slice(0, 10).map(file => new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }))
      )
      setPhotos(base64Images)

      // Save photos to Supabase Storage
      if (userId) {
        await Promise.all(
          files.slice(0, 10).map(async (file) => {
            const fileName = `${userId}/${Date.now()}-${file.name}`
            await supabase.storage
              .from('listing-photos')
              .upload(fileName, file, { cacheControl: '3600', upsert: false })
          })
        )
      }

      const res = await fetch('/api/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images, userId })
      })
      const data = await res.json()
      if (data.analysis) {
        const features = (data.analysis.features || '').split(',').map((f: string) => f.trim()).filter(Boolean)
        setSuggestedFeatures(features)
        setSelectedFeatures(features)
        if (data.analysis.property_type) setForm(prev => ({ ...prev, type: data.analysis.property_type }))
      }
      setStep('confirm')
    } catch(e: any) { alert('Error analyzing photos: ' + e.message) }
    setAnalyzing(false)
  }

  const handleGetLocation = () => {
    setLocationLoading(true)
    if (!navigator.geolocation) { alert('Location not supported'); setLocationLoading(false); return }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.suburb || ''
          const state = data.address?.state || ''
          setForm(prev => ({
            ...prev,
            address: data.address?.road ? `${data.address.house_number || ''} ${data.address.road}`.trim() : '',
            neighborhood: `${city}${state ? ', ' + state : ''}`
          }))
        } catch(e) { alert('Could not get address') }
        setLocationLoading(false)
      },
      () => { alert('Location access denied.'); setLocationLoading(false) }
    )
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature])
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const property = {
        type: form.type, beds: form.beds, sqft: form.sqft, price: form.price,
        neighborhood: form.neighborhood || form.address,
        features: selectedFeatures.join(', '),
        tone: form.tone, buyer: form.buyer, notes: form.notes, name: form.address,
      }
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, userId })
      })
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') { router.push('/pricing'); return }
      if (data.outputs) {
        setOutputs(data.outputs)
        setStep('results')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setGenerating(false)
  }

  const tabs = [
    { key: 'mls_standard', label: 'MLS', icon: '🏠' },
    { key: 'mls_luxury', label: 'Luxury', icon: '✨' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'openhouse', label: 'Open House', icon: '🚪' },
    { key: 'text_message', label: 'SMS', icon: '📱' },
  ]

  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }

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
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'600px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>📸 Snap & Start</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Start your listing before you even ring the bell. Upload photos, confirm the details, and generate your first draft in minutes.
          </p>
        </div>

        {/* STEP 1 - UPLOAD */}
        {step === 'upload' && (
          <div>
            {/* PHOTO UPLOAD */}
            <div style={{...cardStyle, textAlign:'center', cursor:'pointer', border: analyzing ? '2px solid #1D9E75' : '2px dashed rgba(29,158,117,0.3)'}}
              onClick={() => fileInputRef.current?.click()}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📸</div>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#f0f0f0',marginBottom:'8px'}}>Upload Property Photos</p>
              <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'16px'}}>Upload 1-10 photos — AI will suggest visible features</p>
              <button style={{background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 24px',fontSize:'14px',fontWeight:'600',cursor:'pointer',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
                {analyzing ? '🔍 Analyzing photos...' : 'Choose Photos'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:'none'}} disabled={analyzing}/>
            </div>

            {/* LOCATION */}
            <div style={cardStyle}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>PROPERTY ADDRESS (OPTIONAL)</p>
              <button onClick={handleGetLocation} disabled={locationLoading}
                style={{width:'100%',padding:'10px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:'pointer',marginBottom:'10px'}}>
                {locationLoading ? '📍 Getting location...' : '📍 Use My Current Location'}
              </button>
              <p style={{fontSize:'12px',color:'#444',textAlign:'center',marginBottom:'10px'}}>— or enter manually —</p>
              <input placeholder="123 Main St, Newport Beach, CA" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={inputStyle}/>
              <p style={{fontSize:'11px',color:'#444',marginTop:'6px'}}>📍 Location is always optional.</p>
            </div>

            {/* LISTING TEXT IMPORT */}
            <div style={cardStyle}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>📋 IMPORT FROM LISTING TEXT (OPTIONAL)</p>
              <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>Copy the listing details text from Zillow, Redfin, or any site and paste below.</p>
              <div style={{background:'rgba(255,204,0,0.06)',border:'1px solid rgba(255,204,0,0.15)',borderRadius:'8px',padding:'8px 12px',marginBottom:'10px',fontSize:'12px',color:'#6b7280'}}>
                💡 <strong style={{color:'#f0f0f0'}}>How to use:</strong> On Zillow, select and copy the property details then paste here.
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <input placeholder="Paste listing text: 3 bed, 2 bath, 1850 sqft, $899,000..." id="listing-url-input" style={{...inputStyle, flex:1}}/>
                <button
                  onClick={async () => {
                    const urlInput = (document.getElementById('listing-url-input') as HTMLInputElement)?.value
                    if (!urlInput) return
                    try {
                      const res = await fetch('/api/import-listing', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urlInput })
                      })
                      const data = await res.json()
                      if (data.listing) {
                        setForm(prev => ({
                          ...prev,
                          type: data.listing.type || prev.type,
                          beds: data.listing.beds || prev.beds,
                          sqft: data.listing.sqft || prev.sqft,
                          price: data.listing.price || prev.price,
                          neighborhood: data.listing.neighborhood || prev.neighborhood,
                          notes: data.listing.notes || prev.notes,
                        }))
                        setStep('confirm')
                      } else {
                        alert('Could not import. Try entering details manually.')
                      }
                    } catch(e: any) { alert('Error: ' + e.message) }
                  }}
                  style={{padding:'10px 16px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:'pointer',whiteSpace:'nowrap'}}>
                  Import
                </button>
              </div>
            </div>

            <button onClick={() => setStep('confirm')}
              style={{width:'100%',padding:'12px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}>
              Skip photos → Enter details manually
            </button>
          </div>
        )}

        {/* STEP 2 - CONFIRM */}
        {step === 'confirm' && (
          <div>
            {photos.length > 0 && (
              <div style={{marginBottom:'1rem'}}>
                <p style={{fontSize:'12px',fontWeight:'600',color:'#1D9E75',marginBottom:'8px'}}>📸 {photos.length} photo{photos.length > 1 ? 's' : ''} uploaded</p>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {photos.slice(0,5).map((photo, i) => (
                    <img key={i} src={photo} alt="" style={{width:'60px',height:'60px',objectFit:'cover',borderRadius:'8px',border:'2px solid #1D9E75'}}/>
                  ))}
                </div>
              </div>
            )}

            {suggestedFeatures.length > 0 && (
              <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.2)'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'4px',letterSpacing:'1px'}}>✨ SUGGESTED FROM PHOTOS</p>
                <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'12px'}}>AI detected these possible features — tap to select/deselect. Always verify before generating.</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {suggestedFeatures.map(feature => (
                    <button key={feature} onClick={() => toggleFeature(feature)}
                      style={{padding:'6px 12px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',transition:'all 0.15s',
                        borderColor: selectedFeatures.includes(feature) ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                        background: selectedFeatures.includes(feature) ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                        color: selectedFeatures.includes(feature) ? '#1D9E75' : '#6b7280'}}>
                      {selectedFeatures.includes(feature) ? '✓ ' : '+ '}{feature}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>CONFIRM PROPERTY DETAILS</p>

              <div style={{marginBottom:'10px'}}>
                <label style={labelStyle}>Property Address</label>
                <input placeholder="123 Main St" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{marginBottom:'10px'}}>
                <label style={labelStyle}>City / Neighborhood</label>
                <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})} style={inputStyle}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                <div>
                  <label style={labelStyle}>Property Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={inputStyle}>
                    <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Beds / Baths</label>
                  <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Sq Ft</label>
                  <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Price</label>
                  <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} style={inputStyle}/>
                </div>
              </div>
              <div style={{marginBottom:'10px'}}>
                <label style={labelStyle}>Additional Notes</label>
                <textarea placeholder="Any additional features or notes..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  style={{...inputStyle, minHeight:'70px', resize:'vertical' as const}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                  <label style={labelStyle}>Tone</label>
                  <select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})} style={inputStyle}>
                    <option>Warm & inviting</option><option>Luxury & aspirational</option><option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Target Buyer</label>
                  <select value={form.buyer} onChange={e=>setForm({...form,buyer:e.target.value})} style={inputStyle}>
                    <option>Move-up families</option><option>Luxury buyers</option><option>First-time buyers</option><option>Investors</option><option>Downsizers</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:'10px',marginBottom:'1rem'}}>
              <button onClick={() => setStep('upload')}
                style={{flex:1,padding:'12px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}>
                ← Back
              </button>
              <button onClick={handleGenerate} disabled={generating}
                style={{flex:2,padding:'12px',background: generating ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'700',cursor:'pointer',boxShadow: generating ? 'none' : '0 0 20px rgba(29,158,117,0.3)'}}>
                {generating ? '⏳ Generating draft...' : '🚀 Generate Listing Draft'}
              </button>
            </div>

            {generating && (
              <div style={{...cardStyle,textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:'8px'}}>⏳</div>
                <p style={{fontSize:'14px',fontWeight:'600',color:'#f0f0f0',marginBottom:'4px'}}>Generating your listing draft...</p>
                <p style={{fontSize:'12px',color:'#6b7280'}}>This takes about 15-20 seconds.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 - RESULTS */}
        {step === 'results' && outputs && (
          <div id="results" style={cardStyle}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <div>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 4px'}}>DRAFT READY</p>
                <h2 style={{fontSize:'1rem',fontWeight:'600',color:'#f0f0f0',margin:'0'}}>🎉 Your listing draft is ready!</h2>
              </div>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>6 formats</span>
            </div>

            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1.25rem'}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{fontSize:'12px',padding:'6px 12px',borderRadius:'8px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                    borderColor: activeTab === t.key ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                    background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                    color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                    boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none',
                    fontWeight: activeTab === t.key ? '600' : '400'}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{background:'rgba(0,0,0,0.2)',borderRadius:'12px',padding:'1.5rem',border:'1px solid rgba(255,255,255,0.06)',position:'relative',minHeight:'120px'}}>
              <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)',color: copied ? '#fff' : '#6b7280',border:'1px solid',borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)',cursor:'pointer',fontWeight:'500'}}>
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
              <p style={{fontSize:'13px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#e0e0e0',margin:'0',paddingRight:'80px'}}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                🏠 Full Marketing Kit →
              </a>
              <a href="/launch-kit" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',textDecoration:'none',fontWeight:'500'}}>
                🚀 7-Day Launch Kit
              </a>
              <button onClick={() => { setStep('upload'); setOutputs(null); setPhotos([]); setSuggestedFeatures([]); setSelectedFeatures([]) }}
                style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                🔄 New Snap & Start
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}