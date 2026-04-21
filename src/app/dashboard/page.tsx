'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackDashboardView, trackListingCreated, trackOutputCopied, trackUpgradeClick } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [listingsUsed, setListingsUsed] = useState(0)
  const [plan, setPlan] = useState('starter')
  const [form, setForm] = useState({
    type: 'Single family', beds: '', sqft: '', price: '',
    neighborhood: '', features: '', tone: 'Warm & inviting', name: '',
    buyer: 'Move-up families', notes: ''
  })
  const [outputs, setOutputs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [pastListings, setPastListings] = useState<any[]>([])
  const [emailCopy, setEmailCopy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string[]>([])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setUserEmail(user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('listings_used, plan')
        .eq('id', user.id)
        .single()

      if (profile) {
        setListingsUsed(profile.listings_used || 0)
        setPlan(profile.plan || 'starter')
        trackDashboardView(profile.plan || 'starter')
      }

      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (listings) setPastListings(listings)
    }
    getUser()
  }, [])

  const generate = async () => {
    if (plan === 'starter' && listingsUsed >= 3) {
      router.push('/pricing')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form, userId, userEmail, sendEmail: plan === 'pro' && emailCopy })
      })
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') {
        router.push('/pricing')
        return
      }
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('mls_standard')
        setListingsUsed(prev => prev + 1)
        trackListingCreated(plan, form.neighborhood)
        const { data: listings } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (listings) setPastListings(listings)
        // Scroll to results
        setTimeout(() => {
          document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Fetch error: ' + e.message)
    }
    setLoading(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setAnalyzingPhotos(true)
    setShowPhotoUpload(false)

    try {
      // Convert images to base64
      const base64Images = await Promise.all(
        files.slice(0, 5).map(file => new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        }))
      )

      setPhotoPreview(base64Images)

      const res = await fetch('/api/analyze-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: base64Images })
      })

      const data = await res.json()
      if (data.analysis) {
        setForm(prev => ({
          ...prev,
          features: data.analysis.features || prev.features,
          type: data.analysis.property_type || prev.type,
          notes: data.analysis.highlights || '',
        }))
        alert(`✅ Photos analyzed! Features and highlights auto-filled. Review and edit the fields before generating.`)
      } else {
        alert('Could not analyze photos. Please try again.')
      }
    } catch(e: any) {
      alert('Photo analysis error: ' + e.message)
    }
    setAnalyzingPhotos(false)
  }

  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      const res = await fetch('/api/import-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })
      const data = await res.json()
      if (data.listing) {
        setForm({
          ...form,
          type: data.listing.type || form.type,
          beds: data.listing.beds || form.beds,
          sqft: data.listing.sqft || form.sqft,
          price: data.listing.price || form.price,
          neighborhood: data.listing.neighborhood || form.neighborhood,
          features: data.listing.features || form.features,
          notes: data.listing.notes || form.notes,
        })
        setShowImport(false)
        setImportUrl('')
        alert('✅ Listing details imported! Review and edit before generating.')
      } else {
        alert('Could not import that URL. Try a Zillow or Redfin listing page.')
      }
    } catch(e: any) {
      alert('Import error: ' + e.message)
    }
    setImporting(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputs[activeTab] || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackOutputCopied(activeTab, plan)
  }

  const remaining = 3 - listingsUsed

  const tabs = [
    { key: 'mls_standard', label: 'MLS', icon: '🏠' },
    { key: 'mls_luxury', label: 'Luxury MLS', icon: '✨' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'facebook', label: 'Facebook', icon: '👥' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'openhouse', label: 'Open House', icon: '🚪' },
    { key: 'video', label: 'Video Script', icon: '🎬' },
    { key: 'seo', label: 'SEO', icon: '🔍' },
    { key: 'text_message', label: 'Text/SMS', icon: '📱' },
    { key: 'flyer', label: 'Flyer', icon: '📄' },
    { key: 'price_drop', label: 'Price Drop', icon: '💰' },
  ]

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>

      {/* TOP NAV */}
      <div style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'600'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>
              PRO
            </span>
          )}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          {plan === 'starter' && remaining > 0 && (
            <span style={{fontSize:'12px',fontWeight:'bold',color: remaining === 1 ? 'red' : '#666'}}>
              {remaining === 1 ? '⚠️ 1 listing left' : `${remaining} free listings remaining`}
            </span>
          )}
          <a href="/rewrite" style={{fontSize:'13px',color:'#1D9E75',fontWeight:'500',textDecoration:'none',border:'1px solid #1D9E75',padding:'4px 12px',borderRadius:'20px'}}>✨ Rewrite</a>
          <a href="/launch-kit" style={{fontSize:'13px',color:'#1D9E75',fontWeight:'500',textDecoration:'none',border:'1px solid #1D9E75',padding:'4px 12px',borderRadius:'20px'}}>🚀 Launch Kit</a>
          <a href="/settings" style={{fontSize:'13px',color:'#666',textDecoration:'none',padding:'4px 12px',borderRadius:'20px',border:'1px solid #eee'}}>⚙️ Settings</a>
          {plan === 'starter' && (
            <a href="/pricing" onClick={() => trackUpgradeClick('dashboard_nav', plan)} style={{fontSize:'13px',background:'#1D9E75',color:'#fff',textDecoration:'none',padding:'6px 14px',borderRadius:'20px',fontWeight:'500'}}>Upgrade</a>
          )}
          <a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {plan === 'starter' && listingsUsed >= 3 && (
          <div style={{background:'#FFF3CD',border:'1px solid #FFCC00',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem',textAlign:'center'}}>
            <p style={{margin:'0 0 8px',fontSize:'14px',fontWeight:'600'}}>You've used all 3 free listings!</p>
            <p style={{fontSize:'13px',color:'#666',margin:'0 0 12px'}}>Upgrade to Pro for unlimited listings, rewrites, and full marketing kits.</p>
            <button onClick={() => router.push('/pricing')}
              style={{background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',padding:'10px 24px',cursor:'pointer',fontSize:'14px',fontWeight:'600'}}>
              Upgrade to Pro — $29/mo
            </button>
          </div>
        )}

        {/* FORM */}
        <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.25rem'}}>
            <h1 style={{fontSize:'1.25rem',fontWeight:'600',margin:'0'}}>New listing</h1>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={() => setShowImport(!showImport)}
                style={{fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',cursor:'pointer',fontWeight:'500'}}>
                📋 Paste Details
              </button>
              <label title="Upload 1-5 photos of the property interior/exterior. AI will detect features automatically." style={{fontSize:'12px',padding:'6px 14px',borderRadius:'20px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',cursor:'pointer',fontWeight:'500'}}>
                {analyzingPhotos ? '🔍 Analyzing photos...' : '📸 Upload Property Photos'}
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:'none'}} disabled={analyzingPhotos}/>
              </label>
            </div>
          </div>

          {showImport && (
            <div style={{background:'#f0fdf8',borderRadius:'10px',padding:'1rem',marginBottom:'1rem',border:'1px solid #bbf0d9'}}>
              <p style={{fontSize:'13px',color:'#085041',fontWeight:'500',marginBottom:'4px'}}>📋 How to use this:</p>
              <ol style={{fontSize:'12px',color:'#444',lineHeight:'2',marginBottom:'10px',paddingLeft:'16px'}}>
                <li>Open a listing on Zillow, Redfin, or Realtor.com</li>
                <li>Copy <strong>only the listing details</strong> — beds, baths, price, sq ft, address, and features</li>
                <li>Do NOT copy the whole page — just the property facts section</li>
                <li>Paste below and we'll fill the form automatically</li>
              </ol>
              <div style={{background:'#fffbe6',border:'1px solid #ffe58f',borderRadius:'8px',padding:'8px 12px',marginBottom:'10px',fontSize:'12px',color:'#666'}}>
                💡 <strong>Tip:</strong> The more specific your paste, the better the results. Include price, beds/baths, sq ft, address, and key features only.
              </div>
              <textarea
                placeholder="Paste copied listing text here... e.g. '3 bed / 2 bath, 1,850 sq ft, $899,000, Newport Beach CA. Features: ocean views, chef kitchen, spa bath. Built 2018...'"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                style={{width:'100%',padding:'8px',border:'1px solid #bbf0d9',borderRadius:'8px',fontSize:'13px',minHeight:'100px',resize:'vertical',boxSizing:'border-box',marginBottom:'8px'}}
              />
              <button onClick={handleImport} disabled={importing}
                style={{width:'100%',padding:'10px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'500'}}>
                {importing ? 'Extracting details...' : '✨ Extract & Fill Form'}
              </button>
              <p style={{fontSize:'11px',color:'#888',marginTop:'6px'}}>⚠️ Note: Real estate sites like Zillow block direct URL imports, so paste the text instead — it works better!</p>
            </div>
          )}

          <p style={{fontSize:'13px',color:'#666',marginBottom:'1.25rem'}}>Fill in the details and generate all your marketing copy.</p>

          <div style={{marginBottom:'1rem'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Listing nickname (optional)</label>
            <input placeholder="e.g. Johnson listing, 123 Main St" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Property type</label>
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
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Sq ft</label>
              <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Price</label>
              <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Neighborhood / City</label>
            <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Best features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath" value={form.features} onChange={e=>setForm({...form,features:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',boxSizing:'border-box'}}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Tone</label>
              <select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                <option>Warm & inviting</option><option>Luxury & aspirational</option>
                <option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Target buyer</label>
              <select value={form.buyer} onChange={e=>setForm({...form,buyer:e.target.value})}
                style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}>
                <option>Move-up families</option><option>Luxury buyers</option>
                <option>First-time buyers</option><option>Investors</option><option>Downsizers</option>
              </select>
            </div>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px',fontWeight:'500'}}>Agent notes</label>
            <textarea placeholder="Any special details, upgrades, or story..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
              style={{width:'100%',padding:'10px',border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px',minHeight:'80px',resize:'vertical',boxSizing:'border-box'}}/>
          </div>

          {plan === 'pro' && (
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px',padding:'10px',background:'#f0fdf8',borderRadius:'8px',border:'1px solid #bbf0d9'}}>
              <input type="checkbox" id="emailCopy" checked={emailCopy} onChange={e => setEmailCopy(e.target.checked)}
                style={{width:'16px',height:'16px',cursor:'pointer'}}/>
              <label htmlFor="emailCopy" style={{fontSize:'13px',color:'#333',cursor:'pointer'}}>
                Email me all generated copy at <strong>{userEmail}</strong>
              </label>
            </div>
          )}

          <button onClick={generate} disabled={loading || (plan === 'starter' && listingsUsed >= 3)}
            style={{width:'100%',padding:'13px',background: plan === 'starter' && listingsUsed >= 3 ? '#ccc' : '#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor: plan === 'starter' && listingsUsed >= 3 ? 'not-allowed' : 'pointer',transition:'all 0.2s'}}>
            {loading ? '✨ Generating your marketing copy...' : '🚀 Generate All Marketing Copy'}
          </button>
        </div>

        {/* LOADING BANNER */}
        {loading && (
          <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #e5e7eb',padding:'2rem',marginBottom:'1.5rem',textAlign:'center',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{fontSize:'2rem',marginBottom:'1rem'}}>✨</div>
            <p style={{fontSize:'15px',fontWeight:'600',color:'#333',marginBottom:'8px'}}>Generating your marketing copy...</p>
            <p style={{fontSize:'13px',color:'#666',marginBottom:'16px'}}>This takes about 15-20 seconds. Please don't close this page!</p>
            <div style={{background:'#f0fdf8',borderRadius:'8px',padding:'12px',border:'1px solid #bbf0d9'}}>
              <p style={{fontSize:'12px',color:'#085041',margin:'0'}}>🏠 Creating MLS copy, Instagram captions, email blast, and 5 more formats...</p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {outputs && (
          <div id="results" style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',marginBottom:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
              <h2 style={{fontSize:'1rem',fontWeight:'600',margin:'0'}}>🎉 Your marketing copy is ready!</h2>
              <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>8 formats generated</span>
            </div>

            {/* TABS */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1.25rem'}}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{fontSize:'12px',padding:'6px 14px',borderRadius:'20px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                    borderColor: activeTab === t.key ? '#1D9E75' : '#e5e7eb',
                    background: activeTab === t.key ? '#1D9E75' : '#fff',
                    color: activeTab === t.key ? '#fff' : '#666',
                    fontWeight: activeTab === t.key ? '600' : '400'}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* OUTPUT BOX */}
            <div style={{background:'#f8fafc',borderRadius:'12px',padding:'1.5rem',border:'1px solid #e5e7eb',position:'relative',minHeight:'120px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                <span style={{fontSize:'12px',fontWeight:'600',color:'#1D9E75',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                  {tabs.find(t => t.key === activeTab)?.icon} {tabs.find(t => t.key === activeTab)?.label}
                </span>
                <button onClick={handleCopy}
                  style={{fontSize:'12px',padding:'6px 16px',borderRadius:'20px',background: copied ? '#1D9E75' : '#fff',color: copied ? '#fff' : '#333',border:'1px solid',borderColor: copied ? '#1D9E75' : '#ddd',cursor:'pointer',fontWeight:'500',transition:'all 0.2s'}}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
              <p style={{fontSize:'14px',lineHeight:'1.9',whiteSpace:'pre-wrap',color:'#333',margin:'0'}}>
                {outputs[activeTab] || ''}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <a href="/rewrite" style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f0fdf8',color:'#085041',border:'1px solid #bbf0d9',textDecoration:'none',fontWeight:'500'}}>
                ✨ Rewrite & Improve
              </a>
              <button onClick={() => setOutputs(null)}
                style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#f8fafc',color:'#666',border:'1px solid #e5e7eb',cursor:'pointer'}}>
                🔄 New Listing
              </button>
              {plan === 'starter' && (
                <a href="/pricing" style={{fontSize:'12px',padding:'7px 14px',borderRadius:'8px',background:'#1D9E75',color:'#fff',textDecoration:'none',fontWeight:'500'}}>
                  ⚡ Upgrade for Unlimited
                </a>
              )}
            </div>
          </div>
        )}

        {/* PAST LISTINGS */}
        {pastListings.length > 0 && (
          <div style={{background:'#fff',borderRadius:'16px',border:'1px solid #eee',padding:'1.5rem',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <h2 style={{fontSize:'1rem',fontWeight:'600',marginBottom:'1rem'}}>📁 Past listings</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {pastListings.map((listing) => (
                <div key={listing.id} onClick={() => { setOutputs(listing.outputs); setActiveTab('mls_standard'); setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 100) }}
                  style={{background:'#f8fafc',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'12px 16px',cursor:'pointer',transition:'all 0.15s'}}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <p style={{margin:'0',fontSize:'13px',fontWeight:'600',color:'#111'}}>
                        {listing.name || `${listing.property_type} — ${listing.neighborhood}`}
                      </p>
                      <p style={{margin:'4px 0 0',fontSize:'12px',color:'#888'}}>
                        {listing.beds_baths} · {listing.sqft} sq ft · {listing.price}
                      </p>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <p style={{margin:'0',fontSize:'11px',color:'#999'}}>{new Date(listing.created_at).toLocaleDateString()}</p>
                      <p style={{margin:'4px 0 0',fontSize:'11px',color:'#1D9E75',fontWeight:'500'}}>View copy →</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}