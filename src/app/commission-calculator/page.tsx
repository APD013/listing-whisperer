'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CommissionCalculatorPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)

  const [form, setForm] = useState({
    salePrice: '',
    commissionRate: '6',
    brokerSplit: '50',
    referralFee: '',
    franchiseFee: '',
    transactionFee: '',
    otherDeductions: '',
  })

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

  const parse = (val: string) => parseFloat(val.replace(/,/g, '')) || 0

  const salePrice = parse(form.salePrice)
  const commissionRate = parse(form.commissionRate)
  const brokerSplit = parse(form.brokerSplit)
  const referralFee = parse(form.referralFee)
  const franchiseFee = parse(form.franchiseFee)
  const transactionFee = parse(form.transactionFee)
  const otherDeductions = parse(form.otherDeductions)

  const totalCommission = salePrice * (commissionRate / 100)
  const agentSideCommission = totalCommission / 2
  const referralDeduction = agentSideCommission * (referralFee / 100)
  const afterReferral = agentSideCommission - referralDeduction
  const brokerDeduction = afterReferral * ((100 - brokerSplit) / 100)
  const agentGross = afterReferral - brokerDeduction
  const franchiseDeduction = salePrice * (franchiseFee / 100)
  const agentNet = agentGross - franchiseDeduction - transactionFee - otherDeductions

  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const fmtPct = (n: number) => n.toFixed(2) + '%'

  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }
  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }

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

      <div style={{maxWidth:'640px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>🧮 Commission Calculator</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Calculate your real take-home commission after splits, referrals, fees, and deductions.
          </p>
        </div>

        {/* INPUTS */}
        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>SALE DETAILS</p>

          <div style={{marginBottom:'12px'}}>
            <label style={labelStyle}>Sale Price</label>
            <input placeholder="$850,000" value={form.salePrice} onChange={e=>setForm({...form,salePrice:e.target.value})} style={inputStyle}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Total Commission %</label>
              <input placeholder="6" value={form.commissionRate} onChange={e=>setForm({...form,commissionRate:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Your Agent Split %</label>
              <input placeholder="50" value={form.brokerSplit} onChange={e=>setForm({...form,brokerSplit:e.target.value})} style={inputStyle}/>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>DEDUCTIONS <span style={{color:'#444',fontWeight:'400',textTransform:'none',letterSpacing:'0'}}>— leave blank if not applicable</span></p>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <label style={labelStyle}>Referral Fee %</label>
              <input placeholder="0" value={form.referralFee} onChange={e=>setForm({...form,referralFee:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Franchise Fee %</label>
              <input placeholder="0" value={form.franchiseFee} onChange={e=>setForm({...form,franchiseFee:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Transaction Fee $</label>
              <input placeholder="0" value={form.transactionFee} onChange={e=>setForm({...form,transactionFee:e.target.value})} style={inputStyle}/>
            </div>
            <div>
              <label style={labelStyle}>Other Deductions $</label>
              <input placeholder="0" value={form.otherDeductions} onChange={e=>setForm({...form,otherDeductions:e.target.value})} style={inputStyle}/>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        {salePrice > 0 && (
          <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.2)'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'16px'}}>YOUR COMMISSION BREAKDOWN</p>

            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Sale Price</span>
                <span style={{color:'#f0f0f0',fontWeight:'600'}}>{fmt(salePrice)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Total Commission ({fmtPct(commissionRate)})</span>
                <span style={{color:'#f0f0f0',fontWeight:'600'}}>{fmt(totalCommission)}</span>
              </div>
              <div style={{height:'1px',background:'rgba(255,255,255,0.05)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Your Side (50% of total)</span>
                <span style={{color:'#f0f0f0',fontWeight:'600'}}>{fmt(agentSideCommission)}</span>
              </div>
              {referralFee > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Referral Fee ({fmtPct(referralFee)})</span>
                  <span style={{color:'#f87171'}}>− {fmt(referralDeduction)}</span>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                <span>Broker Split ({fmtPct(100 - brokerSplit)} to broker)</span>
                <span style={{color:'#f87171'}}>− {fmt(brokerDeduction)}</span>
              </div>
              {franchiseFee > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Franchise Fee ({fmtPct(franchiseFee)})</span>
                  <span style={{color:'#f87171'}}>− {fmt(franchiseDeduction)}</span>
                </div>
              )}
              {transactionFee > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Transaction Fee</span>
                  <span style={{color:'#f87171'}}>− {fmt(transactionFee)}</span>
                </div>
              )}
              {otherDeductions > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',color:'#a0a0a0'}}>
                  <span>Other Deductions</span>
                  <span style={{color:'#f87171'}}>− {fmt(otherDeductions)}</span>
                </div>
              )}
              <div style={{height:'1px',background:'rgba(255,255,255,0.05)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0'}}>Your Take-Home</span>
                <span style={{fontSize:'22px',fontWeight:'700',color: agentNet >= 0 ? '#1D9E75' : '#f87171'}}>{fmt(agentNet)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',color:'#444'}}>
                <span>Effective rate on sale price</span>
                <span>{salePrice > 0 ? fmtPct((agentNet / salePrice) * 100) : '0%'}</span>
              </div>
            </div>

            <div style={{background:'rgba(29,158,117,0.06)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'10px',padding:'12px 14px'}}>
              <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>
                💡 <strong style={{color:'#a0a0a0'}}>Note:</strong> This is an estimate only. Actual commission may vary based on your specific broker agreement and local regulations.
              </p>
            </div>
          </div>
        )}

        {/* PRINT */}
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