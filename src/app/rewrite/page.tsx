'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RewritePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [listing, setListing] = useState('')
  const [style, setStyle] = useState('Professional and compelling')
  const [outputs, setOutputs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('standard')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
    }
    getUser()
  }, [])

  const rewrite = async () => {
    if (!listing.trim()) { alert('Please paste a listing first!'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing, style })
      })
      const data = await res.json()
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('standard')
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Error: ' + e.message)
    }
    setLoading(false)
  }

  const tabs = [
    { key: 'standard', label: 'Standard MLS' },
    { key: 'luxury', label: 'Luxury' },
    { key: 'short', label: 'Short Version' },
    { key: 'social', label: 'Instagram' },
    { key: 'headline', label: 'Headlines' },
    { key: 'improvements', label: 'What Changed' },
  ]

  return (
    <main style={{minHeight:'100vh',padding:'2rem',fontFamily:'sans-serif',maxWidth:'740px',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',gap:'12px'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>← New Listing</a>
          <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{marginBottom:'2rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'600',marginBottom:'0.25rem'}}>Listing Rewriter</h1>
        <p style={{fontSize:'13px',color:'#666'}}>Paste any boring listing description and get it rewritten in seconds.</p>
      </div>

      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Paste your existing listing description</label>
        <textarea
          placeholder="Paste your current MLS description here... even if it's boring or basic, we'll make it shine."
          value={listing}
          onChange={e => setListing(e.target.value)}
          style={{width:'100%',padding:'10px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px',minHeight:'150px',resize:'vertical',boxSizing:'border-box'}}
        />
      </div>

      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'8px'}}>Rewrite style</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
          {['Professional and compelling','Luxury and aspirational','Warm and inviting','Modern and minimal','Investment-focused'].map(s => (
            <button key={s} onClick={() => setStyle(s)}
              style={{padding:'6px 14px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',
                borderColor: style === s ? '#1D9E75' : '#ddd',
                background: style === s ? '#E1F5EE' : '#fff',
                color: style === s ? '#085041' : '#666'}}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button onClick={rewrite} disabled={loading}
        style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer',marginBottom:'1.5rem'}}>
        {loading ? 'Rewriting your listing...' : '✨ Rewrite this listing'}
      </button>

      {outputs && (
        <div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{fontSize:'12px',padding:'5px 12px',borderRadius:'20px',border:'1px solid',
                  borderColor: activeTab === t.key ? '#1D9E75' : '#ddd',
                  background: activeTab === t.key ? '#E1F5EE' : '#fff',
                  color: activeTab === t.key ? '#085041' : '#666',cursor:'pointer'}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{background:'#f9fafb',borderRadius:'12px',padding:'1.25rem',position:'relative'}}>
            <button onClick={() => navigator.clipboard.writeText(outputs[activeTab] || '')}
              style={{position:'absolute',top:'12px',right:'12px',fontSize:'11px',padding:'4px 10px',borderRadius:'20px',background:'#fff',border:'1px solid #ddd',cursor:'pointer'}}>
              Copy
            </button>
            <p style={{fontSize:'13px',lineHeight:'1.8',whiteSpace:'pre-wrap',color:'#333',marginTop:'8px'}}>
              {outputs[activeTab] || ''}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}