'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function QuickListingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [step, setStep] = useState<'upload' | 'questions' | 'generating' | 'results'>('upload')
  const [photos, setPhotos] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [copied, setCopied] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [answers, setAnswers] = useState({
    price: '',
    neighborhood: '',
    beds: '',
    baths: '',
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
        files.slice(0, 5).map(file => new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }))
      )
      setPhotos(base64Images)

      // Save to Supabase Storage
      if (userId) {
        await Promise.all(
          files.slice(0, 5).map(async (file) => {
            const fileName = `${userId}/${Date.now()}-${file.name}`
            await supabase.storage.from('listing-photos').upload(fileName, file, { cacheControl: '3600', upsert: false })
          })
        )
      }

      // Analyze photos
      const res = await fetch('/api/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images, userId })
      })
      const data = await res.json()
      if (data.analysis) setAiAnalysis(data.analysis)
      setStep('questions')
    } catch(e: any) { alert('Error: ' + e.message) }
    setAnalyzing(false)
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const newPhotos = [...photos]
    const dragged = newPhotos.splice(dragIndex, 1)[0]
    newPhotos.splice(index, 0, dragged)
    setPhotos(newPhotos)
    setDragIndex(index)
  }

  const handleDragEnd = () => setDragIndex(null)

  const handleGenerate = async () => {
    if (!answers.price && !answers.neighborhood) {
      alert('Please enter at least the price or neighborhood!')
      return
    }
    setStep('generating')
    try {
      const property = {
        type: aiAnalysis?.property_type || 'Single family',
        beds: `${answers.beds}${answers.baths ? ' bed / ' + answers.baths + ' bath' : ''}`,
        sqft: aiAnalysis?.sqft || '',
        price: answers.price,
        neighborhood: answers.neighborhood,
        features: aiAnalysis?.features || '',
        tone: 'Professional',
        buyer: 'Move-up families',
        notes: `AI detected from photos: ${aiAnalysis?.features || 'none'}`,
        name: answers.neighborhood,
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
      } else {
        alert('Error: ' + JSON.stringify(data))
        setStep('questions')
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
      setStep('questions')
    }
  }

  const tabs = [
    { key: 'mls_standard', label: 'MLS', icon: '🏠' },
    { key: 'mls_luxury', label: 'Luxury', icon: '✨' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'facebook', label: 'Facebook', icon: '👥' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'openhouse', label: 'Open House', icon: '🚪' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'seo', label: 'SEO', icon: '🔍' },
    { key: 'text_message', label: 'SMS', icon: '📱' },
    { key: 'flyer', label: 'Flyer', icon: '📄' },
    { key: 'price_drop', label: 'Price Drop', icon: '💰' },
  ]

  const inputStyle = { width:'100%', padding:'14px 16px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'16px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',left:'50%',transform:'translateX(-50%)',width:'600px',height:'600px',background:'radial-gradient(circle, rgba(29,158,117,0.08) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(13,17,23,0.95)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* STEP 1 - UPLOAD */}
        {step === 'upload' && (
          <div style={{maxWidth:'500px',margin:'0 auto'}}>
            <div style={{textAlign:'center',marginBottom:'2rem'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📸</div>
              <h1 style={{fontSize:'1.75rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px',lineHeight:'1.3'}}>
                One photo.<br/>
                <span style={{color:'#1D9E75'}}>Everything you need.</span>
              </h1>
              <p style={{fontSize:'14px',color:'#6b7280',lineHeight:'1.7'}}>
                Upload 1-5 property photos. AI reads them and writes your full listing. You just answer 3 quick questions.
              </p>
            </div>

            <div style={{...cardStyle, textAlign:'center', cursor:'pointer', border: analyzing ? '2px solid #1D9E75' : '2px dashed rgba(29,158,117,0.4)', padding:'3rem 2rem'}}
              onClick={() => !analyzing && fileInputRef.current?.click()}>
              {analyzing ? (
                <div>
                  <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>🔍</div>
                  <p style={{fontSize:'15px',fontWeight:'600',color:'#f0f0f0',marginBottom:'6px'}}>Analyzing your photos...</p>
                  <p style={{fontSize:'13px',color:'#6b7280'}}>AI is detecting features, layout, and property details</p>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:'2.5rem',marginBottom:'12px'}}>📷</div>
                  <p style={{fontSize:'15px',fontWeight:'600',color:'#f0f0f0',marginBottom:'8px'}}>Tap to upload photos</p>
                  <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'16px'}}>Upload 1-5 property photos</p>
                  <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',padding:'12px 28px',borderRadius:'10px',display:'inline-block',fontSize:'14px',fontWeight:'600',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
                    Choose Photos
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:'none'}} disabled={analyzing}/>
            </div>

            <div style={{textAlign:'center',marginTop:'1rem'}}>
              <button onClick={() => setStep('questions')}
                style={{background:'none',border:'none',color:'#6b7280',fontSize:'13px',cursor:'pointer',textDecoration:'underline'}}>
                Skip photos → Enter details manually
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 - 3 QUESTIONS */}
        {step === 'questions' && (
          <div style={{maxWidth:'500px',margin:'0 auto'}}>
            {/* PHOTO PREVIEWS WITH DRAG */}
            {photos.length > 0 && (
              <div style={{marginBottom:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>📸 PHOTOS — DRAG TO REORDER</p>
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {photos.map((photo, i) => (
                    <div key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      style={{position:'relative',cursor:'grab',opacity: dragIndex === i ? 0.5 : 1}}>
                      <img src={photo} alt="" style={{width:'80px',height:'80px',objectFit:'cover',borderRadius:'10px',border: i === 0 ? '2px solid #1D9E75' : '2px solid rgba(255,255,255,0.1)',display:'block'}}/>
                      {i === 0 && (
                        <div style={{position:'absolute',bottom:'4px',left:'4px',background:'#1D9E75',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 6px',borderRadius:'4px'}}>
                          COVER
                        </div>
                      )}
                      <div style={{position:'absolute',top:'4px',right:'4px',background:'rgba(0,0,0,0.6)',color:'#fff',fontSize:'10px',fontWeight:'600',width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:'11px',color:'#444',marginTop:'6px'}}>First photo is the cover photo. Drag to reorder.</p>
              </div>
            )}

            {/* AI DETECTED */}
            {aiAnalysis && (
              <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.25)', marginBottom:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'8px'}}>🤖 AI DETECTED FROM PHOTOS</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                  {(aiAnalysis.features || '').split(',').filter(Boolean).map((f: string) => (
                    <span key={f} style={{fontSize:'12px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',padding:'4px 10px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.2)'}}>
                      ✓ {f.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:'1.5rem'}}>
              <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>Just 3 quick questions</h2>
              <p style={{fontSize:'13px',color:'#6b7280'}}>AI handles the rest from your photos.</p>
            </div>

            <div style={{...cardStyle, marginBottom:'1rem'}}>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#1D9E75',display:'block',marginBottom:'10px'}}>1️⃣ What's the listing price?</label>
              <input placeholder="e.g. $899,000" value={answers.price} onChange={e => setAnswers({...answers, price: e.target.value})} style={inputStyle}/>
            </div>

            <div style={{...cardStyle, marginBottom:'1rem'}}>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#1D9E75',display:'block',marginBottom:'10px'}}>2️⃣ What's the neighborhood or city?</label>
              <input placeholder="e.g. Newport Beach, CA" value={answers.neighborhood} onChange={e => setAnswers({...answers, neighborhood: e.target.value})} style={inputStyle}/>
            </div>

            <div style={{...cardStyle, marginBottom:'1.5rem'}}>
              <label style={{fontSize:'13px',fontWeight:'600',color:'#1D9E75',display:'block',marginBottom:'10px'}}>3️⃣ Beds & Baths?</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                <input placeholder="Beds: 3" value={answers.beds} onChange={e => setAnswers({...answers, beds: e.target.value})} style={inputStyle}/>
                <input placeholder="Baths: 2" value={answers.baths} onChange={e => setAnswers({...answers, baths: e.target.value})} style={inputStyle}/>
              </div>
            </div>

            <button onClick={handleGenerate}
              style={{width:'100%',padding:'16px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'16px',fontWeight:'700',cursor:'pointer',boxShadow:'0 0 30px rgba(29,158,117,0.35)',letterSpacing:'0.3px'}}>
              🚀 Generate Full Listing Report
            </button>
            <p style={{fontSize:'11px',color:'#444',textAlign:'center',marginTop:'10px'}}>Generates 11 formats — MLS, Social, Email, Flyer & more</p>
          </div>
        )}

        {/* STEP 3 - GENERATING */}
        {step === 'generating' && (
          <div style={{textAlign:'center',padding:'3rem 0',maxWidth:'500px',margin:'0 auto'}}>
            <div style={{fontSize:'4rem',marginBottom:'1.5rem'}}>✨</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'12px'}}>Writing your listing...</h2>
            <p style={{fontSize:'14px',color:'#6b7280',lineHeight:'1.8',marginBottom:'2rem'}}>
              AI is reading your photos and generating:<br/>
              MLS copy · Instagram · Email · Flyer · and 7 more formats
            </p>
            <div style={cardStyle}>
              {['🏠 Analyzing property features...','✍️ Writing MLS description...','📸 Crafting Instagram captions...','📧 Composing email blast...','📄 Building flyer copy...'].map((s, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none'}}>
                  <span style={{fontSize:'12px',color:'#1D9E75'}}>✓</span>
                  <span style={{fontSize:'13px',color:'#6b7280'}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 - RESULTS */}
        {step === 'results' && outputs && (
          <div style={{display:'grid',gridTemplateColumns: photos.length > 0 ? '280px 1fr' : '1fr',gap:'1.5rem',alignItems:'start'}}>

            {/* PHOTOS SIDEBAR */}
            {photos.length > 0 && (
              <div style={{position:'sticky',top:'80px'}}>
                <div style={cardStyle}>
                  <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>📸 LISTING PHOTOS</p>
                  <p style={{fontSize:'11px',color:'#444',marginBottom:'10px'}}>Drag to reorder</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {photos.map((photo, i) => (
                      <div key={i}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={e => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        style={{position:'relative',cursor:'grab',opacity: dragIndex === i ? 0.5 : 1,borderRadius:'8px',overflow:'hidden',border: i === 0 ? '2px solid #1D9E75' : '2px solid rgba(255,255,255,0.06)'}}>
                        <img src={photo} alt="" style={{width:'100%',height:'160px',objectFit:'cover',display:'block'}}/>
                        {i === 0 && (
                          <div style={{position:'absolute',top:'8px',left:'8px',background:'#1D9E75',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'3px 8px',borderRadius:'6px'}}>
                            COVER
                          </div>
                        )}
                        <div style={{position:'absolute',top:'8px',right:'8px',background:'rgba(0,0,0,0.7)',color:'#fff',fontSize:'11px',fontWeight:'600',width:'22px',height:'22px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{width:'100%',marginTop:'10px',padding:'8px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'8px',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>
                    + Add More Photos
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:'none'}}/>
                </div>
              </div>
            )}

            {/* RESULTS */}
            <div>
              <div style={{marginBottom:'1rem'}}>
                <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'4px'}}>🎉 Your listing is ready!</h2>
                <p style={{fontSize:'13px',color:'#6b7280'}}>11 formats generated from your photos</p>
              </div>

              <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{fontSize:'12px',padding:'6px 10px',borderRadius:'8px',border:'1px solid',cursor:'pointer',
                      borderColor: activeTab === t.key ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                      background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                      color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                      fontWeight: activeTab === t.key ? '600' : '400',
                      boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none'}}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{...cardStyle, position:'relative', marginBottom:'1rem'}}>
                <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  style={{position:'absolute',top:'12px',right:'12px',fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background: copied ? '#1D9E75' : 'rgba(0,0,0,0.3)',color: copied ? '#fff' : '#6b7280',border:'1px solid',borderColor: copied ? '#1D9E75' : 'rgba(255,255,255,0.08)',cursor:'pointer',fontWeight:'500'}}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <p style={{fontSize:'13px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#e0e0e0',margin:'0',paddingRight:'80px'}}>
                  {outputs[activeTab] || ''}
                </p>
              </div>

              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                <a href="/launch-kit" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                  🚀 7-Day Launch Kit
                </a>
                <a href="/dashboard" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',textDecoration:'none',fontWeight:'500'}}>
                  🏠 Full Dashboard
                </a>
                <button onClick={() => { setStep('upload'); setOutputs(null); setPhotos([]); setAiAnalysis(null) }}
                  style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                  🔄 New Listing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}