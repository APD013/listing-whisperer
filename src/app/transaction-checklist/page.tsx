'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHECKLIST = [
  {
    phase: 'PRE-LISTING',
    color: '#8b5cf6',
    icon: '📋',
    items: [
      'Sign listing agreement',
      'Complete seller disclosure forms',
      'Order pre-listing inspection',
      'Schedule professional photography',
      'Prepare staging recommendations',
      'Research comparable sales (CMA)',
      'Set list price with seller',
      'Confirm HOA documents if applicable',
    ]
  },
  {
    phase: 'ACTIVE LISTING',
    color: '#1D9E75',
    icon: '🏠',
    items: [
      'Enter listing in MLS',
      'Upload photos to MLS',
      'Post on social media',
      'Send email blast to buyer leads',
      'Schedule open house',
      'Place lockbox and yard sign',
      'Confirm showing instructions with seller',
      'Set up showing feedback system',
    ]
  },
  {
    phase: 'UNDER CONTRACT',
    color: '#f59e0b',
    icon: '📝',
    items: [
      'Receive and review all offers',
      'Present offers to seller',
      'Negotiate and execute purchase agreement',
      'Collect earnest money deposit',
      'Open escrow',
      'Send contract to all parties',
      'Confirm inspection deadline',
      'Order title search',
    ]
  },
  {
    phase: 'INSPECTIONS & CONTINGENCIES',
    color: '#ef4444',
    icon: '🔍',
    items: [
      'Schedule buyer inspection',
      'Review inspection report',
      'Negotiate repair requests',
      'Complete agreed repairs',
      'Confirm appraisal ordered',
      'Review appraisal report',
      'Confirm loan approval',
      'Remove contingencies',
    ]
  },
  {
    phase: 'CLOSING PREP',
    color: '#6366f1',
    icon: '🔑',
    items: [
      'Confirm closing date and time',
      'Order final walkthrough',
      'Review closing disclosure',
      'Confirm wire transfer instructions',
      'Confirm utilities transfer',
      'Prepare keys and garage openers',
      'Confirm all repairs completed',
      'Review final HUD/settlement statement',
    ]
  },
  {
    phase: 'CLOSING DAY',
    color: '#d4af37',
    icon: '🎉',
    items: [
      'Complete final walkthrough with buyer',
      'Sign all closing documents',
      'Confirm funding',
      'Hand over keys',
      'Remove lockbox and sign',
      'Update MLS to sold',
      'Send thank you to all parties',
      'Request reviews from client',
    ]
  },
]

export default function TransactionChecklistPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [listingName, setListingName] = useState('')
  const [activePhase, setActivePhase] = useState(0)

  useEffect(() => {
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

  const toggleItem = (phase: string, item: string) => {
    const key = `${phase}:${item}`
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isChecked = (phase: string, item: string) => checked[`${phase}:${item}`] || false

  const phaseProgress = (phase: string, items: string[]) => {
    const done = items.filter(item => isChecked(phase, item)).length
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) }
  }

  const totalProgress = () => {
    const total = CHECKLIST.reduce((acc, p) => acc + p.items.length, 0)
    const done = Object.values(checked).filter(Boolean).length
    return { done, total, pct: Math.round((done / total) * 100) }
  }

  const resetAll = () => {
    if (confirm('Reset all checkboxes?')) setChecked({})
  }

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }
  const total = totalProgress()

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'720px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>✅ Transaction Checklist</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Never miss a deadline. Track every step from pre-listing to closing day.
          </p>
        </div>

        {/* LISTING NAME + PROGRESS */}
        <div style={cardStyle}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'10px'}}>
            <input
              placeholder="Name this transaction (e.g. 123 Main St)"
              value={listingName}
              onChange={e => setListingName(e.target.value)}
              style={{flex:1,padding:'10px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'14px',color:'#f0f0f0',outline:'none',minWidth:'200px'}}
            />
            <button onClick={resetAll}
              style={{padding:'10px 16px',background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',color:'#f87171',fontSize:'12px',cursor:'pointer',fontWeight:'500',whiteSpace:'nowrap'}}>
              🔄 Reset All
            </button>
          </div>

          {/* OVERALL PROGRESS */}
          <div style={{marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:'#6b7280',fontWeight:'600'}}>Overall Progress</span>
            <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'700'}}>{total.done} / {total.total} tasks · {total.pct}%</span>
          </div>
          <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'20px',height:'8px',overflow:'hidden'}}>
            <div style={{height:'100%',background:'linear-gradient(90deg,#1D9E75,#085041)',borderRadius:'20px',width:`${total.pct}%`,transition:'width 0.3s ease'}}/>
          </div>
        </div>

        {/* PHASE TABS */}
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'1rem'}}>
          {CHECKLIST.map((phase, i) => {
            const prog = phaseProgress(phase.phase, phase.items)
            return (
              <button key={i} onClick={() => setActivePhase(i)}
                style={{fontSize:'11px',padding:'6px 12px',borderRadius:'8px',border:'1px solid',cursor:'pointer',transition:'all 0.15s',
                  borderColor: activePhase === i ? phase.color : 'rgba(255,255,255,0.08)',
                  background: activePhase === i ? `${phase.color}20` : 'rgba(0,0,0,0.2)',
                  color: activePhase === i ? phase.color : '#6b7280',
                  fontWeight: activePhase === i ? '600' : '400'}}>
                {phase.icon} {phase.phase}
                {prog.done > 0 && <span style={{marginLeft:'4px',fontSize:'10px',opacity:0.8}}>({prog.done}/{prog.total})</span>}
              </button>
            )
          })}
        </div>

        {/* ACTIVE PHASE */}
        {CHECKLIST[activePhase] && (() => {
          const phase = CHECKLIST[activePhase]
          const prog = phaseProgress(phase.phase, phase.items)
          return (
            <div style={{...cardStyle, border:`1px solid ${phase.color}25`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <div>
                  <p style={{fontSize:'11px',fontWeight:'700',color:phase.color,letterSpacing:'1px',margin:'0 0 4px'}}>{phase.icon} {phase.phase}</p>
                  <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>{prog.done} of {prog.total} complete</p>
                </div>
                <div style={{textAlign:'right'}}>
                  <p style={{fontSize:'22px',fontWeight:'700',color: prog.pct === 100 ? '#1D9E75' : phase.color,margin:'0'}}>{prog.pct}%</p>
                </div>
              </div>

              {/* PHASE PROGRESS BAR */}
              <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'20px',height:'4px',overflow:'hidden',marginBottom:'16px'}}>
                <div style={{height:'100%',background:phase.color,borderRadius:'20px',width:`${prog.pct}%`,transition:'width 0.3s ease'}}/>
              </div>

              {/* CHECKLIST ITEMS */}
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {phase.items.map((item, j) => {
                  const done = isChecked(phase.phase, item)
                  return (
                    <div key={j}
                      onClick={() => toggleItem(phase.phase, item)}
                      style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'10px',cursor:'pointer',transition:'all 0.15s',
                        background: done ? `${phase.color}10` : 'rgba(0,0,0,0.15)',
                        border: done ? `1px solid ${phase.color}30` : '1px solid rgba(255,255,255,0.04)'}}>
                      <div style={{width:'22px',height:'22px',borderRadius:'6px',border:`2px solid`,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s',
                        borderColor: done ? phase.color : 'rgba(255,255,255,0.15)',
                        background: done ? phase.color : 'transparent'}}>
                        {done && <span style={{color:'#fff',fontSize:'13px',fontWeight:'700'}}>✓</span>}
                      </div>
                      <span style={{fontSize:'13px',color: done ? '#6b7280' : '#e0e0e0',textDecoration: done ? 'line-through' : 'none',transition:'all 0.15s'}}>
                        {item}
                      </span>
                    </div>
                  )
                })}
              </div>

              {prog.pct === 100 && (
                <div style={{marginTop:'16px',padding:'12px 16px',background:'rgba(29,158,117,0.1)',borderRadius:'10px',border:'1px solid rgba(29,158,117,0.2)',textAlign:'center'}}>
                  <p style={{fontSize:'13px',color:'#1D9E75',fontWeight:'600',margin:'0'}}>✅ {phase.phase} complete!</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* NAVIGATION */}
        <div style={{display:'flex',gap:'8px',justifyContent:'space-between',marginBottom:'1rem'}}>
          <button onClick={() => setActivePhase(prev => Math.max(0, prev - 1))} disabled={activePhase === 0}
            style={{flex:1,padding:'10px',background:'rgba(0,0,0,0.2)',color: activePhase === 0 ? '#333' : '#6b7280',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',fontSize:'13px',cursor: activePhase === 0 ? 'not-allowed' : 'pointer'}}>
            ← Previous Phase
          </button>
          <button onClick={() => setActivePhase(prev => Math.min(CHECKLIST.length - 1, prev + 1))} disabled={activePhase === CHECKLIST.length - 1}
            style={{flex:1,padding:'10px',background: activePhase === CHECKLIST.length - 1 ? 'rgba(0,0,0,0.2)' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor: activePhase === CHECKLIST.length - 1 ? 'not-allowed' : 'pointer'}}>
            Next Phase →
          </button>
        </div>

        <div style={{textAlign:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}