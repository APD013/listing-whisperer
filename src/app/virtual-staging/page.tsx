'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { saveToWorkspace } from '../lib/workspace'
import SaveToWorkspace from '../components/SaveToWorkspace'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ROOM_TYPES = [
  { label: 'Living Room', value: 'livingroom' },
  { label: 'Bedroom', value: 'bedroom' },
  { label: 'Dining Room', value: 'diningroom' },
  { label: 'Kitchen', value: 'kitchen' },
  { label: 'Bathroom', value: 'bathroom' },
  { label: 'Home Office', value: 'homeoffice' },
  { label: 'Kids Room', value: 'kidsroom' },
]

const DESIGN_STYLES = [
  { label: 'Modern', value: 'modern' },
  { label: 'Scandinavian', value: 'scandinavian' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Bohemian', value: 'bohemian' },
  { label: 'Coastal', value: 'coastal' },
  { label: 'Farmhouse', value: 'farmhouse' },
  { label: 'Luxury', value: 'luxury' },
  { label: 'Minimalist', value: 'minimalist' },
  { label: 'Mid-Century', value: 'midcentury' },
]

const CREDIT_PACKS = [
  { label: '5 Stagings', price: '$9', priceId: 'price_1TWi1AKzAxeqVLKnDPUHAsKO' },
  { label: '15 Stagings', price: '$24', priceId: 'price_1TWi39KzAxeqVLKnsI7zCtL4' },
  { label: '30 Stagings', price: '$44', priceId: 'price_1TWi3TKzAxeqVLKnZBT2TJP1' },
]

type StagingRecord = {
  id: string
  created_at: string
  original_image_url: string
  staged_image_urls: string[]
  room_type: string
  design_style: string
}

export default function VirtualStagingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [roomType, setRoomType] = useState('livingroom')
  const [designStyle, setDesignStyle] = useState('modern')
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)
  const [buyingCredits, setBuyingCredits] = useState<string | null>(null)
  const [creditsAddedBanner, setCreditsAddedBanner] = useState(false)
  const [history, setHistory] = useState<StagingRecord[]>([])
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceAddress, setWorkspaceAddress] = useState<string | null>(null)
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)
  const [workspaceAssets, setWorkspaceAssets] = useState<any>({})

  const loadHistory = async (uid: string) => {
    const { data } = await supabase
      .from('virtual_stagings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setHistory(data)
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      loadHistory(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('staging_credits')
        .eq('id', user.id)
        .single()
      setCredits(profile?.staging_credits ?? 0)
    }
    getUser()

    // Check URL params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('credits') === 'added') {
        setCreditsAddedBanner(true)
        window.history.replaceState({}, '', '/virtual-staging')
      }
      const wsId = params.get('workspace')
      if (wsId) {
        setWorkspaceId(wsId)
        supabase.from('listing_workspaces').select('*').eq('id', wsId).single().then(({ data: ws }) => {
          if (ws) {
            setWorkspaceAddress(ws.address)
            setWorkspaceAssets(ws.assets || {})
          }
        })
      }
    }
  }, [])

  const processFile = async (file: File) => {
    if (!userId) return
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const fileName = `virtual-staging/${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('career-highlights')
      .upload(fileName, file, { upsert: true })
    if (uploadError) {
      setError('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage
      .from('career-highlights')
      .getPublicUrl(fileName)
    setImageUrl(urlData.publicUrl)
    setImagePreview(urlData.publicUrl)
    setUploading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleGenerate = async () => {
    if (!imageUrl || !userId) return
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const res = await fetch('/api/virtual-staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, roomType, designStyle, userId })
      })
      const data = await res.json()
      if (data.error === 'NO_CREDITS') {
        setShowUpsell(true)
      } else if (data.error) {
        setError(data.error)
      } else {
        setResults(data.images)
        setCredits(data.creditsRemaining)
        if (userId) loadHistory(userId)
        if (workspaceId) {
          await saveToWorkspace(workspaceId, 'virtual_staging', data.images)
          const toast = `✅ Saved to ${workspaceAddress || 'workspace'}`
          setWorkspaceToast(toast)
          setTimeout(() => setWorkspaceToast(null), 3500)
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleBuyCredits = async (priceId: string) => {
    if (!userId) return
    setBuyingCredits(priceId)
    try {
      const res = await fetch('/api/staging-credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert('Error: ' + (data.error || 'Could not create checkout session'))
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setBuyingCredits(null)
  }

  const handleDownload = async (url: string, index: number) => {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `virtually-staged-${index + 1}.jpg`
    a.click()
  }

  const handleStageAgain = (record: StagingRecord) => {
    setRoomType(record.room_type)
    setDesignStyle(record.design_style)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getRoomLabel = (val: string) => ROOM_TYPES.find(r => r.value === val)?.label ?? val
  const getStyleLabel = (val: string) => DESIGN_STYLES.find(s => s.value === val)?.label ?? val

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid var(--lw-border)',
    background: 'var(--lw-input)',
    color: 'var(--lw-text)',
    fontSize: '14px',
    fontFamily: 'var(--font-plus-jakarta), sans-serif',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--lw-text-muted)',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
      <Navbar />

      {workspaceId && (
        <div style={{ background: 'rgba(29,158,117,0.08)', borderBottom: '1px solid rgba(29,158,117,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--lw-text)' }}>
          <span style={{ fontSize: '16px' }}>📁</span>
          <span>Working in workspace: <strong>{workspaceAddress || workspaceId}</strong> — staging results will be saved automatically.</span>
          <a href={`/workspace/${workspaceId}`} style={{ marginLeft: 'auto', color: '#1D9E75', fontWeight: '600', textDecoration: 'none', fontSize: '12px' }}>View Workspace →</a>
        </div>
      )}
      {workspaceId && workspaceAssets?.virtual_staging && (
        <div style={{ background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <span>📋</span>
          <span style={{ fontWeight: '600', color: '#f59e0b' }}>This workspace already has Virtual Staging results. Generate again to update.</span>
        </div>
      )}

      {/* Credits added banner */}
      {creditsAddedBanner && (
        <div style={{
          background: '#1D9E75', color: '#fff', padding: '12px 1.5rem',
          textAlign: 'center', fontSize: '14px', fontWeight: '600',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        }}>
          ✅ Credits added! You're ready to stage more listings.
          <button
            onClick={() => setCreditsAddedBanner(false)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 0 0 8px' }}
          >✕</button>
        </div>
      )}

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}>

        {/* Hero card */}
        <div style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          borderRadius: '20px',
          padding: '2.5rem 2rem',
          marginBottom: '2rem',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛋️</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Virtual Staging
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.88, maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
            Transform empty rooms into beautifully furnished spaces in seconds. Upload a photo, choose a style, get stunning results.
          </p>
        </div>

        {/* How It Works */}
        <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1.2px', margin: '0 0 1rem' }}>HOW IT WORKS</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { step: '1', icon: '📷', label: 'Upload Photo', desc: 'Add a photo of the empty room' },
              { step: '2', icon: '🎨', label: 'Choose Style', desc: 'Select room type and design style' },
              { step: '3', icon: '⬇️', label: 'Download Results', desc: 'Get 2 AI-staged versions instantly' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#8b5cf620', border: '1px solid #8b5cf640',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', margin: '0 auto 10px',
                }}>{s.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.75rem 2rem', marginBottom: credits !== null && credits <= 1 ? '0.75rem' : '2rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1.2px', margin: '0 0 1.25rem' }}>UPLOAD & CONFIGURE</p>

          {/* Image upload */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>ROOM PHOTO</label>
            <label
              style={{
                display: 'block',
                border: isDragging ? '2px dashed var(--lw-accent)' : '2px dashed var(--lw-border)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                background: isDragging ? 'var(--lw-accent)10' : imagePreview ? 'transparent' : 'var(--lw-input)',
              }}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) processFile(file) }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Room preview" style={{ maxHeight: '220px', borderRadius: '8px', objectFit: 'cover', maxWidth: '100%' }} />
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--lw-text)', marginBottom: '4px' }}>
                    {uploading ? 'Uploading…' : 'Drag & drop or click to upload'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--lw-text-muted)' }}>JPG or PNG accepted</div>
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
            </label>
            {imagePreview && (
              <button
                onClick={() => { setImageUrl(null); setImagePreview(null) }}
                style={{ marginTop: '8px', fontSize: '12px', color: 'var(--lw-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '0', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
              >
                ✕ Remove photo
              </button>
            )}
          </div>

          {/* Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={labelStyle}>ROOM TYPE</label>
              <select value={roomType} onChange={e => setRoomType(e.target.value)} style={inputStyle}>
                {ROOM_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>DESIGN STYLE</label>
              <select value={designStyle} onChange={e => setDesignStyle(e.target.value)} style={inputStyle}>
                {DESIGN_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!imageUrl || loading || uploading}
            style={{
              width: '100%',
              padding: '14px',
              background: (!imageUrl || loading || uploading) ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: (!imageUrl || loading || uploading) ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Staging your room…' : 'Stage This Room →'}
          </button>

          {/* Credits remaining */}
          {credits !== null && (
            <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#8b5cf6' }}>
              ✦ {credits} staging{credits === 1 ? '' : 's'} remaining this month
              {credits === 0 && (
                <button
                  onClick={() => setShowUpsell(true)}
                  style={{ marginLeft: '10px', fontSize: '12px', color: '#8b5cf6', background: 'none', border: '1px solid #8b5cf660', borderRadius: '20px', padding: '2px 10px', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
                >
                  Buy more
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)',
            padding: '2.5rem', textAlign: 'center', marginBottom: '2rem',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px', animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⟳</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)', marginBottom: '6px' }}>Staging your room…</div>
            <div style={{ fontSize: '13px', color: 'var(--lw-text-muted)' }}>This takes about 30 seconds. Please wait.</div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            background: '#ef444412', borderRadius: '12px', border: '1px solid #ef444430',
            padding: '1rem 1.25rem', marginBottom: '2rem', color: '#ef4444', fontSize: '14px',
          }}>
            <strong>Something went wrong:</strong> {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            {workspaceToast && (
              <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '12px', fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>
                {workspaceToast}
              </div>
            )}
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1.2px', margin: '0 0 1rem' }}>YOUR RESULTS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              {results.map((url, i) => (
                <div key={i} style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', overflow: 'hidden' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={url} alt={`Staged result ${i + 1}`} style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute', bottom: '10px', left: '10px',
                      background: 'rgba(0,0,0,0.65)', color: '#fff',
                      fontSize: '11px', fontWeight: '700', padding: '4px 10px',
                      borderRadius: '20px', letterSpacing: '0.3px',
                    }}>
                      Virtually Staged
                    </div>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <button
                      onClick={() => handleDownload(url, i)}
                      style={{
                        width: '100%', padding: '10px', background: '#8b5cf6', color: '#fff',
                        border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '700',
                        cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                      }}
                    >
                      ⬇ Download Image {i + 1}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleGenerate}
                style={{
                  padding: '11px 28px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)',
                  borderRadius: '20px', color: 'var(--lw-text-muted)', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                Generate Again ↺
              </button>
            </div>
            {!workspaceId && userId && (
              <div style={{ marginTop: '1.25rem' }}>
                <SaveToWorkspace
                  userId={userId}
                  assetKey="virtual_staging"
                  assetValue={results}
                  onSaved={(address) => {
                    setWorkspaceToast(`✅ Saved to ${address} workspace`)
                    setTimeout(() => setWorkspaceToast(null), 3500)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Disclosure notice */}
        {results.length > 0 && (
          <div style={{
            background: '#f59e0b10', borderRadius: '12px', border: '1px solid #f59e0b30',
            padding: '1rem 1.25rem', fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.6',
            marginBottom: '2rem',
          }}>
            ⚠️ <strong style={{ color: 'var(--lw-text)' }}>Disclosure required:</strong> Virtually staged images must be labeled when used in MLS listings. Always disclose to buyers.
          </div>
        )}

        {/* Staging History */}
        <div style={{ marginTop: results.length > 0 ? '0' : '2rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1.2px', margin: '0 0 1rem' }}>YOUR STAGING HISTORY</p>
          {history.length === 0 ? (
            <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🛋️</div>
              <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', margin: 0 }}>Your staging history will appear here after your first generation.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {history.map(record => (
                <div key={record.id} style={{ background: 'var(--lw-card)', borderRadius: '14px', border: '1px solid var(--lw-border)', overflow: 'hidden' }}>
                  {record.staged_image_urls?.[0] && (
                    <img src={record.staged_image_urls[0]} alt="Staged result" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                  )}
                  <div style={{ padding: '0.875rem' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: '#8b5cf620', color: '#8b5cf6' }}>
                        {getRoomLabel(record.room_type)}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '12px', background: '#1D9E7520', color: '#1D9E75' }}>
                        {getStyleLabel(record.design_style)}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0 0 10px' }}>
                      {new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                      {record.staged_image_urls?.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => handleDownload(url, i)}
                          style={{
                            padding: '8px', background: '#8b5cf620', border: '1px solid #8b5cf640',
                            borderRadius: '8px', color: '#8b5cf6', fontSize: '12px', fontWeight: '700',
                            cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                          }}
                        >
                          ⬇ Download {i + 1}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStageAgain(record)}
                      style={{
                        width: '100%', padding: '8px', background: 'var(--lw-input)',
                        border: '1px solid var(--lw-border)', borderRadius: '8px',
                        color: 'var(--lw-text-muted)', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                      }}
                    >
                      Stage Again ↺
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upsell modal */}
      {showUpsell && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpsell(false) }}
        >
          <div style={{
            background: 'var(--lw-card)', borderRadius: '20px', border: '1px solid var(--lw-border)',
            padding: '2rem', maxWidth: '440px', width: '100%', textAlign: 'center',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🛋️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--lw-text)', margin: '0 0 10px', letterSpacing: '-0.3px' }}>
              You've used all your stagings this month
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--lw-text-muted)', lineHeight: '1.6', margin: '0 0 1.75rem' }}>
              Buy more credits to keep staging listings. Credits reset on the 1st of each month.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
              {CREDIT_PACKS.map(pack => (
                <button
                  key={pack.priceId}
                  onClick={() => handleBuyCredits(pack.priceId)}
                  disabled={buyingCredits === pack.priceId}
                  style={{
                    padding: '14px 20px',
                    background: buyingCredits === pack.priceId ? '#6b7280' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: buyingCredits === pack.priceId ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-plus-jakarta), sans-serif',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{pack.label}</span>
                  <span style={{ opacity: 0.85, fontWeight: '600' }}>{pack.price}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowUpsell(false)}
              style={{
                padding: '10px 24px', background: 'none', border: '1px solid var(--lw-border)',
                borderRadius: '20px', color: 'var(--lw-text-muted)', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
