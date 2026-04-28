'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PricingAssistant() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [pastReports, setPastReports] = useState<any[]>([])
  const [form, setForm] = useState({
    propertyType: 'Single family',
    beds: '',
    baths: '',
    sqft: '',
    condition: 'Good',
    upgrades: '',
    neighborhood: '',
    comps: '',
    notes: '',
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: reports } = await supabase
          .from('pricing_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)
        if (reports) setPastReports(reports)
      }
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: '#0d1117', fontFamily: "'Inter', sans-serif", color: '#f0f0f0' },
    card: { background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0' },
    label: { fontSize: '11px', color: '#6b7280', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.neighborhood && !form.sqft) { alert('Please fill in at least the neighborhood and square footage.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/pricing-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else alert('Error: ' + (data.error || 'Something went wrong'))
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={{background:'rgba(10,13,20,0.98)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0.875rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
        <a href="/dashboard" style={{fontSize:'13px',color:'#5a5f72',textDecoration:'none'}}>← Dashboard</a>
        <div style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
        </div>
        <div style={{width:'80px'}}/>
      </div>

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'2.5rem 1.5rem'}}>

        {/* PAGE HEADER */}
        <div style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
            <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(212,175,55,0.12)',border:'1px solid rgba(212,175,55,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>💲</div>
            <div>
              <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',margin:'0',letterSpacing:'-0.3px'}}>Pricing Assistant</h1>
              <p style={{fontSize:'13px',color:'#5a5f72',margin:'0'}}>Data-backed pricing strategy and seller talking points</p>
            </div>
          </div>
          <div style={{background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.12)',borderRadius:'10px',padding:'10px 14px',marginTop:'12px'}}>
            <p style={{fontSize:'12px',color:'#a08040',margin:'0',lineHeight:'1.6'}}>
              ⚠️ This tool generates pricing guidance to help agents prepare for seller conversations — not a certified appraisal. Always verify with current MLS data and local market conditions.
            </p>
          </div>
        </div>

        {/* FORM */}
        <div style={{...styles.card, marginBottom:'1.5rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>PROPERTY DETAILS</p>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={styles.label}>Property Type</label>
              <select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})} style={styles.select}>
                <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Beds</label>
              <input placeholder="4" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Baths</label>
              <input placeholder="3" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Sq Ft</label>
              <input placeholder="2,200" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Condition</label>
              <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} style={styles.select}>
                <option>Excellent</option><option>Good</option><option>Average</option><option>Needs work</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Neighborhood / City</label>
              <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} style={styles.input}/>
            </div>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px',marginBottom:'16px'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 12px'}}>UPGRADES & FEATURES</p>
            <label style={styles.label}>Recent upgrades or notable features</label>
            <input placeholder="New kitchen, solar panels, ADU, pool, updated bathrooms..." value={form.upgrades} onChange={e => setForm({...form, upgrades: e.target.value})} style={{...styles.input, marginBottom:'12px'}}/>
          </div>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 4px'}}>COMPARABLE SALES (OPTIONAL)</p>
            <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'12px'}}>Enter up to 3 recent sold properties nearby for a more accurate analysis.</p>

            {[0,1,2].map(i => (
              <div key={i} style={{background:'rgba(0,0,0,0.2)',borderRadius:'10px',padding:'12px',marginBottom:'8px',border:'1px solid rgba(255,255,255,0.05)'}}>
                <p style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',margin:'0 0 8px',letterSpacing:'0.5px'}}>COMP {i+1}</p>
                <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'8px'}}>
                  <input placeholder="123 Oak St" 
                    value={(form as any)[`comp${i}_address`] || ''} 
                    onChange={e => setForm({...form, [`comp${i}_address`]: e.target.value} as any)}
                    style={{...styles.input, fontSize:'12px', padding:'8px 10px'}}/>
                  <input placeholder="Beds/Ba" 
                    value={(form as any)[`comp${i}_beds`] || ''} 
                    onChange={e => setForm({...form, [`comp${i}_beds`]: e.target.value} as any)}
                    style={{...styles.input, fontSize:'12px', padding:'8px 10px'}}/>
                  <input placeholder="Sq Ft" 
                    value={(form as any)[`comp${i}_sqft`] || ''} 
                    onChange={e => setForm({...form, [`comp${i}_sqft`]: e.target.value} as any)}
                    style={{...styles.input, fontSize:'12px', padding:'8px 10px'}}/>
                  <input placeholder="Sold $" 
                    value={(form as any)[`comp${i}_price`] || ''} 
                    onChange={e => setForm({...form, [`comp${i}_price`]: e.target.value} as any)}
                    style={{...styles.input, fontSize:'12px', padding:'8px 10px'}}/>
                </div>
              </div>
            ))}

            <div style={{marginTop:'12px',marginBottom:'16px'}}>
              <label style={styles.label}>Additional notes</label>
              <textarea placeholder="Seller expects $1.2M, market has been slow, corner lot..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                style={{...styles.input, minHeight:'60px', resize:'vertical' as const}}/>
            </div>

            <button onClick={generate} disabled={loading}
              style={{width:'100%',padding:'15px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 30px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
              {loading ? '⏳ Analyzing...' : '💲 Generate Pricing Strategy'}
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{...styles.card, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px'}}>
            <style>{`
              @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
              @keyframes shimmer { 0% { background-position: -800px 0 } 100% { background-position: 800px 0 } }
            `}</style>
            <div style={{display:'flex',gap:'4px'}}>
              {[0,1,2].map(i => (
                <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#d4af37',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>
              ))}
            </div>
            <p style={{color:'#f0f0f0',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>Analyzing market factors and building your pricing strategy...</p>
            <span style={{fontSize:'12px',color:'#d4af37',fontWeight:'600'}}>⏳</span>
          </div>
        )}

        {/* PAST REPORTS */}
        {pastReports.length > 0 && !result && !loading && (
          <div style={{...styles.card, marginBottom:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#d4af37',letterSpacing:'1px',margin:'0 0 12px'}}>RECENT PRICING REPORTS</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {pastReports.map(report => (
                <div key={report.id}
                  onClick={() => setResult(report.full_report)}
                  style={{background:'rgba(0,0,0,0.2)',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.06)',padding:'0.875rem 1rem',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s'}}
                  onMouseOver={e => {e.currentTarget.style.borderColor='rgba(212,175,55,0.25)';e.currentTarget.style.background='rgba(212,175,55,0.04)'}}
                  onMouseOut={e => {e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.background='rgba(0,0,0,0.2)'}}>
                  <div>
                    <p style={{margin:'0',fontSize:'13px',fontWeight:'600',color:'#d0d0d0'}}>
                      {report.neighborhood || report.property_type} · {report.price_range}
                    </p>
                    <p style={{margin:'3px 0 0',fontSize:'11px',color:'#3a3f52'}}>
                      {report.beds}bd / {report.baths}ba · {report.sqft} sqft · {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{fontSize:'11px',color:'#d4af37',fontWeight:'500'}}>View →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

            {/* PRICE RANGE HERO */}
            <div style={{background:'linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04))',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.2)',padding:'2rem',boxShadow:'0 8px 32px rgba(0,0,0,0.3)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'12px'}}>
                <div>
                  <p style={{fontSize:'11px',fontWeight:'700',color:'#a08040',letterSpacing:'1px',margin:'0 0 8px'}}>SUGGESTED LIST PRICE RANGE</p>
                  <p style={{fontSize:'2.25rem',fontWeight:'800',color:'#d4af37',margin:'0',letterSpacing:'-1px'}}>{result.priceRange}</p>
                  <p style={{fontSize:'13px',color:'#6b7280',margin:'6px 0 0'}}>{result.confidence}</p>
                </div>
                <button onClick={() => handleCopy('range', result.priceRange)}
                  style={{padding:'8px 18px',borderRadius:'8px',border:'1px solid rgba(212,175,55,0.3)',fontSize:'12px',cursor:'pointer',fontWeight:'600',background: copied === 'range' ? '#d4af37' : 'rgba(212,175,55,0.1)',color: copied === 'range' ? '#000' : '#d4af37'}}>
                  {copied === 'range' ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            {/* OUTPUT CARDS */}
            {[
              { key: 'strategy', label: 'Pricing Strategy', icon: '🎯', color: '#1D9E75', desc: 'How to position this listing' },
              { key: 'sellerTalkingPoints', label: 'Seller Talking Points', icon: '💬', color: '#8b5cf6', desc: 'How to explain the price to your seller' },
              { key: 'keyFactors', label: 'Key Pricing Factors', icon: '📊', color: '#d4af37', desc: 'What drove this recommendation' },
              { key: 'objectionResponses', label: 'Objection Responses', icon: '🛡️', color: '#ef4444', desc: 'Answers to common seller pushback' },
              { key: 'marketPositioning', label: 'Market Positioning', icon: '🏆', color: '#f59e0b', desc: 'How this home compares to the market' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{...styles.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{card.icon}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>{card.label}</p>
                      <p style={{fontSize:'11px',color:'#5a5f72',margin:'0'}}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'rgba(0,0,0,0.2)',color: copied === card.key ? '#fff' : '#6b7280',borderColor: copied === card.key ? card.color : 'rgba(255,255,255,0.08)'}}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.85',color:'#c0c0c0',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}

            {/* ACTIONS */}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'8px'}}>
              <a href="/seller-prep" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
                📋 Open Seller Prep
              </a>
              <button onClick={() => { setResult(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{padding:'10px 20px',background:'rgba(0,0,0,0.2)',color:'#8b8fa8',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.08)',fontSize:'13px',cursor:'pointer'}}>
                ↺ Run Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}