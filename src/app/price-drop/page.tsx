'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackEvent } from '../lib/analytics'
import { saveToWorkspace } from '../lib/workspace'
import SaveToWorkspace from '../components/SaveToWorkspace'
import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PriceDropKit() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceAddress, setWorkspaceAddress] = useState<string | null>(null)
  const [workspaceToast, setWorkspaceToast] = useState<string | null>(null)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    originalPrice: '',
    newPrice: '',
    beds: '',
    baths: '',
    sqft: '',
    highlights: '',
    daysOnMarket: '',
    reason: '',
    agentName: '',
    phone: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'price_drop' })
    const params = new URLSearchParams(window.location.search)
    const wsId = params.get('workspace')
    if (wsId) setWorkspaceId(wsId)
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        if (wsId) {
          const { data: ws } = await supabase.from('listing_workspaces').select('address').eq('id', wsId).single()
          if (ws) setWorkspaceAddress(ws.address)
        }
      }
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: "var(--font-plus-jakarta), sans-serif", color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.address || !form.newPrice) { alert('Please fill in the address and new price.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/price-drop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        if (workspaceId) {
          await saveToWorkspace(workspaceId, 'price_drop_kit', data.result.mlsUpdate || JSON.stringify(data.result).slice(0, 500))
          const toast = `✅ Saved to ${workspaceAddress || 'workspace'}`
          setWorkspaceToast(toast)
          setTimeout(() => setWorkspaceToast(null), 3500)
        }
      } else alert('Error: ' + (data.error || 'Something went wrong'))
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={{position:'fixed',top:'10%',left:'5%',width:'350px',height:'350px',background:'radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'20%',right:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(220,38,38,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      <Navbar />

      {workspaceId && (
        <div style={{ background: 'rgba(29,158,117,0.08)', borderBottom: '1px solid rgba(29,158,117,0.2)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--lw-text)' }}>
          <span style={{ fontSize: '16px' }}>📁</span>
          <span>Working in workspace: <strong>{workspaceAddress || workspaceId}</strong> — price drop kit will be saved automatically.</span>
          <a href={`/workspace/${workspaceId}`} style={{ marginLeft: 'auto', color: '#1D9E75', fontWeight: '600', textDecoration: 'none', fontSize: '12px' }}>View Workspace →</a>
        </div>
      )}

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',borderRadius:'20px',padding:'2.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 60px rgba(239,68,68,0.25)',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'rgba(255,255,255,0.15)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:'700',color:'rgba(255,255,255,0.9)',letterSpacing:'1px',marginBottom:'14px'}}>PRICE DROP KIT</div>
          <h1 style={{fontSize:'2rem',fontWeight:'800',color:'#fff',marginBottom:'10px',letterSpacing:'-0.03em',lineHeight:'1.2'}}>Turn a price reduction into a marketing moment.</h1>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.88)',lineHeight:'1.7',maxWidth:'500px',margin:'0 auto 18px'}}>Instantly generate MLS updates, social posts, email blasts, and SMS alerts that reframe the drop as opportunity.</p>
          <button onClick={() => document.getElementById('price-drop-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{background:'rgba(255,255,255,0.2)',border:'1.5px solid rgba(255,255,255,0.5)',color:'#fff',borderRadius:'10px',padding:'11px 28px',fontSize:'14px',fontWeight:'700',cursor:'pointer',backdropFilter:'blur(4px)'}}>
            Build My Kit →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'10px'}}>
            {[
              {s:'1',icon:'📋',title:'Enter property details',desc:'Add the address, prices, and key features of the listing.'},
              {s:'2',icon:'💰',title:'Set the new price',desc:'Tell us the original and new price so we can frame it positively.'},
              {s:'3',icon:'🚀',title:'Get your full kit',desc:'Receive MLS update, social post, email blast, SMS, and talking points.'},
            ].map(({s,icon,title,desc}) => (
              <div key={s} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'14px',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                  <span style={{width:'22px',height:'22px',background:'linear-gradient(135deg,#ef4444,#dc2626)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'800',color:'#fff',flexShrink:0}}>{s}</span>
                  <span style={{fontSize:'1rem'}}>{icon}</span>
                </div>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',lineHeight:'1.4'}}>{title}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <div id="price-drop-form" style={{...styles.card, border:'1px solid rgba(239,68,68,0.15)', marginBottom:'1.5rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid var(--lw-border)'}}>LISTING DETAILS</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'16px'}}>
            <div style={{gridColumn:'1 / -1'}}>
              <label style={styles.label}>Property Address</label>
              <input placeholder="123 Oak Street, Newport Beach, CA" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>City</label>
              <input placeholder="e.g. Newport Beach" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>State</label>
              <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={styles.input}>
                <option value="">Select State</option>
                {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={styles.label}>Original Price</label>
              <input placeholder="$1,095,000" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>New Price</label>
              <input placeholder="$979,000" value={form.newPrice} onChange={e => setForm({...form, newPrice: e.target.value})} style={styles.input}/>
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
              <label style={styles.label}>Days on Market</label>
              <input placeholder="32" value={form.daysOnMarket} onChange={e => setForm({...form, daysOnMarket: e.target.value})} style={styles.input}/>
            </div>
          </div>

          <div style={{borderTop:'1px solid var(--lw-border)',paddingTop:'16px',marginBottom:'16px'}}>
            <label style={styles.label}>Key highlights / features</label>
            <input placeholder="Ocean views, chef's kitchen, spa bath..." value={form.highlights} onChange={e => setForm({...form, highlights: e.target.value})} style={{...styles.input, marginBottom:'12px'}}/>
            <label style={styles.label}>Reason for price improvement (optional — for agent context only)</label>
            <input placeholder="Motivated seller, relocation, market adjustment..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} style={styles.input}/>
          </div>

          <div style={{borderTop:'1px solid var(--lw-border)',paddingTop:'16px'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',margin:'0 0 12px'}}>AGENT INFO (OPTIONAL)</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div>
                <label style={styles.label}>Agent Name</label>
                <input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({...form, agentName: e.target.value})} style={styles.input}/>
              </div>
              <div>
                <label style={styles.label}>Phone</label>
                <input placeholder="(949) 555-0123" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={styles.input}/>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))',gap:'10px'}}>
            {[
              {icon:'🏠',label:'MLS Price Update',desc:'Rewritten MLS description that highlights the value at the new price.'},
              {icon:'📱',label:'Social Media Post',desc:'Instagram & Facebook announcement that reframes the reduction as opportunity.'},
              {icon:'📧',label:'Email Blast',desc:'Ready-to-send email for your buyer list and sphere.'},
              {icon:'💬',label:'SMS Alert',desc:'Short text to send directly to interested buyers.'},
              {icon:'🎯',label:'Agent Talking Points',desc:'How to position the price change confidently to buyers.'},
            ].map(({icon,label,desc}) => (
              <div key={label} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'5px'}}>
                <span style={{fontSize:'1.2rem'}}>{icon}</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)'}}>{label}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={generate} disabled={loading}
          style={{width:'100%',padding:'16px',background: loading ? 'rgba(239,68,68,0.4)' : 'linear-gradient(135deg,#ef4444,#dc2626)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'16px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 40px rgba(239,68,68,0.35)',transition:'all 0.2s',marginBottom:'1.5rem'}}>
          {loading ? '⏳ Generating...' : '💰 Generate Price Drop Kit'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{...styles.card, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px'}}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{display:'flex',gap:'4px'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#ef4444',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            <p style={{color:'var(--lw-text)',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>Building your price drop announcement kit...</p>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {workspaceToast && (
              <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', color: '#1D9E75', fontWeight: '600' }}>
                {workspaceToast}
              </div>
            )}
            {[
              { key: 'mlsUpdate', label: 'MLS Price Improvement', icon: '🏠', color: '#1D9E75', desc: 'Updated MLS description highlighting the new price' },
              { key: 'socialPost', label: 'Social Media Post', icon: '📱', color: '#e1306c', desc: 'Instagram & Facebook price improvement announcement' },
              { key: 'emailBlast', label: 'Email Blast', icon: '📧', color: '#6366f1', desc: 'Email to your list announcing the price improvement' },
              { key: 'smsAlert', label: 'SMS Alert', icon: '💬', color: '#10b981', desc: 'Text message to send to interested buyers' },
              { key: 'agentNotes', label: 'Agent Talking Points', icon: '🎯', color: '#d4af37', desc: 'How to position the price improvement to buyers' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{...styles.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{card.icon}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>{card.label}</p>
                      <p style={{fontSize:'11px',color:'var(--lw-text-muted)',margin:'0'}}>{card.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(card.key, result[card.key])}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'var(--lw-input)',color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',borderColor: copied === card.key ? card.color : 'var(--lw-border)'}}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.85',color:'var(--lw-text)',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'8px'}}>
              <a href="/dashboard" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>← Back to Dashboard</a>
              <button onClick={() => { setResult(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{padding:'10px 20px',background:'var(--lw-input)',color:'var(--lw-text-muted)',borderRadius:'10px',border:'1px solid var(--lw-border)',fontSize:'13px',cursor:'pointer'}}>
                ↺ New Price Drop
              </button>
            </div>
            {!workspaceId && userId && (
              <SaveToWorkspace
                userId={userId}
                assetKey="price_drop_kit"
                assetValue={result.mlsUpdate || JSON.stringify(result).slice(0, 500)}
                onSaved={(address) => {
                  setWorkspaceToast(`✅ Saved to ${address} workspace`)
                  setTimeout(() => setWorkspaceToast(null), 3500)
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
