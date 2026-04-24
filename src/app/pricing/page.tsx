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
      if (data.url) window.location.href = data.url
    } catch (err) { console.error(err) }
    setLoading(null)
  }

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'20px', border:'1px solid rgba(255,255,255,0.07)', padding:'2rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      {/* BACKGROUND GLOW */}
      <div style={{position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',width:'800px',height:'600px',background:'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 2rem',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(13,17,23,0.8)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:100}}>
        <a href="/" style={{fontSize:'18px',fontWeight:'700',textDecoration:'none',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
        </a>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Dashboard</a>
          <a href="/login" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Sign In</a>
        </div>
      </nav>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'4rem 2rem',textAlign:'center'}}>

        {/* HEADER */}
        <div style={{display:'inline-block',background:'rgba(29,158,117,0.1)',color:'#1D9E75',fontSize:'12px',fontWeight:'600',padding:'4px 14px',borderRadius:'20px',marginBottom:'1.5rem',border:'1px solid rgba(29,158,117,0.2)',letterSpacing:'0.5px'}}>
          SIMPLE PRICING
        </div>
        <h1 style={{fontSize:'clamp(1.75rem,4vw,2.5rem)',fontWeight:'700',color:'#f0f0f0',marginBottom:'0.75rem',lineHeight:'1.2'}}>
          Choose your plan
        </h1>
        <p style={{color:'#6b7280',marginBottom:'0.5rem',fontSize:'15px'}}>Only have one listing this month? Pay $9. Use it often? Go Pro.</p>
        <p style={{color:'#444',fontSize:'13px',marginBottom:'3rem'}}>No credit card required to start free.</p>

        {/* PRICING CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'1.5rem',marginBottom:'3rem',textAlign:'left'}}>

          {/* FREE */}
          <div style={cardStyle}>
            <h3 style={{fontSize:'18px',fontWeight:'600',marginBottom:'4px',color:'#f0f0f0'}}>Free</h3>
            <p style={{color:'#6b7280',fontSize:'13px',marginBottom:'1.5rem'}}>Try it out</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'1.5rem',color:'#f0f0f0'}}>$0</p>
            <ul style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 2 free listings</li>
              <li>✅ 3 free rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ No credit card required</li>
            </ul>
            <a href="/signup" style={{display:'block',textAlign:'center',padding:'11px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',color:'#8b8fa8',textDecoration:'none',fontSize:'14px',fontWeight:'500',background:'rgba(0,0,0,0.2)'}}>
              Get started free
            </a>
          </div>

          {/* PAY PER LISTING */}
          <div style={{...cardStyle, border:'2px solid #1D9E75', position:'relative', boxShadow:'0 0 40px rgba(29,158,117,0.15)'}}>
            <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 14px',borderRadius:'20px',whiteSpace:'nowrap',boxShadow:'0 0 16px rgba(29,158,117,0.4)'}}>
              MOST POPULAR
            </div>
            <h3 style={{fontSize:'18px',fontWeight:'600',marginBottom:'4px',color:'#f0f0f0'}}>Pay Per Listing</h3>
            <p style={{color:'#6b7280',fontSize:'13px',marginBottom:'1.5rem'}}>No subscription. No commitment.</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px',color:'#f0f0f0'}}>$9<span style={{fontSize:'16px',fontWeight:'400',color:'#6b7280'}}>/listing</span></p>
            <p style={{fontSize:'12px',color:'#444',marginBottom:'1.5rem'}}>Pay only when you need it</p>
            <ul style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 1 full listing generation</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ Seller Meeting Prep</li>
              <li>✅ Snap & Start on-site</li>
              <li>✅ Saved to your history</li>
              <li>✅ Never expires</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1TOtXyKzAxeqVLKnit1Jjti5', 'payment', 'pay_per_listing')}
              disabled={loading === 'pay_per_listing'}
              style={{width:'100%',padding:'12px',borderRadius:'10px',background: loading === 'pay_per_listing' ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
              {loading === 'pay_per_listing' ? 'Loading...' : 'Buy 1 Listing — $9'}
            </button>
          </div>

          {/* PRO */}
          <div style={{...cardStyle, background:'linear-gradient(135deg, #0d2818 0%, #0a1f12 100%)', border:'1px solid rgba(29,158,117,0.2)'}}>
            <h3 style={{fontSize:'18px',fontWeight:'600',marginBottom:'4px',color:'#f0f0f0'}}>Pro</h3>
            <p style={{color:'#1D9E75',fontSize:'13px',marginBottom:'1.5rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px',color:'#f0f0f0'}}>$29<span style={{fontSize:'16px',fontWeight:'400',color:'#6b7280'}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#1D9E75',marginBottom:'1.5rem'}}>Best value for 4+ listings/month</p>
            <ul style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ Seller Meeting Prep</li>
              <li>✅ Snap & Start on-site</li>
              <li>✅ 7-Day Launch Kit</li>
              <li>✅ Brand voice memory</li>
              <li>✅ Priority support</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1TO92kKzAxeqVLKn5eQREGy5', 'subscription', 'pro')}
              disabled={loading === 'pro'}
              style={{width:'100%',padding:'12px',borderRadius:'10px',background: loading === 'pro' ? 'rgba(29,158,117,0.3)' : 'rgba(29,158,117,0.15)',color:'#1D9E75',border:'1px solid rgba(29,158,117,0.3)',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
              {loading === 'pro' ? 'Loading...' : 'Start Pro — $29/mo'}
            </button>
          </div>
        </div>

        {/* ROI LINE */}
        <div style={{background:'rgba(29,158,117,0.08)',borderRadius:'12px',padding:'1.25rem',border:'1px solid rgba(29,158,117,0.15)',marginBottom:'3rem'}}>
          <p style={{fontSize:'14px',color:'#1D9E75',margin:'0'}}>
            💡 <strong>Quick math:</strong> One listing takes 20–30 minutes to write manually. At $9, that's less than $0.50/minute saved. Most agents save 2–3 hours per listing.
          </p>
        </div>

        {/* FAQ */}
        <div style={{textAlign:'left',maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'1.25rem',fontWeight:'600',marginBottom:'1.5rem',textAlign:'center',color:'#f0f0f0'}}>Pricing FAQ</h2>
          {[
            {q:'What happens after I buy a listing credit?',a:'One credit is added to your account immediately. Use it anytime — it never expires.'},
            {q:'Can I use the discount code WELCOME50?',a:'Yes! Enter code WELCOME50 at checkout for 50% off your first Pro month. First 50 agents only.'},
            {q:'What\'s included in each listing generation?',a:'Every listing generates all 11 formats: MLS standard, Luxury MLS, Instagram, Facebook, Email, Open House, Video Script, SEO, Text/SMS, Flyer, and Price Drop copy.'},
            {q:'Can I cancel Pro anytime?',a:'Yes. No contracts. Cancel anytime from your account settings.'},
            {q:'What if I need more than 1 listing but don\'t want a subscription?',a:'Buy multiple listing credits — each one is $9 and never expires. Great for agents with 2-3 listings a month.'},
          ].map(({q,a}) => (
            <div key={q} style={{borderBottom:'1px solid rgba(255,255,255,0.06)',paddingBottom:'1.25rem',marginBottom:'1.25rem'}}>
              <p style={{fontWeight:'600',fontSize:'14px',marginBottom:'6px',color:'#f0f0f0'}}>{q}</p>
              <p style={{fontSize:'13px',color:'#6b7280',lineHeight:'1.8',margin:'0'}}>{a}</p>
            </div>
          ))}
        </div>

        {/* DISCOUNT CODE */}
        <div style={{marginTop:'2rem',padding:'1.5rem',background:'rgba(29,158,117,0.08)',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)'}}>
          <p style={{fontSize:'14px',color:'#f0f0f0',margin:'0 0 4px',fontWeight:'600'}}>🎁 Early Agent Discount</p>
          <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>Use code <strong style={{color:'#1D9E75'}}>WELCOME50</strong> at checkout for 50% off your first Pro month. First 50 agents only!</p>
        </div>
      </div>
    </main>
  )
}