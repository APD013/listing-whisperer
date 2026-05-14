'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SellerNetSheetPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)

  const [form, setForm] = useState({
    salePrice: '',
    mortgageBalance: '',
    commission: '6',
    titleFees: '',
    escrowFees: '',
    repairCredits: '',
    otherCosts: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'seller_net_sheet' })
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

  const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0

  const salePrice = parse(form.salePrice)
  const mortgageBalance = parse(form.mortgageBalance)
  const commissionAmt = salePrice * (parse(form.commission) / 100)
  const titleFees = parse(form.titleFees) || salePrice * 0.001
  const escrowFees = parse(form.escrowFees) || salePrice * 0.001
  const repairCredits = parse(form.repairCredits)
  const otherCosts = parse(form.otherCosts)
  const totalDeductions = mortgageBalance + commissionAmt + titleFees + escrowFees + repairCredits + otherCosts
  const netProceeds = salePrice - totalDeductions

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  const inputStyle = { width:'100%', padding:'11px 14px', background:'var(--lw-input)', border:'1px solid var(--lw-border)', borderRadius:'8px', fontSize:'13px', color:'var(--lw-text)', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'var(--lw-text-muted)', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'var(--lw-card)', borderRadius:'16px', border:'1px solid var(--lw-border)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.08)', marginBottom:'1rem' }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{minHeight:'100vh',background:'var(--lw-bg)',fontFamily:"var(--font-plus-jakarta), sans-serif"}}>
      <style>{`
        @media print {
          body { background: white !important; }
          nav, .no-print { display: none !important; }
          main { background: white !important; }
          * { color: black !important; border-color: #ddd !important; background: white !important; box-shadow: none !important; }
          .print-green { color: #1D9E75 !important; }
          .print-red { color: #dc2626 !important; }
        }
      `}</style>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'20%',left:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(8,80,65,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

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

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'20px',padding:'2.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 60px rgba(29,158,117,0.25)',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'rgba(255,255,255,0.15)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:'700',color:'rgba(255,255,255,0.9)',letterSpacing:'1px',marginBottom:'14px'}}>NET SHEET CALCULATOR</div>
          <h1 style={{fontSize:'2rem',fontWeight:'800',color:'#fff',marginBottom:'10px',letterSpacing:'-0.03em',lineHeight:'1.2'}}>Show your seller the real numbers.</h1>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.88)',lineHeight:'1.7',maxWidth:'500px',margin:'0 auto 18px'}}>A live, accurate net proceeds estimate — built in minutes, printable in one click.</p>
          <button onClick={() => document.getElementById('net-sheet-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{background:'rgba(255,255,255,0.2)',border:'1.5px solid rgba(255,255,255,0.5)',color:'#fff',borderRadius:'10px',padding:'11px 28px',fontSize:'14px',fontWeight:'700',cursor:'pointer',backdropFilter:'blur(4px)'}}>
            Calculate Now →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'10px'}}>
            {[
              {s:'1',icon:'💰',title:'Enter the sale price',desc:'Start with the expected sale price and mortgage balance.'},
              {s:'2',icon:'📊',title:'Add costs and fees',desc:'Commission, title, escrow, and any buyer credits.'},
              {s:'3',icon:'🖨️',title:'Print or share',desc:'Clean, professional sheet to share with your seller.'},
            ].map(({s,icon,title,desc}) => (
              <div key={s} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'14px',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                  <span style={{width:'22px',height:'22px',background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'800',color:'#fff',flexShrink:0}}>{s}</span>
                  <span style={{fontSize:'1rem'}}>{icon}</span>
                </div>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',lineHeight:'1.4'}}>{title}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))',gap:'10px'}}>
            {[
              {icon:'💰',label:'Net Proceeds Estimate',desc:'Live calculation of what your seller takes home after closing.'},
              {icon:'📊',label:'Full Cost Breakdown',desc:'Commission, mortgage, title, and escrow — all itemized.'},
              {icon:'🏦',label:'Mortgage Payoff',desc:'Exact amount owed, subtracted from proceeds automatically.'},
              {icon:'⚖️',label:'Repair & Credit Deductions',desc:'Easily factor in any buyer credits or repair costs.'},
              {icon:'🖨️',label:'Printable PDF',desc:'Clean, professional sheet ready to share or print.'},
            ].map(({icon,label,desc}) => (
              <div key={label} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'5px'}}>
                <span style={{fontSize:'1.2rem'}}>{icon}</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)'}}>{label}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INPUTS */}
        <div id="net-sheet-form" style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',marginBottom:'16px'}}>PROPERTY DETAILS</p>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Sale Price</label>
            <input placeholder="$850,000" value={form.salePrice} onChange={e=>setForm({...form,salePrice:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Mortgage Balance (if any)</label>
            <input placeholder="$0" value={form.mortgageBalance} onChange={e=>setForm({...form,mortgageBalance:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Commission % (both sides)</label>
            <input placeholder="6" value={form.commission} onChange={e=>setForm({...form,commission:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Title Fees <span style={{color:'var(--lw-text-muted)',fontWeight:'400',textTransform:'none'}}>(leave blank to estimate)</span></label>
              <input placeholder="Auto" value={form.titleFees} onChange={e=>setForm({...form,titleFees:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Escrow Fees <span style={{color:'var(--lw-text-muted)',fontWeight:'400',textTransform:'none'}}>(leave blank to estimate)</span></label>
              <input placeholder="Auto" value={form.escrowFees} onChange={e=>setForm({...form,escrowFees:e.target.value})} style={inputStyle}/>
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            <div>
              <label style={labelStyle}>Repair Credits</label>
              <input placeholder="$0" value={form.repairCredits} onChange={e=>setForm({...form,repairCredits:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Other Costs</label>
              <input placeholder="$0" value={form.otherCosts} onChange={e=>setForm({...form,otherCosts:e.target.value})} style={inputStyle}/>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {salePrice > 0 && (
          <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.2)'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>ESTIMATED NET PROCEEDS</p>

            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                <span>Sale Price</span>
                <span style={{color:'var(--lw-text)',fontWeight:'600'}}>{fmt(salePrice)}</span>
              </div>
              <div style={{height:'1px',background:'var(--lw-border)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                <span>Mortgage Payoff</span>
                <span style={{color:'#f87171'}}>− {fmt(mortgageBalance)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                <span>Commission ({form.commission}%)</span>
                <span style={{color:'#f87171'}}>− {fmt(commissionAmt)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                <span>Title Fees</span>
                <span style={{color:'#f87171'}}>− {fmt(titleFees)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                <span>Escrow Fees</span>
                <span style={{color:'#f87171'}}>− {fmt(escrowFees)}</span>
              </div>
              {repairCredits > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                  <span>Repair Credits</span>
                  <span style={{color:'#f87171'}}>− {fmt(repairCredits)}</span>
                </div>
              )}
              {otherCosts > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'var(--lw-text-muted)'}}>
                  <span>Other Costs</span>
                  <span style={{color:'#f87171'}}>− {fmt(otherCosts)}</span>
                </div>
              )}
              <div style={{height:'1px',background:'var(--lw-border)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'14px',fontWeight:'700',color:'var(--lw-text)'}}>Estimated Net Proceeds</span>
                <span style={{fontSize:'22px',fontWeight:'700',color: netProceeds >= 0 ? '#1D9E75' : '#f87171'}}>{fmt(netProceeds)}</span>
              </div>
            </div>

            <div style={{background:'rgba(29,158,117,0.06)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'10px',padding:'12px 14px'}}>
              <p style={{fontSize:'12px',color:'var(--lw-text-muted)',margin:'0'}}>
                💡 <strong style={{color:'var(--lw-text-muted)'}}>Disclaimer:</strong> This is an estimate only. Actual proceeds may vary based on prorations, liens, HOA fees, and other closing items.
              </p>
            </div>
          </div>
        )}

        {/* PRINT BUTTON */}
        {salePrice > 0 && (
          <button onClick={() => window.print()}
            style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:'pointer',boxShadow:'0 0 24px rgba(29,158,117,0.3)',marginBottom:'1rem'}}>
            🖨️ Print / Save as PDF
          </button>
        )}

        <div style={{textAlign:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'var(--lw-text-muted)',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}
