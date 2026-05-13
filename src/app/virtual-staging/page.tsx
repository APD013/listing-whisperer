'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ROOM_TYPES = [
  'Living Room', 'Bedroom', 'Dining Room', 'Kitchen',
  'Bathroom', 'Home Office', 'Kids Room'
]

const DESIGN_STYLES = [
  'Modern', 'Scandinavian', 'Industrial', 'Bohemian',
  'Coastal', 'Farmhouse', 'Luxury', 'Minimalist', 'Mid-Century'
]

export default function VirtualStagingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [roomType, setRoomType] = useState('Living Room')
  const [designStyle, setDesignStyle] = useState('Modern')
  const [results, setResults] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    }
    getUser()
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
      if (data.error) {
        setError(data.error)
      } else {
        setResults(data.images)
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  const handleDownload = async (url: string, index: number) => {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `virtually-staged-${index + 1}.jpg`
    a.click()
  }

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
        <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.75rem 2rem', marginBottom: '2rem' }}>
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
                {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>DESIGN STYLE</label>
              <select value={designStyle} onChange={e => setDesignStyle(e.target.value)} style={inputStyle}>
                {DESIGN_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
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
          </div>
        )}

        {/* Disclosure notice */}
        {results.length > 0 && (
          <div style={{
            background: '#f59e0b10', borderRadius: '12px', border: '1px solid #f59e0b30',
            padding: '1rem 1.25rem', fontSize: '13px', color: 'var(--lw-text-muted)', lineHeight: '1.6',
          }}>
            ⚠️ <strong style={{ color: 'var(--lw-text)' }}>Disclosure required:</strong> Virtually staged images must be labeled when used in MLS listings. Always disclose to buyers.
          </div>
        )}
      </div>
    </div>
  )
}
