'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { trackUpgradeClick, trackCheckoutStarted, trackEvent } from '../lib/analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    trackEvent('pricing_page_view')
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const handleCheckout = async (priceId: string, mode: string, label: string) => {
    trackCheckoutStarted(mode)
    trackUpgradeClick(label, mode)
    setLoading(label)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, mode, userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(null)
  }

  return (
    <main style={{minHeight:'100vh',fontFamily:'sans-serif',background:'#f8fafc'}}>
      {/* NAV */}
      <nav style={{background:'#fff',borderBottom:'1px solid #eee',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <a href="/" style={{fontSize:'18px',fontWeight:'600',textDecoration:'none',color:'#111'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></a>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Dashboard</a>
          <a href="/login" style={{fontSize:'13px',color:'#666',textDecoration:'none'}}>Sign In</a>
        </div>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'3rem 2rem',textAlign:'center'}}>
        <h1 style={{fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem'}}>Simple, flexible pricing</h1>
        <p style={{color:'#666',marginBottom:'0.5rem'}}>Only have one listing this month? Pay $9. Use it often? Go Pro.</p>
        <p style={{color:'#999',fontSize:'13px',marginBottom:'3rem'}}>No credit card required to start free.</p>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem',marginBottom:'3rem'}}>

          {/* FREE */}
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'1px solid #eee',textAlign:'left',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Free</h3>
            <p style={{color:'#666',fontSize:'13px',marginBottom:'1rem'}}>Try it out</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'1.5rem'}}>$0</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 2 free listings</li>
              <li>✅ 3 free rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ No credit card required</li>
            </ul>
            <a href="/signup" style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',border:'1px solid #ddd',color:'#333',textDecoration:'none',fontSize:'14px'}}>
              Get started free
            </a>
          </div>

          {/* PAY PER LISTING */}
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'2px solid #1D9E75',textAlign:'left',boxShadow:'0 4px 12px rgba(29,158,117,0.15)',position:'relative'}}>
            <div style={{position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',background:'#1D9E75',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 12px',borderRadius:'20px',whiteSpace:'nowrap'}}>
              MOST POPULAR
            </div>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Pay Per Listing</h3>
            <p style={{color:'#666',fontSize:'13px',marginBottom:'1rem'}}>Perfect for occasional agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px'}}>$9<span style={{fontSize:'16px',fontWeight:'400'}}>/listing</span></p>
            <p style={{fontSize:'12px',color:'#999',marginBottom:'1.5rem'}}>No subscription — pay only when you need it</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 1 full listing generation</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ MLS, Instagram, Email & more</li>
              <li>✅ Saved to your history</li>
              <li>✅ No subscription needed</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1TOtXyKzAxeqVLKnit1Jjti5', 'payment', 'pay_per_listing')}
              disabled={loading === 'pay_per_listing'}
              style={{width:'100%',padding:'12px',borderRadius:'8px',background:'#1D9E75',color:'#fff',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
              {loading === 'pay_per_listing' ? 'Loading...' : 'Buy 1 Listing — $9'}
            </button>
          </div>

          {/* PRO */}
          <div style={{background:'#1D9E75',borderRadius:'16px',padding:'2rem',textAlign:'left',color:'#fff',boxShadow:'0 4px 12px rgba(29,158,117,0.3)'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Pro</h3>
            <p style={{color:'#a8f0d4',fontSize:'13px',marginBottom:'1rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px'}}>$29<span style={{fontSize:'16px',fontWeight:'400'}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#a8f0d4',marginBottom:'1.5rem'}}>Best value if you have 4+ listings/month</p>
            <ul style={{fontSize:'14px',color:'#e0f7ee',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ 7-Day Launch Kit</li>
              <li>✅ Brand voice memory</li>
              <li>✅ Saved listing history</li>
              <li>✅ Priority support</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1TO92kKzAxeqVLKn5eQREGy5', 'subscription', 'pro')}
              disabled={loading === 'pro'}
              style={{width:'100%',padding:'12px',borderRadius:'8px',background:'#fff',color:'#1D9E75',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
              {loading === 'pro' ? 'Loading...' : 'Start Pro — $29/mo'}
            </button>
          </div>
        </div>

        {/* ROI LINE */}
        <div style={{background:'#f0fdf8',borderRadius:'12px',padding:'1.25rem',border:'1px solid #bbf0d9',marginBottom:'2rem'}}>
          <p style={{fontSize:'14px',color:'#085041',margin:'0'}}>
            💡 <strong>Quick math:</strong> One listing takes 20–30 minutes to write manually. At $9, that's less than $0.50/minute saved. Most agents save 2–3 hours per listing.
          </p>
        </div>

        {/* FAQ */}
        <div style={{textAlign:'left',maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'1.25rem',fontWeight:'600',marginBottom:'1.5rem',textAlign:'center'}}>Pricing FAQ</h2>
          {[
            {q:'What happens after I buy a listing credit?',a:'One credit is added to your account immediately. Use it anytime — it never expires.'},
            {q:'Can I use the discount code WELCOME50?',a:'Yes! Enter code WELCOME50 at checkout for 50% off your first Pro month. First 50 agents only.'},
            {q:'What\'s included in each listing generation?',a:'Every listing generates all 11 formats: MLS standard, Luxury MLS, Instagram, Facebook, Email, Open House, Video Script, SEO, Text/SMS, Flyer, and Price Drop copy.'},
            {q:'Can I cancel Pro anytime?',a:'Yes. No contracts. Cancel anytime from your account settings.'},
            {q:'What if I need more than 1 listing but don\'t want a subscription?',a:'Buy multiple listing credits — each one is $9 and never expires. Great for agents with 2-3 listings a month.'},
          ].map(({q,a}) => (
            <div key={q} style={{borderBottom:'1px solid #eee',paddingBottom:'1.25rem',marginBottom:'1.25rem'}}>
              <p style={{fontWeight:'600',fontSize:'14px',marginBottom:'6px'}}>{q}</p>
              <p style={{fontSize:'13px',color:'#666',lineHeight:'1.8',margin:'0'}}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}