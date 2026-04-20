'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

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
        setListingsUsed(prev => prev + 1)
        const { data: listings } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (listings) setPastListings(listings)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) {
      alert('Fetch error: ' + e.message)
    }
    setLoading(false)
  }

  const remaining = 3 - listingsUsed

  const tabs = [
    { key: 'mls_standard', label: 'MLS' },
    { key: 'mls_luxury', label: 'Luxury MLS' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'email', label: 'Email' },
    { key: 'openhouse', label: 'Open house' },
    { key: 'video', label: 'Video script' },
    { key: 'seo', label: 'SEO' },
  ]

  return (
    <main style={{minHeight:'100vh',padding:'2rem',fontFamily:'sans-serif',maxWidth:'680px',margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem'}}>
        <div style={{fontSize:'16px',fontWeight:'500'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          {plan === 'starter' && remaining > 0 && (
            <span style={{
              fontSize:'12px',
              fontWeight:'bold',
              color: remaining === 1 ? 'red' : '#666'
            }}>
              {remaining === 1 ? '1 listing left' : `${remaining} free listings remaining`}
            </span>
          )}
          <a href="/rewrite" style={{fontSize:'13px',color:'#1D9E75',fontWeight:'500',textDecoration:'none',border:'1px solid #1D9E75',padding:'4px 12px',borderRadius:'20px'}}>✨ Rewrite a Listing</a>
<a href="/" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign out</a>
        </div>
      </div>

      {plan === 'starter' && listingsUsed >= 3 && (
        <div style={{background:'#FFF3CD',border:'1px solid #FFCC00',borderRadius:'12px',padding:'1rem',marginBottom:'1rem',textAlign:'center'}}>
          <p style={{margin:'0 0 8px',fontSize:'14px',fontWeight:'500'}}>You've used all 3 free listings!</p>
          <button onClick={() => router.push('/pricing')}
            style={{background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',padding:'8px 20px',cursor:'pointer',fontSize:'13px'}}>
            Upgrade to Pro — $29/mo
          </button>
        </div>
      )}

      <h1 style={{fontSize:'1.25rem',fontWeight:'500',marginBottom:'0.25rem'}}>New listing</h1>
      <div style={{marginBottom:'1rem'}}>
        <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Listing nickname (optional)</label>
        <input placeholder="e.g. Johnson listing, 123 Main St" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}
          style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
      </div>
      <p style={{fontSize:'13px',color:'#666',marginBottom:'1.5rem'}}>Fill in the details and generate all your marketing copy.</p>

      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Property type</label>
            <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}>
              <option>Single family</option><option>Condo</option><option>Townhome</option>
              <option>Luxury estate</option><option>Multi-family</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Beds / Baths</label>
            <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e=>setForm({...form,beds:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
          </div>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Sq ft</label>
            <input placeholder="1,850" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
          </div>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Price</label>
            <input placeholder="$899,000" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
          </div>
        </div>
        <div style={{marginBottom:'10px'}}>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Neighborhood / City</label>
          <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e=>setForm({...form,neighborhood:e.target.value})}
            style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
        </div>
        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Best features</label>
          <input placeholder="Ocean views, chef's kitchen, spa bath" value={form.features} onChange={e=>setForm({...form,features:e.target.value})}
            style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}/>
        </div>
      </div>

      <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Tone</label>
            <select value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}>
              <option>Warm & inviting</option><option>Luxury & aspirational</option>
              <option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option>
            </select>
          </div>
          <div>
            <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Target buyer</label>
            <select value={form.buyer} onChange={e=>setForm({...form,buyer:e.target.value})}
              style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px'}}>
              <option>Move-up families</option><option>Luxury buyers</option>
              <option>First-time buyers</option><option>Investors</option><option>Downsizers</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Agent notes</label>
          <textarea placeholder="Any special details, upgrades, or story..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}
            style={{width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px',minHeight:'80px',resize:'vertical'}}/>
        </div>
      </div>

      {plan === 'pro' && (
        <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'10px'}}>
          <input type="checkbox" id="emailCopy" checked={emailCopy} onChange={e => setEmailCopy(e.target.checked)}
            style={{width:'16px',height:'16px',cursor:'pointer'}}/>
          <label htmlFor="emailCopy" style={{fontSize:'13px',color:'#333',cursor:'pointer'}}>
            Email me all generated copy at <strong>{userEmail}</strong>
          </label>
        </div>
      )}

      <button onClick={generate} disabled={loading || (plan === 'starter' && listingsUsed >= 3)}
        style={{width:'100%',padding:'12px',background: plan === 'starter' && listingsUsed >= 3 ? '#ccc' : '#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer',marginBottom:'1.5rem'}}>
        {loading ? 'Generating your copy...' : 'Generate all marketing copy'}
      </button>

      {outputs && (
        <div style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
            {tabs.map(t=>(
              <button key={t.key} onClick={()=>setActiveTab(t.key)}
                style={{fontSize:'12px',padding:'5px 12px',borderRadius:'20px',border:'1px solid',
                  borderColor:activeTab===t.key?'#1D9E75':'#ddd',
                  background:activeTab===t.key?'#E1F5EE':'none',
                  color:activeTab===t.key?'#085041':'#666',cursor:'pointer'}}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{background:'#f9f9f9',borderRadius:'12px',padding:'1.25rem',position:'relative'}}>
            <button onClick={()=>navigator.clipboard.writeText(outputs[activeTab]||'')}
              style={{position:'absolute',top:'12px',right:'12px',fontSize:'11px',padding:'4px 10px',borderRadius:'20px',background:'#fff',border:'1px solid #ddd',cursor:'pointer'}}>
              Copy
            </button>
            <p style={{fontSize:'13px',lineHeight:'1.8',whiteSpace:'pre-wrap',color:'#333',marginTop:'8px'}}>
              {outputs[activeTab] || ''}
            </p>
          </div>
        </div>
      )}

      {pastListings.length > 0 && (
        <div>
          <h2 style={{fontSize:'1rem',fontWeight:'500',marginBottom:'1rem'}}>Past listings</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {pastListings.map((listing) => (
              <div key={listing.id} onClick={() => setOutputs(listing.outputs)}
                style={{background:'#fff',border:'1px solid #eee',borderRadius:'12px',padding:'1rem',cursor:'pointer'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{margin:'0',fontSize:'13px',fontWeight:'500'}}>{listing.property_type} — {listing.neighborhood}</p>
                    <p style={{margin:'0',fontSize:'12px',color:'#666'}}>{listing.beds_baths} · {listing.sqft} sq ft · {listing.price}</p>
                  </div>
                  <p style={{margin:'0',fontSize:'11px',color:'#999'}}>{new Date(listing.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}