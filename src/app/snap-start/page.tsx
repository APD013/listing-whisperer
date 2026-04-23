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
  const [useLocation, setUseLocation] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [suggestedFeatures, setSuggestedFeatures] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    address: '',
    neighborhood: '',
    type: 'Single family',
    beds: '',
    sqft: '',
    price: '',
    notes: '',
    tone: 'Warm & inviting',
    buyer: 'Move-up families',
  })

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
        if (data.analysis.property_type) {
          setForm(prev => ({ ...prev, type: data.analysis.property_type }))
        }
      }
      setStep('confirm')
    } catch(e: any) {
      alert('Error analyzing photos: ' + e.message)
    }
    setAnalyzing(false)
  }

  const handleGetLocation = () => {
    setLocationLoading(true)
    if (!navigator.geolocation) {
      alert('Location not supported on this device')
      setLocationLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          const data = await res.json()
          const address = data.display_name || ''
          const city = data.address?.city || data.address?.town || data.address?.suburb || ''
          const state = data.address?.state || ''
          setForm(prev => ({
            ...prev,
            address: data.address?.road ? `${data.address.house_number || ''} ${data.address.road}`.trim() : address,
            neighborhood: `${city}${state ? ', ' + state : ''}`
          }))
        } catch(e) {
          alert('Could not get address from location')
        }
        setLocationLoading(false)
      },
      () => {
        alert('Location access denied. Please enter address manually.')
        setLocationLoading(false)
      }
    )
  }

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    )
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const property = {
        type: form.type,
        beds: form.beds,
        sqft: form.sqft,
        price: form.price,
        neighborhood: form.neighborhood || form.address,
        features: selectedFeatures.join(', '),
        tone: form.tone,
        buyer: form.buyer,
        notes: form.notes,
        name: form.address,
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property, userId })
      })
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') {
        router.push('/pricing')
        return
      }
      if (data.outputs) {
        setOutputs(data.outputs)
        setStep('results')
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setGenerating(false)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs = [
    { key: 'mls_standard', label: '🏠 MLS' },
    { key: 'mls_luxury', label: '✨ Luxury' },
    { key: 'instagram', label: '📸 Instagram' },
    { key: 'email', label: '📧 Email' },
    { key: 'openhouse', label: '🚪 Open House' },
    { key: 'text_message', label: '📱 Text' },
  ]

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>
      {/* NAV */}
      <div style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span>{planLoaded && plan === 'pro' && (<span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>PRO</span>)}</div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'600px',margin:'0 auto',padding:'1.5rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem',marginBottom:'1.5rem',color:'#fff'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',marginBottom:'0.5rem'}}>📸 Snap & Start</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',lineHeight:'1.6',margin:'0'}}>
            Start your listing before you even ring the bell. Upload photos, confirm the details, and generate your first draft in minutes.
          </p>
        </div>

        {/* STEP 1 - UPLOAD */}
        {step === 'upload' && (
          <div>
            {/* PHOTO UPLOAD */}
            <div style={{background:'#fff',borderRadius:'16px',border:'2px dashed #1D9E75',padding:'2rem',marginBottom:'1rem',textAlign:'center',cursor:'pointer'}}
              onClick={() => fileInputRef.current?.click()}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📸</div>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#333',marginBottom:'8px'}}>Upload Property Photos</p>
              <p style={{fontSize:'13px',color:'#666',marginBottom:'16px'}}>Upload 1-10 photos — AI will suggest visible features</p>
              <button style={{background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 24px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
                {analyzing ? '🔍 Analyzing photos...' : 'Choose Photos'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:'none'}} disabled={analyzing}/>
            </div>

            {/* LOCATION */}
            <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.25rem',marginBottom:'1rem'}}>
              <p style={{fontSize:'14px',fontWeight:'600',color:'#333',marginBottom:'12px'}}>📍 Property Address (optional)</p>
              <button onClick={handleGetLocation} disabled={locationLoading}
                style={{width:'100%',padding:'10px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:'pointer',marginBottom:'10px'}}>
                {locationLoading ? '📍 Getting location...' : '📍 Use My Current Location'}
              </button>
              <p style={{fontSize:'12px',color:'#999',textAlign:'center',marginBottom:'10px'}}>— or enter manually —</p>
              <input
                placeholder="123 Main St, Newport Beach, CA"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}
              />
              <p style={{fontSize:'11px',color:'#999',marginTop:'6px'}}>📍 Location is always optional. Used only to suggest address context.</p>
            </div>

            <button
              onClick={() => setStep('confirm')}
              style={{width:'100%',padding:'12px',background:'#ddd',color:'#666',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
              Skip photos → Enter details manually
            </button>
          </div>
        )}

        {/* STEP 2 - CONFIRM */}
        {step === 'confirm' && (
          <div>
            {/* PHOTO PREVIEWS */}
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

            {/* SUGGESTED FEATURES */}
            {suggestedFeatures.length > 0 && (
              <div style={{background:'#f0fdf8',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem',border:'1px solid #bbf0d9'}}>
                <p style={{fontSize:'12px',fontWeight:'700',color:'#085041',marginBottom:'4px'}}>✨ SUGGESTED FROM PHOTOS</p>
                <p style={{fontSize:'11px',color:'#666',marginBottom:'12px'}}>AI detected these possible features — tap to select/deselect. Always verify before generating.</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                  {suggestedFeatures.map(feature => (
                    <button key={feature} onClick={() => toggleFeature(feature)}
                      style={{padding:'6px 12px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',
                        borderColor: selectedFeatures.includes(feature) ? '#1D9E75' : '#ddd',
                        background: selectedFeatures.includes(feature) ? '#E1F5EE' : '#fff',
                        color: selectedFeatures.includes(feature) ? '#085041' : '#666'}}>
                      {selectedFeatures.includes(feature) ? '✓ ' : '+ '}{feature}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PROPERTY DETAILS */}
            <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.25rem',marginBottom:'1rem'}}>
              <p style={{fontSize:'14px',fontWeight:'600',color:'#333',marginBottom:'12px'}}>📋 Confirm Property Details</p>

              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property Address</label>
                <input placeholder="123 Main St" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}
                  style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
              </div>

              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>City / Neighborhood</label>
                <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})}
                  style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property Type</label>
                  <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                    <option>Single family</option><option>Condo</option><option>Townhome</option>
                    <option>Luxury estate</option><option>Multi-family</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Beds / Baths</label>
                  <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Sq Ft</label>
                  <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
                </div>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Price</label>
                  <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
                </div>
              </div>

              <div style={{marginBottom:'10px'}}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Additional Features / Notes</label>
                <textarea placeholder="Any additional features or notes from your visit..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
                  style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',minHeight:'70px',resize:'vertical',boxSizing:'border-box'}}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Tone</label>
                  <select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                    <option>Warm & inviting</option><option>Luxury & aspirational</option>
                    <option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Target Buyer</label>
                  <select value={form.buyer} onChange={e=>setForm({...form,buyer:e.target.value})}
                    style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                    <option>Move-up families</option><option>Luxury buyers</option>
                    <option>First-time buyers</option><option>Investors</option><option>Downsizers</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{display:'flex',gap:'10px',marginBottom:'1rem'}}>
              <button onClick={() => setStep('upload')}
                style={{flex:1,padding:'12px',background:'#f8fafc',color:'#666',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',cursor:'pointer'}}>
                ← Back
              </button>
              <button onClick={handleGenerate} disabled={generating}
                style={{flex:2,padding:'12px',background: generating ? '#085041' : '#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
                {generating ? '⏳ Generating draft...' : '🚀 Generate Listing Draft'}
              </button>
            </div>

            {generating && (
              <div style={{background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb',padding:'1.5rem',textAlign:'center'}}>
                <div style={{fontSize:'2rem',marginBottom:'8px'}}>⏳</div>
                <p style={{fontSize:'14px',fontWeight:'600',color:'#333',marginBottom:'4px'}}>Generating your listing draft...</p>
                <p style={{fontSize:'12px',color:'#666'}}>This takes about 15-20 seconds. Please don't close this page!</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 - RESULTS */}
        {step === 'results' && outputs && (
          <div id="results">
            <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
                <h2 style={{fontSize:'1rem',fontWeight:'600',margin:'0'}}>🎉 Your listing draft is ready!</h2>
                <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>6 formats</span>
              </div>

              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1.25rem'}}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{fontSize:'12px',padding:'6px 12px',borderRadius:'20px',border:'1px solid',cursor:'pointer',
                      borderColor: activeTab === t.key ? '#1D9E75' : '#e5e7eb',
                      background: activeTab === t.key ? '#1D9E75' : '#fff',
                      color: activeTab === t.key ? '#fff' : '#666',
                      fontWeight: activeTab === t.key ? '600' : '400'}}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.25rem',border:'1px solid #e5e7eb',position:'relative',minHeight:'120px'}}>
                <button onClick={() => handleCopy(outputs[activeTab] || '')}
                  style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 14px',borderRadius:'20px',
                    background: copied ? '#1D9E75' : '#fff',color: copied ? '#fff' : '#333',
                    border:'1px solid',borderColor: copied ? '#1D9E75' : '#ddd',cursor:'pointer',fontWeight:'500'}}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <p style={{fontSize:'13px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#333',margin:'0',paddingRight:'80px'}}>
                  {outputs[activeTab] || ''}
                </p>
              </div>

              <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'#1D9E75',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                  🏠 Full Marketing Kit →
                </a>
                <a href="/launch-kit" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',textDecoration:'none',fontWeight:'500'}}>
                  🚀 7-Day Launch Kit
                </a>
                <button onClick={() => { setStep('upload'); setOutputs(null); setPhotos([]); setSuggestedFeatures([]); setSelectedFeatures([]) }}
                  style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'#f8fafc',color:'#666',border:'1px solid #e5e7eb',cursor:'pointer'}}>
                  🔄 New Snap & Start
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}