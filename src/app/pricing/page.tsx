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

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"var(--font-plus-jakarta), sans-serif"}}>

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

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'4rem 2rem',textAlign:'center'}}>

        {/* HEADER */}
        <div style={{display:'inline-block',background:'rgba(29,158,117,0.1)',color:'#1D9E75',fontSize:'12px',fontWeight:'600',padding:'4px 14px',borderRadius:'20px',marginBottom:'1.5rem',border:'1px solid rgba(29,158,117,0.2)',letterSpacing:'0.5px'}}>
          SIMPLE PRICING
        </div>
        <h1 style={{fontSize:'clamp(1.75rem,4vw,2.5rem)',fontWeight:'700',color:'#f0f0f0',marginBottom:'0.75rem',lineHeight:'1.2'}}>
          Choose your plan
        </h1>
        <p style={{color:'#6b7280',marginBottom:'0.5rem',fontSize:'15px'}}>Try free for 24 hours — then go Pro for $20/month.</p>
        <p style={{color:'#444',fontSize:'13px',marginBottom:'3rem'}}>No credit card required to start free.</p>

        {/* PRICING CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'1.5rem',marginBottom:'3rem',textAlign:'left'}}>

          {/* FREE TRIAL */}
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
            <h3 style={{fontSize:'18px',fontWeight:'700',marginBottom:'4px',color:'#f0f0f0'}}>Free Trial</h3>
            <p style={{color:'#6b7280',fontSize:'13px',marginBottom:'1.5rem'}}>No credit card required</p>
            <p style={{fontSize:'2.5rem',fontWeight:'800',marginBottom:'4px',color:'#f0f0f0',letterSpacing:'-1px'}}>$0</p>
            <p style={{fontSize:'12px',color:'#555',marginBottom:'1.5rem'}}>24 hours of full Pro access</p>
            <ul style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 24 hours of Pro access</li>
              <li>✅ 2 listings included</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ All AI assistant tools</li>
              <li>✅ No credit card needed</li>
            </ul>
            <a href="/signup"
              style={{display:'block',textAlign:'center',padding:'12px',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.1)',color:'#8b8fa8',textDecoration:'none',fontSize:'14px',fontWeight:'500',background:'rgba(0,0,0,0.2)'}}>
              Start free trial
            </a>
          </div>

          {/* PRO */}
          <div style={{background:'linear-gradient(135deg, #0d2818 0%, #0a1f12 100%)',borderRadius:'20px',border:'2px solid #1D9E75',padding:'2rem',boxShadow:'0 0 40px rgba(29,158,117,0.15)',position:'relative'}}>
            <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 14px',borderRadius:'20px',whiteSpace:'nowrap',boxShadow:'0 0 16px rgba(29,158,117,0.4)'}}>
              MOST POPULAR
            </div>
            <h3 style={{fontSize:'18px',fontWeight:'700',marginBottom:'4px',color:'#f0f0f0'}}>Pro</h3>
            <p style={{color:'#1D9E75',fontSize:'13px',marginBottom:'1.5rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'800',marginBottom:'4px',color:'#f0f0f0',letterSpacing:'-1px'}}>$20<span style={{fontSize:'16px',fontWeight:'400',color:'#6b7280'}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#1D9E75',marginBottom:'1.5rem'}}>Unlimited everything · Cancel anytime</p>
            <ul style={{fontSize:'13px',color:'#8b8fa8',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ All AI assistant tools</li>
              <li>✅ Seller meeting prep</li>
              <li>✅ Snap & start on-site</li>
              <li>✅ 7-day launch kit</li>
              <li>✅ Pricing assistant</li>
              <li>✅ Open house kit</li>
              <li>✅ Price drop kit</li>
              <li>✅ Follow-up assistant</li>
              <li>✅ Brand voice memory</li>
              <li>✅ 3 virtual stagings/month included</li>
              <li>✅ Call Capture (Pro only)</li>
              <li>✅ Leads & CRM</li>
              <li>✅ Listing performance tracker</li>
              <li>✅ Referral program</li>
              <li>✅ Priority support</li>
            </ul>
            <button
              onClick={() => handleCheckout('price_1TO92kKzAxeqVLKn5eQREGy5', 'subscription', 'pro')}
              disabled={loading === 'pro'}
              style={{width:'100%',padding:'13px',borderRadius:'10px',background: loading === 'pro' ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',fontSize:'14px',fontWeight:'700',cursor: loading === 'pro' ? 'not-allowed' : 'pointer',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>
              {loading === 'pro' ? 'Loading...' : 'Start Pro — $20/mo'}
            </button>
            <p style={{fontSize:'11px',color:'#444',textAlign:'center',marginTop:'10px'}}>
              Use code <strong style={{color:'#d4af37'}}>WELCOME50</strong> for 50% off your first month
            </p>
          </div>
        </div>

        {/* ROI LINE */}
        <div style={{background:'rgba(29,158,117,0.08)',borderRadius:'12px',padding:'1.25rem',border:'1px solid rgba(29,158,117,0.15)',marginBottom:'3rem'}}>
          <p style={{fontSize:'14px',color:'#1D9E75',margin:'0'}}>
            💡 <strong>Quick math:</strong> Agents save hours per listing with Listing Whisperer. At $20/month, that's less than the value of one hour of your time.
          </p>
        </div>

        {/* FAQ */}
        <div style={{textAlign:'left',maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{fontSize:'1.25rem',fontWeight:'700',marginBottom:'1.5rem',textAlign:'center',color:'#f0f0f0'}}>Pricing FAQ</h2>
          {[
            {q:'Is the free trial really free?',a:'Yes. You get 24 hours of full Pro access with unlimited listings — no credit card required. After your trial expires, Pro is $20/month.'},
            {q:'What\'s included in Pro?',a:'Everything — unlimited listings, all AI tools, virtual staging (3/month), seller prep, pricing assistant, open house kit, follow-up assistant, launch kit, brand voice memory, leads CRM, listing performance tracker, and more.'},
            {q:'What is Virtual Staging?',a:'Virtual Staging lets you upload a photo of an empty room and get back a fully furnished, professionally staged version in under 2 minutes. Pro includes 3 stagings per month. Additional credits are available as add-ons.'},
            {q:'Can I use the discount code WELCOME50?',a:'Yes! Enter code WELCOME50 at checkout for 50% off your first Pro month.'},
            {q:'Can I cancel Pro anytime?',a:'Yes. No contracts. Cancel anytime from your account settings. You keep Pro access until the end of your billing period.'},
            {q:'What happens after my free trial?',a:'After 24 hours, you can upgrade to Pro for $20/month. Your listing history and settings are always saved.'},
            {q:'Is my data private?',a:"Yes. We never sell your data. Property details you enter are used only to generate your content. See our Privacy Policy for full details."},
            {q:'Do you offer refunds?',a:"We don't offer refunds for partial months, but you can cancel anytime. Virtual Staging credits are non-refundable once used."},
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
          <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>Use code <strong style={{color:'#d4af37'}}>WELCOME50</strong> at checkout for 50% off your first Pro month.</p>
        </div>

        {/* VIRTUAL STAGING CREDITS */}
        <div style={{marginTop:'3rem',textAlign:'center'}}>
          <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Need more Virtual Stagings?</h2>
          <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'2rem'}}>Pro includes 3 per month. Buy more anytime — credits never expire.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'1rem',textAlign:'center'}}>
            {[
              {credits:'5 credits',price:'$9',perUnit:'$1.80 per staging'},
              {credits:'15 credits',price:'$24',perUnit:'$1.60 per staging'},
              {credits:'30 credits',price:'$44',perUnit:'$1.47 per staging'},
            ].map(pack => (
              <a key={pack.credits} href="/virtual-staging" style={{textDecoration:'none'}}>
                <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.25)',padding:'1.5rem',transition:'all 0.2s',cursor:'pointer'}}
                  onMouseOver={e => {(e.currentTarget as HTMLDivElement).style.borderColor='#1D9E75';(e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(29,158,117,0.15)'}}
                  onMouseOut={e => {(e.currentTarget as HTMLDivElement).style.borderColor='rgba(29,158,117,0.25)';(e.currentTarget as HTMLDivElement).style.boxShadow='none'}}>
                  <p style={{fontSize:'20px',fontWeight:'800',color:'#f0f0f0',margin:'0 0 4px'}}>{pack.price}</p>
                  <p style={{fontSize:'14px',fontWeight:'700',color:'#1D9E75',margin:'0 0 6px'}}>{pack.credits}</p>
                  <p style={{fontSize:'12px',color:'#5a5f72',margin:'0'}}>{pack.perUnit}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        <p style={{fontSize:'12px',color:'#333',marginTop:'2rem'}}>
          <a href="/terms" style={{color:'#333'}}>Terms of Service</a> · <a href="/privacy" style={{color:'#333'}}>Privacy Policy</a> · <a href="/faq" style={{color:'#333'}}>FAQ</a>
        </p>
      </div>
    </main>
  )
}