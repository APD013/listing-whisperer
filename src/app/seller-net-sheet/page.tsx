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

  return (
    <main style={{minHeight:'100vh',background:'var(--lw-bg)',fontFamily:"'Inter', sans-serif"}}>
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

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'var(--lw-card)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--lw-border)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'var(--lw-text)'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>💰 Seller Net Sheet</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Estimate your seller's take-home proceeds before closing. Fast, clear, and easy to share.
          </p>
        </div>

        {/* INPUTS */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>PROPERTY DETAILS</p>

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
              <label style={labelStyle}>Title Fees <span style={{color:'#444',fontWeight:'400',textTransform:'none'}}>(leave blank to estimate)</span></label>
              <input placeholder="Auto" value={form.titleFees} onChange={e=>setForm({...form,titleFees:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Escrow Fees <span style={{color:'#444',fontWeight:'400',textTransform:'none'}}>(leave blank to estimate)</span></label>
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
              <div style={{height:'1px',background:'rgba(255,255,255,0.05)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Mortgage Payoff</span>
                <span style={{color:'#f87171'}}>− {fmt(mortgageBalance)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Commission ({form.commission}%)</span>
                <span style={{color:'#f87171'}}>− {fmt(commissionAmt)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Title Fees</span>
                <span style={{color:'#f87171'}}>− {fmt(titleFees)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Escrow Fees</span>
                <span style={{color:'#f87171'}}>− {fmt(escrowFees)}</span>
              </div>
              {repairCredits > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Repair Credits</span>
                  <span style={{color:'#f87171'}}>− {fmt(repairCredits)}</span>
                </div>
              )}
              {otherCosts > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Other Costs</span>
                  <span style={{color:'#f87171'}}>− {fmt(otherCosts)}</span>
                </div>
              )}
              <div style={{height:'1px',background:'rgba(255,255,255,0.05)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'14px',fontWeight:'700',color:'var(--lw-text)'}}>Estimated Net Proceeds</span>
                <span style={{fontSize:'22px',fontWeight:'700',color: netProceeds >= 0 ? '#1D9E75' : '#f87171'}}>{fmt(netProceeds)}</span>
              </div>
            </div>

            <div style={{background:'rgba(29,158,117,0.06)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'10px',padding:'12px 14px'}}>
              <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>
                💡 <strong style={{color:'#a0a0a0'}}>Disclaimer:</strong> This is an estimate only. Actual proceeds may vary based on prorations, liens, HOA fees, and other closing items.
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
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}