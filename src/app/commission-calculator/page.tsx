'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackEvent } from '../lib/analytics'

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
    trackEvent('tool_page_view', { tool: 'commission_calculator' })
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

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '17px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '8px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle' }}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)', borderRadius: '20px', padding: '1.75rem 2rem', marginBottom: '1.75rem', boxShadow: '0 8px 32px rgba(29,158,117,0.25)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧮</div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>Commission Calculator</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.6' }}>
            Calculate your real take-home after splits, referrals, fees, and deductions.
          </p>
        </div>

        {/* SALE DETAILS CARD */}
        <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', marginBottom: '16px', margin: '0 0 16px 0' }}>SALE DETAILS</p>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Sale Price</label>
            <input
              placeholder="$850,000"
              value={form.salePrice}
              onChange={e => setForm({ ...form, salePrice: e.target.value })}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Total Commission %</label>
              <input
                placeholder="6"
                value={form.commissionRate}
                onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>Your Agent Split %</label>
              <input
                placeholder="50"
                value={form.brokerSplit}
                onChange={e => setForm({ ...form, brokerSplit: e.target.value })}
                style={{ width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
              />
            </div>
          </div>
        </div>

        {/* DEDUCTIONS CARD */}
        <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 4px 0' }}>DEDUCTIONS</p>
          <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0 0 16px 0' }}>Leave blank if not applicable</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Referral Fee %', key: 'referralFee', placeholder: '0' },
              { label: 'Franchise Fee %', key: 'franchiseFee', placeholder: '0' },
              { label: 'Transaction Fee $', key: 'transactionFee', placeholder: '0' },
              { label: 'Other Deductions $', key: 'otherDeductions', placeholder: '0' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>{label}</label>
                <input
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', color: 'var(--lw-text)', boxSizing: 'border-box', outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RESULTS */}
        {salePrice > 0 && (
          <div style={{ background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid rgba(29,158,117,0.25)', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 4px 20px rgba(29,158,117,0.08)' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 16px 0' }}>YOUR COMMISSION BREAKDOWN</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Sale Price', value: fmt(salePrice), color: 'var(--lw-text)' },
                { label: `Total Commission (${fmtPct(commissionRate)})`, value: fmt(totalCommission), color: 'var(--lw-text)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--lw-text-muted)' }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: '600' }}>{row.value}</span>
                </div>
              ))}

              <div style={{ height: '1px', background: 'var(--lw-border)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--lw-text-muted)' }}>Your Side (50% of total)</span>
                <span style={{ color: 'var(--lw-text)', fontWeight: '600' }}>{fmt(agentSideCommission)}</span>
              </div>

              {referralFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--lw-text-muted)' }}>Referral Fee ({fmtPct(referralFee)})</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>− {fmt(referralDeduction)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--lw-text-muted)' }}>Broker Split ({fmtPct(100 - brokerSplit)} to broker)</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>− {fmt(brokerDeduction)}</span>
              </div>
              {franchiseFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--lw-text-muted)' }}>Franchise Fee ({fmtPct(franchiseFee)})</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>− {fmt(franchiseDeduction)}</span>
                </div>
              )}
              {transactionFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--lw-text-muted)' }}>Transaction Fee</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>− {fmt(transactionFee)}</span>
                </div>
              )}
              {otherDeductions > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--lw-text-muted)' }}>Other Deductions</span>
                  <span style={{ color: '#ef4444', fontWeight: '600' }}>− {fmt(otherDeductions)}</span>
                </div>
              )}

              <div style={{ height: '1px', background: 'var(--lw-border)', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--lw-text)' }}>Your Take-Home</span>
                <span style={{ fontSize: '26px', fontWeight: '800', color: agentNet >= 0 ? '#1D9E75' : '#ef4444', letterSpacing: '-0.03em' }}>{fmt(agentNet)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--lw-text-muted)' }}>
                <span>Effective rate on sale price</span>
                <span style={{ fontWeight: '600' }}>{salePrice > 0 ? fmtPct((agentNet / salePrice) * 100) : '0%'}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(29,158,117,0.06)', border: '1px solid rgba(29,158,117,0.15)', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: 0, lineHeight: '1.6' }}>
                💡 <strong style={{ color: 'var(--lw-text)' }}>Note:</strong> This is an estimate only. Actual commission may vary based on your broker agreement and local regulations.
              </p>
            </div>
          </div>
        )}

        {/* PRINT */}
        {salePrice > 0 && (
          <button
            onClick={() => window.print()}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(29,158,117,0.3)', marginBottom: '1rem', fontFamily: 'var(--font-plus-jakarta), sans-serif', letterSpacing: '0.01em' }}>
            🖨️ Print / Save as PDF
          </button>
        )}

        <div style={{ textAlign: 'center', paddingBottom: '2rem' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}