'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'
import AskAiHint from '../components/AskAiHint'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const commonObjections = [
  "Your commission is too high",
  "Zillow says my house is worth more",
  "I want to wait until spring to sell",
  "I can sell it myself (FSBO)",
  "We want to try it ourselves first",
  "Another agent will do it for less",
  "The market is too slow right now",
  "I need to think about it",
  "Your buyer's offer is too low",
  "I don't want to do any repairs",
  "We're not in a hurry to sell",
  "I want to rent it out instead",
]

export default function ObjectionHandlerPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [objection, setObjection] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [history, setHistory] = useState<{objection:string, result:any}[]>([])

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'objection_handler' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!objection) { alert('Please enter an objection!'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/objection-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objection, context })
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        setHistory(prev => [{objection, result: data.result}, ...prev.slice(0, 4)])
        setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100)
      } else {
        alert('Error: ' + JSON.stringify(data))
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const cardStyle = { background:'var(--lw-card)', borderRadius:'16px', border:'1px solid var(--lw-border)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', marginBottom:'1rem' }
  const inputStyle = { width:'100%', padding:'11px 14px', background:'var(--lw-input)', border:'1px solid var(--lw-border)', borderRadius:'8px', fontSize:'13px', color:'var(--lw-text)', boxSizing:'border-box' as const, outline:'none' }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{minHeight:'100vh',background:'var(--lw-bg)',fontFamily:"var(--font-plus-jakarta), sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'20%',left:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'var(--lw-card)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--lw-border)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <a href="/dashboard" style={{fontSize:'13px',fontWeight:'600',color:'var(--lw-text-muted)',textDecoration:'none'}}>← Dashboard</a>
        <div style={{fontSize:'16px',fontWeight:'700',color:'var(--lw-text)'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
      </div>

      <div style={{maxWidth:'680px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#8b5cf6,#6366f1)',borderRadius:'20px',padding:'2.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 60px rgba(139,92,246,0.25)',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'rgba(255,255,255,0.15)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:'700',color:'rgba(255,255,255,0.9)',letterSpacing:'1px',marginBottom:'14px'}}>OBJECTION HANDLER</div>
          <h1 style={{fontSize:'2rem',fontWeight:'800',color:'#fff',marginBottom:'10px',letterSpacing:'-0.03em',lineHeight:'1.2'}}>Handle any objection. Win the listing.</h1>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.88)',lineHeight:'1.7',maxWidth:'500px',margin:'0 auto 18px'}}>Turn seller and buyer objections into confident, professional responses — instantly.</p>
          <button onClick={() => document.getElementById('objection-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{background:'rgba(255,255,255,0.2)',border:'1.5px solid rgba(255,255,255,0.5)',color:'#fff',borderRadius:'10px',padding:'11px 28px',fontSize:'14px',fontWeight:'700',cursor:'pointer',backdropFilter:'blur(4px)'}}>
            Handle an Objection →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'10px'}}>
            {[
              {s:'1',icon:'🛡️',title:'Choose or type an objection',desc:'Pick from common objections or write your own in the text area.'},
              {s:'2',icon:'✍️',title:'Add context (optional)',desc:'Tell us about the situation for a more tailored response.'},
              {s:'3',icon:'⚡',title:'Get your response toolkit',desc:'Quick response, full script, email version, and psychology tip.'},
            ].map(({s,icon,title,desc}) => (
              <div key={s} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'14px',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                  <span style={{width:'22px',height:'22px',background:'linear-gradient(135deg,#8b5cf6,#6366f1)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'800',color:'#fff',flexShrink:0}}>{s}</span>
                  <span style={{fontSize:'1rem'}}>{icon}</span>
                </div>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',lineHeight:'1.4'}}>{title}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COMMON OBJECTIONS */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',marginBottom:'12px'}}>COMMON OBJECTIONS — TAP TO USE</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {commonObjections.map(o => (
              <button key={o} onClick={() => setObjection(o)}
                style={{padding:'6px 12px',borderRadius:'20px',border:'1px solid',fontSize:'12px',cursor:'pointer',transition:'all 0.15s',
                  borderColor: objection === o ? '#8b5cf6' : 'var(--lw-border)',
                  background: objection === o ? 'rgba(139,92,246,0.15)' : 'var(--lw-input)',
                  color: objection === o ? '#8b5cf6' : 'var(--lw-text-muted)'}}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* INPUT FORM */}
        <AskAiHint hint="Facing a specific objection? Describe it to AI for a custom response →" />
        <div id="objection-form" style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',marginBottom:'16px'}}>THE OBJECTION</p>

          <div style={{marginBottom:'12px'}}>
            <label style={{fontSize:'11px',fontWeight:'600',color:'var(--lw-text-muted)',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>What did they say?</label>
            <textarea
              placeholder="e.g. Your commission is too high, I can find someone who will do it for 2%..."
              value={objection}
              onChange={e => setObjection(e.target.value)}
              style={{...inputStyle, minHeight:'80px', resize:'vertical' as const}}
            />
          </div>

          <div>
            <label style={{fontSize:'11px',fontWeight:'600',color:'var(--lw-text-muted)',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Context (optional)</label>
            <input
              placeholder="e.g. Luxury listing, seller is motivated, already interviewed 2 agents..."
              value={context}
              onChange={e => setContext(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))',gap:'10px'}}>
            {[
              {icon:'⚡',label:'Quick Response',desc:'Say this right now, in the moment — concise and confident.'},
              {icon:'📝',label:'Full Response',desc:'Detailed answer with context and empathy for deeper objections.'},
              {icon:'📧',label:'Email Version',desc:'Follow up in writing after the conversation.'},
              {icon:'🧠',label:'Psychology Tip',desc:'Why they said it and how to think about the underlying concern.'},
              {icon:'📚',label:'Session History',desc:'Revisit any objection from your current session with one click.'},
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
          style={{width:'100%',padding:'16px',background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg,#8b5cf6,#6366f1)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'16px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 40px rgba(139,92,246,0.35)',transition:'all 0.2s',marginBottom:'1.5rem'}}>
          {loading ? '⏳ Crafting your response...' : '🛡️ Handle This Objection'}
        </button>

        {/* RESULT */}
        {result && (
          <div id="result" style={{...cardStyle, border:'1px solid rgba(139,92,246,0.2)'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#8b5cf6',letterSpacing:'1px',marginBottom:'16px'}}>YOUR RESPONSE TOOLKIT</p>

            {[
              { key: 'quickResponse', label: '⚡ Quick Response', desc: 'Say this right now, in the moment', color: '#8b5cf6' },
              { key: 'fullResponse', label: '📝 Full Response', desc: 'Detailed answer with context and empathy', color: '#6366f1' },
              { key: 'emailResponse', label: '📧 Email Version', desc: 'Follow up in writing after the conversation', color: '#6366f1' },
              { key: 'psychologyTip', label: '🧠 Psychology Tip', desc: 'Why they said it and how to think about it', color: '#d4af37' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{background:'var(--lw-input)',borderRadius:'12px',padding:'1rem',border:'1px solid var(--lw-border)',marginBottom:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <div>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>{card.label}</p>
                    <p style={{fontSize:'11px',color:'var(--lw-text-muted)',margin:'0'}}>{card.desc}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(result[card.key]); setCopied(card.key); setTimeout(() => setCopied(null), 2000) }}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',
                      background: copied === card.key ? card.color : 'var(--lw-card)',
                      color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',
                      borderColor: copied === card.key ? card.color : 'var(--lw-border)'}}>
                    {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.8',color:'var(--lw-text)',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}

            <div style={{marginTop:'1rem',display:'flex',gap:'8px',flexWrap:'wrap'}}>
              <button onClick={() => { setResult(null); setObjection(''); setContext(''); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'var(--lw-input)',color:'var(--lw-text-muted)',border:'1px solid var(--lw-border)',cursor:'pointer'}}>
                🔄 New Objection
              </button>
              <a href="/seller-prep" style={{fontSize:'12px',padding:'8px 14px',borderRadius:'8px',background:'rgba(29,158,117,0.1)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.2)',textDecoration:'none',fontWeight:'500'}}>
                📋 Seller Prep
              </a>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {history.length > 0 && !result && (
          <div style={cardStyle}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',marginBottom:'12px'}}>RECENT OBJECTIONS</p>
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {history.map((h, i) => (
                <div key={i} onClick={() => { setObjection(h.objection); setResult(h.result) }}
                  style={{background:'var(--lw-input)',borderRadius:'10px',border:'1px solid var(--lw-border)',padding:'10px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
                  onMouseOver={e => e.currentTarget.style.borderColor='rgba(139,92,246,0.3)'}
                  onMouseOut={e => e.currentTarget.style.borderColor='var(--lw-border)'}>
                  <p style={{fontSize:'13px',color:'var(--lw-text)',margin:'0'}}>{h.objection}</p>
                  <span style={{fontSize:'11px',color:'#8b5cf6',fontWeight:'500',marginLeft:'12px',whiteSpace:'nowrap'}}>View →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
