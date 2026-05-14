'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import Navbar from '../components/Navbar'
import jsPDF from 'jspdf'
import { pdfHeader, pdfSections } from '../lib/pdfStyles'
import { saveToWorkspace } from '../lib/workspace'
import SaveToWorkspace from '../components/SaveToWorkspace'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function QuickListingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceAddress, setWorkspaceAddress] = useState<string | null>(null)
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)
  const [planLoaded, setPlanLoaded] = useState(false)
  const [step, setStep] = useState<'upload' | 'questions' | 'generating' | 'results'>('upload')
  const [photos, setPhotos] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [outputs, setOutputs] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [copied, setCopied] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [brandVoice, setBrandVoice] = useState<any>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [answers, setAnswers] = useState({
    price: '',
    neighborhood: '',
    city: '',
    state: '',
    beds: '',
    baths: '',
    sqft: '',
  })

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('quick_listings')
      .select('id, address, created_at, outputs')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setHistory(data)
    setHistoryLoaded(true)
  }

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'quick_listing' })
    const wsId = new URLSearchParams(window.location.search).get('workspace')
    if (wsId) setWorkspaceId(wsId)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan, brand_voice').eq('id', user.id).single()
      if (profile) {
        setPlan(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try { setBrandVoice(JSON.parse(profile.brand_voice)) } catch(e) {}
        }
      } else { setPlanLoaded(true) }
      loadHistory(user.id)
      if (wsId) {
        const { data: ws } = await supabase.from('listing_workspaces').select('address').eq('id', wsId).single()
        if (ws) setWorkspaceAddress(ws.address)
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
        files.slice(0, 5).map(file => new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }))
      )
      setPhotos(base64Images)
      if (userId) {
        await Promise.all(
          files.slice(0, 5).map(async (file) => {
            const fileName = `${userId}/${Date.now()}-${file.name}`
            await supabase.storage.from('listing-photos').upload(fileName, file, { cacheControl: '3600', upsert: false })
          })
        )
      }
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
        sqft: answers.sqft || aiAnalysis?.sqft || '',
        price: answers.price,
        neighborhood: `${answers.neighborhood}${answers.city ? ', ' + answers.city : ''}${answers.state ? ', ' + answers.state : ''}`,
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
        await supabase.from('quick_listings').insert({
          user_id: userId,
          address: answers.neighborhood || answers.city || 'Untitled',
          form_data: answers,
          outputs: data.outputs
        })
        if (userId) loadHistory(userId)
        if (workspaceId && data.outputs.mls_standard) {
          await saveToWorkspace(workspaceId, 'mls_description', data.outputs.mls_standard)
          const toast = `✅ Saved to ${workspaceAddress || 'workspace'}`
          setWorkspaceToast(toast)
          setTimeout(() => setWorkspaceToast(null), 3500)
        }
      } else {
        alert('Error: ' + JSON.stringify(data))
        setStep('questions')
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
      setStep('questions')
    }
  }

  const downloadPDF = () => {
    if (!outputs) return
    const doc = new jsPDF()
    const addr = answers.neighborhood || answers.city || 'Quick Listing'
    const y = pdfHeader(doc, 'Quick Listing Kit', addr)
    pdfSections(doc, [
      { label: 'MLS Standard', content: outputs.mls_standard || '' },
      { label: 'Luxury MLS', content: outputs.mls_luxury || '' },
      { label: 'Instagram', content: outputs.instagram || '' },
      { label: 'Facebook', content: outputs.facebook || '' },
      { label: 'Email', content: outputs.email || '' },
      { label: 'Open House', content: outputs.openhouse || '' },
      { label: 'Video Script', content: outputs.video || '' },
      { label: 'SEO Copy', content: outputs.seo || '' },
      { label: 'SMS', content: outputs.text_message || '' },
      { label: 'Flyer', content: outputs.flyer || '' },
      { label: 'Price Drop', content: outputs.price_drop || '' },
    ], y, brandVoice?.agentName ? { agentName: brandVoice.agentName } : null)
    doc.save(`QuickListing-${addr.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
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

  const inputStyle = {
    width: '100%', padding: '13px 16px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '15px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }
  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '1rem'
  }
  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '8%', right: '8%', width: '480px', height: '480px', background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>

        {workspaceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '10px', padding: '10px 16px', marginBottom: '1rem' }}>
            <span>📁</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75' }}>
              Saving to workspace{workspaceAddress ? `: ${workspaceAddress}` : ''}
            </span>
            <a href={`/workspace/${workspaceId}`} style={{ marginLeft: 'auto', fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>View Workspace →</a>
          </div>
        )}

        {/* ── STEP 1 – UPLOAD ── */}
        {step === 'upload' && (
          <div>
            {/* HERO */}
            <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(29,158,117,0.25)', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>
                QUICK LISTING
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                📸 Create full listing marketing in seconds.
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto 18px' }}>
                Upload a photo, add a few notes — get a complete listing kit instantly.
              </p>
              <button
                onClick={() => document.getElementById('upload-form')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              >
                📸 Upload My Listing Photo
              </button>
            </div>

            {/* HOW IT WORKS */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={sectionHeadStyle}>How It Works</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { s: '1', icon: '📸', title: 'Upload your listing photo', desc: 'AI analyzes the image and detects features, layout, and property details' },
                  { s: '2', icon: '📝', title: 'Add property details', desc: 'Just price, neighborhood, and beds/baths — 3 quick questions' },
                  { s: '3', icon: '🎉', title: 'Get your full marketing kit', desc: 'MLS copy, social captions, email, flyer, and more — instantly' },
                ].map(({ s, icon, title, desc }) => (
                  <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                      <span style={{ fontSize: '1rem' }}>{icon}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                    <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* UPLOAD FORM */}
            <div id="upload-form">
              <p style={sectionHeadStyle}>Upload Your Listing Photo</p>
              <div
                style={{ ...cardStyle, textAlign: 'center', cursor: analyzing ? 'default' : 'pointer', border: analyzing ? '2px solid #1D9E75' : '2px dashed rgba(29,158,117,0.35)', padding: '3rem 2rem', marginBottom: '1.5rem', boxShadow: analyzing ? '0 0 30px rgba(29,158,117,0.1)' : '0 2px 12px rgba(0,0,0,0.05)' }}
                onClick={() => !analyzing && fileInputRef.current?.click()}>
                {analyzing ? (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '6px' }}>Analyzing your photos...</p>
                    <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)' }}>AI is detecting features, layout, and property details</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📷</div>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '8px' }}>Click to upload photos</p>
                    <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)', marginBottom: '20px' }}>Upload 1–5 property photos</p>
                    <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', padding: '12px 32px', borderRadius: '10px', display: 'inline-block', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' }}>
                      Choose Photos
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={analyzing} />
              </div>

              {/* WHAT YOU'LL GET */}
              <p style={sectionHeadStyle}>What You'll Get</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
                {[
                  { icon: '🏠', label: 'Listing description', desc: 'MLS-ready and luxury-formatted copy' },
                  { icon: '📸', label: 'Social media captions', desc: 'Instagram, Facebook, and more' },
                  { icon: '📧', label: 'Email copy', desc: 'Ready-to-send email blast for your list' },
                  { icon: '📱', label: 'Text message', desc: 'SMS-ready short listing announcement' },
                  { icon: '📄', label: 'Flyer content', desc: 'Print-ready flyer copy with key details' },
                  { icon: '#️⃣', label: 'Hashtags', desc: 'Local and listing-relevant hashtag sets' },
                ].map(({ icon, label, desc }) => (
                  <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                    <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setStep('questions')}
                  style={{ background: 'none', border: 'none', color: 'var(--lw-text-muted)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  Skip photos → Enter details manually
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 – QUESTIONS ── */}
        {step === 'questions' && (
          <div style={{ maxWidth: '520px', margin: '0 auto' }}>

            {photos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', marginBottom: '10px' }}>📸 PHOTOS — DRAG TO REORDER</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {photos.map((photo, i) => (
                    <div key={i}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={e => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      style={{ position: 'relative', cursor: 'grab', opacity: dragIndex === i ? 0.5 : 1 }}>
                      <img src={photo} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '10px', border: i === 0 ? '2px solid #1D9E75' : '2px solid var(--lw-border)', display: 'block' }} />
                      {i === 0 && (
                        <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#1D9E75', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>COVER</div>
                      )}
                      <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '10px', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', marginTop: '6px' }}>First photo is the cover photo. Drag to reorder.</p>
              </div>
            )}

            {aiAnalysis && (
              <div style={{ ...cardStyle, border: '1px solid rgba(29,158,117,0.2)', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', marginBottom: '10px' }}>🤖 AI DETECTED FROM PHOTOS</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(aiAnalysis.features || '').split(',').filter(Boolean).map((f: string) => (
                    <span key={f} style={{ fontSize: '12px', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.2)', fontWeight: '500' }}>
                      ✓ {f.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>Just 3 quick questions</h2>
              <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)' }}>AI handles the rest from your photos.</p>
            </div>

            <div style={cardStyle}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', display: 'block', marginBottom: '10px' }}>1️⃣ What's the listing price?</label>
              <input placeholder="e.g. $899,000" value={answers.price} onChange={e => setAnswers({ ...answers, price: e.target.value })} style={inputStyle} />
            </div>

            <div style={cardStyle}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', display: 'block', marginBottom: '10px' }}>2️⃣ What's the neighborhood or city?</label>
              <input placeholder="e.g. Newport Beach" value={answers.neighborhood} onChange={e => setAnswers({ ...answers, neighborhood: e.target.value })} style={{ ...inputStyle, marginBottom: '10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="City" value={answers.city} onChange={e => setAnswers({ ...answers, city: e.target.value })} style={inputStyle} />
                <select value={answers.state} onChange={e => setAnswers({ ...answers, state: e.target.value })} style={inputStyle}>
                  <option value="">State</option>
                  {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#1D9E75', display: 'block', marginBottom: '10px' }}>3️⃣ Beds, Baths & Sq Ft?</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input placeholder="Beds: 3" value={answers.beds} onChange={e => setAnswers({ ...answers, beds: e.target.value })} style={inputStyle} />
                <input placeholder="Baths: 2" value={answers.baths} onChange={e => setAnswers({ ...answers, baths: e.target.value })} style={inputStyle} />
                <input placeholder="Sq Ft: 1,850" value={answers.sqft} onChange={e => setAnswers({ ...answers, sqft: e.target.value })} style={inputStyle} />
              </div>
            </div>

            <button onClick={handleGenerate}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 24px rgba(29,158,117,0.3)', letterSpacing: '0.01em', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
              🚀 Generate Full Listing Report
            </button>
            <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', textAlign: 'center', marginTop: '10px' }}>Generates 11 formats — MLS, Social, Email, Flyer & more</p>
          </div>
        )}

        {/* ── STEP 3 – GENERATING ── */}
        {step === 'generating' && (
          <div style={{ textAlign: 'center', padding: '3rem 0', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✨</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '12px', letterSpacing: '-0.03em' }}>Writing your listing...</h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', lineHeight: '1.8', marginBottom: '2rem' }}>
              AI is reading your photos and generating:<br />
              MLS copy · Instagram · Email · Flyer · and 7 more formats
            </p>
            <div style={cardStyle}>
              {['🏠 Analyzing property features...', '✍️ Writing MLS description...', '📸 Crafting Instagram captions...', '📧 Composing email blast...', '📄 Building flyer copy...'].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--lw-border)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#1D9E75', fontWeight: '700' }}>✓</span>
                  <span style={{ fontSize: '13px', color: 'var(--lw-text-muted)', fontWeight: '500' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4 – RESULTS ── */}
        {step === 'results' && outputs && (
          <div style={{ display: 'grid', gridTemplateColumns: photos.length > 0 ? '280px 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>

            {photos.length > 0 && (
              <div style={{ position: 'sticky', top: '80px' }}>
                <div style={cardStyle}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', marginBottom: '4px' }}>📸 LISTING PHOTOS</p>
                  <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', marginBottom: '12px' }}>Drag to reorder</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {photos.map((photo, i) => (
                      <div key={i}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={e => handleDragOver(e, i)}
                        onDragEnd={handleDragEnd}
                        style={{ position: 'relative', cursor: 'grab', opacity: dragIndex === i ? 0.5 : 1, borderRadius: '10px', overflow: 'hidden', border: i === 0 ? '2px solid #1D9E75' : '2px solid var(--lw-border)' }}>
                        <img src={photo} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                        {i === 0 && (
                          <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#1D9E75', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>COVER</div>
                        )}
                        <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: '700', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    style={{ width: '100%', marginTop: '10px', padding: '9px', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                    + Add More Photos
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </div>
              </div>
            )}

            <div>
              {workspaceToast && (
                <div style={{ display:'flex',alignItems:'center',gap:'8px',background:'rgba(29,158,117,0.1)',border:'1px solid rgba(29,158,117,0.25)',borderRadius:'8px',padding:'8px 14px',marginBottom:'12px',fontSize:'13px',fontWeight:'600',color:'#1D9E75' }}>
                  {workspaceToast}
                </div>
              )}
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--lw-text)', marginBottom: '4px', letterSpacing: '-0.02em' }}>🎉 Your listing is ready!</h2>
                <p style={{ fontSize: '13px', color: 'var(--lw-text-muted)' }}>11 formats generated from your photos</p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1rem' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{
                      fontSize: '12px', padding: '7px 12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer',
                      borderColor: activeTab === t.key ? '#1D9E75' : 'var(--lw-border)',
                      background: activeTab === t.key ? 'rgba(29,158,117,0.1)' : 'var(--lw-input)',
                      color: activeTab === t.key ? '#1D9E75' : 'var(--lw-text-muted)',
                      fontWeight: activeTab === t.key ? '700' : '500',
                      fontFamily: 'var(--font-plus-jakarta), sans-serif'
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ ...cardStyle, position: 'relative', marginBottom: '1rem' }}>
                <button onClick={() => { navigator.clipboard.writeText(outputs[activeTab] || ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '12px', padding: '6px 14px', borderRadius: '20px', background: copied ? '#1D9E75' : 'var(--lw-input)', color: copied ? '#fff' : 'var(--lw-text-muted)', border: '1px solid', borderColor: copied ? '#1D9E75' : 'var(--lw-border)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <p style={{ fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre-wrap', color: 'var(--lw-text)', margin: '0', paddingRight: '80px', fontWeight: '400' }}>
                  {outputs[activeTab] || ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a href="/launch-kit" style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
                  🚀 7-Day Launch Kit
                </a>
                <a href="/dashboard" style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', textDecoration: 'none', fontWeight: '600' }}>
                  🏠 Full Dashboard
                </a>
                <button onClick={downloadPDF}
                  style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  📄 Download PDF
                </button>
                <button onClick={() => { setStep('upload'); setOutputs(null); setPhotos([]); setAiAnalysis(null) }}
                  style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '8px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                  🔄 New Listing
                </button>
              </div>
              {!workspaceId && userId && outputs && (
                <SaveToWorkspace
                  userId={userId}
                  assetKey="mls_description"
                  assetValue={outputs.mls_standard}
                  onSaved={addr => { const t = `✅ Saved to ${addr} workspace`; setWorkspaceToast(t); setTimeout(() => setWorkspaceToast(null), 3500) }}
                />
              )}
            </div>
          </div>
        )}

        {/* PAST LISTINGS */}
        <div style={{ marginTop: '2rem' }}>
          <p style={sectionHeadStyle}>Past Listings</p>
          {!historyLoaded ? null : history.length === 0 ? (
            <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--lw-text-muted)', fontSize: '13px', padding: '1.5rem' }}>
              Your past listings will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map(item => (
                <div key={item.id} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)' }}>{item.address}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--lw-text-muted)' }}>
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setOutputs(item.outputs); setStep('results'); setActiveTab('mls_standard') }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      View
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm('Delete this listing?')) return
                        await supabase.from('quick_listings').delete().eq('id', item.id)
                        if (userId) loadHistory(userId)
                      }}
                      style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', background: 'var(--lw-input)', color: '#6b7280', border: '1px solid var(--lw-border)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
