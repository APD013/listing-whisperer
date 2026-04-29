'use client'
import { useState, useEffect } from 'react'
import { trackCTAClick, trackEvent, preserveUTMs } from './lib/analytics'

export default function Home() {
  const [activeOutput, setActiveOutput] = useState('mls')
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [exitPopupShown, setExitPopupShown] = useState(false)

  useEffect(() => {
    preserveUTMs()
    trackEvent('landing_page_view')

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitPopupShown) {
        setShowExitPopup(true)
        setExitPopupShown(true)
        trackEvent('exit_intent_shown')
      }
    }
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [exitPopupShown])

  const sampleOutputs: Record<string, string> = {
    mls: `Welcome to this stunning 4-bedroom, 3-bath home nestled in the heart of Newport Beach. Spanning 2,200 sq ft of thoughtfully designed living space, this residence seamlessly blends coastal elegance with modern comfort. The chef's kitchen features quartz countertops, premium stainless appliances, and a large island perfect for entertaining. Retreat to the primary suite with spa-inspired bath and private ocean-view balcony. Three-car garage, solar panels, and smart home system included. Steps from top-rated schools, dining, and the beach. Priced at $1,295,000 — this one won't last.`,
    instagram: `🌊 Your dream coastal home just hit the market.\n\n4 beds · 3 baths · Ocean views · Chef's kitchen\nNewport Beach, CA — $1,295,000\n\nSwipe to see inside 👉\n\n#NewportBeach #LuxuryRealEstate #DreamHome #CoastalLiving #JustListed #OceanView`,
    email: `Subject: Just Listed — Stunning Ocean View Home in Newport Beach\n\nHi [First Name],\n\nA property just came to market that I think you'll love.\n\n4 bedrooms · 3 bathrooms · 2,200 sq ft\nNewport Beach, CA · Listed at $1,295,000\n\nOcean views, updated kitchen, and a primary suite that feels like a private retreat.\n\nReply to schedule a private showing before the weekend open house.\n\nBest,\n[Agent Name]`,
  }

  return (
    <main style={{fontFamily:"'Inter', sans-serif",color:'#111'}}>

      {/* EXIT INTENT POPUP */}
      {showExitPopup && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.3)',padding:'2.5rem',maxWidth:'480px',width:'100%',boxShadow:'0 0 60px rgba(29,158,117,0.15)',textAlign:'center',position:'relative'}}>
            <button onClick={() => setShowExitPopup(false)}
              style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',fontSize:'16px',cursor:'pointer'}}>✕</button>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎁</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Wait — don't leave empty handed!</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem',lineHeight:'1.7'}}>
              Get <strong style={{color:'#1D9E75'}}>24 hours of full Pro access free</strong> — no credit card required. Generate your first listing in 60 seconds.
            </p>
            <div style={{background:'rgba(29,158,117,0.1)',border:'1px solid rgba(29,158,117,0.2)',borderRadius:'10px',padding:'1rem',marginBottom:'1.5rem'}}>
              <p style={{fontSize:'13px',color:'#1D9E75',margin:'0',lineHeight:'1.8'}}>
                ✓ 11 copy formats per listing<br/>
                ✓ Seller meeting prep<br/>
                ✓ Social content planner<br/>
                ✓ No credit card needed
              </p>
            </div>
            <a href="/signup" onClick={() => { trackEvent('exit_intent_cta_click'); setShowExitPopup(false) }}
              style={{display:'block',padding:'14px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'15px',fontWeight:'700',boxShadow:'0 0 24px rgba(29,158,117,0.3)',marginBottom:'12px'}}>
              Start Free Trial →
            </a>
            <p style={{fontSize:'12px',color:'#444',margin:'0'}}>Use code <strong style={{color:'#1D9E75'}}>WELCOME50</strong> for 50% off Pro after trial</p>
            <button onClick={() => setShowExitPopup(false)}
              style={{background:'none',border:'none',color:'#444',fontSize:'12px',cursor:'pointer',marginTop:'10px'}}>
              No thanks, I'll pass
            </button>
          </div>
        </div>
      )}

      {/* STICKY TOP BAR */}
      <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',padding:'10px 1.5rem',textAlign:'center',position:'sticky',top:0,zIndex:101}}>
        <p style={{margin:'0',fontSize:'13px',color:'#fff',fontWeight:'600'}}>
          🎉 Limited offer — Use code <strong style={{color:'#d4af37'}}>WELCOME50</strong> for 50% off Pro · 
          <a href="/signup" style={{color:'#fff',textDecoration:'underline',marginLeft:'8px',fontWeight:'700'}}>Start free trial →</a>
        </p>
      </div>

      {/* NAV */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.5rem',borderBottom:'1px solid #eee',background:'#fff',position:'sticky',top:'41px',zIndex:100}}>
        <div style={{fontSize:'18px',fontWeight:'700'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="#features" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Features</a>
          <a href="#pricing" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Pricing</a>
          <a href="/login" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Sign In</a>
          <a href="/signup" style={{fontSize:'13px',background:'#1D9E75',color:'#fff',padding:'8px 16px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',whiteSpace:'nowrap',boxShadow:'0 2px 8px rgba(29,158,117,0.3)'}}>Try Free →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{textAlign:'center',padding:'4rem 1.5rem 3rem',background:'linear-gradient(180deg,#f0fdf8 0%,#fff 100%)'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'#E1F5EE',color:'#085041',fontSize:'12px',fontWeight:'700',padding:'5px 14px',borderRadius:'20px',marginBottom:'1.5rem',letterSpacing:'0.5px',border:'1px solid #bbf0d9'}}>
          <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#1D9E75',display:'inline-block'}}/>
          BUILT FOR REAL ESTATE AGENTS
        </div>
        <h1 style={{fontSize:'clamp(2rem, 5vw, 3.25rem)',fontWeight:'800',lineHeight:'1.15',maxWidth:'740px',margin:'0 auto 1.25rem',letterSpacing:'-0.5px'}}>
          The AI assistant built for<br/>
          <span style={{color:'#1D9E75'}}>real estate agents.</span>
        </h1>
        <p style={{fontSize:'1.125rem',color:'#555',maxWidth:'560px',margin:'0 auto 1rem',lineHeight:'1.75'}}>
          From seller meeting prep to on-site photo drafts to full marketing launch — Listing Whisperer is your AI field assistant before, during, and after every listing.
        </p>
        <p style={{fontSize:'14px',color:'#1D9E75',fontWeight:'600',maxWidth:'480px',margin:'0 auto 2rem'}}>
          Used by agents across the country to save hours per listing.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap',marginBottom:'1rem'}}>
          <a href="/signup" onClick={() => trackCTAClick('hero_cta', 'homepage')}
            style={{background:'#1D9E75',color:'#fff',padding:'15px 36px',borderRadius:'10px',textDecoration:'none',fontWeight:'700',fontSize:'16px',boxShadow:'0 4px 20px rgba(29,158,117,0.35)',transition:'all 0.2s'}}>
            Start Free — 24 Hours of Pro →
          </a>
          <a href="#examples"
            style={{background:'#fff',color:'#111',padding:'15px 32px',borderRadius:'10px',textDecoration:'none',fontWeight:'500',fontSize:'16px',border:'1px solid #ddd'}}>
            See Real Output
          </a>
        </div>
        <p style={{fontSize:'13px',color:'#aaa'}}>No credit card · 2 listings included · Cancel anytime</p>
      </section>

      {/* STATS STRIP */}
      <section style={{background:'#fff',padding:'2rem',borderTop:'1px solid #f0f0f0',borderBottom:'1px solid #f0f0f0'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',display:'flex',justifyContent:'center',gap:'3rem',flexWrap:'wrap'}}>
          {[
            {stat:'11',label:'Formats per listing — and growing'},
            {stat:'60s',label:'Generation time'},
            {stat:'24h',label:'Free Pro trial to start'},
          ].map(({stat,label}) => (
            <div key={label} style={{textAlign:'center'}}>
              <p style={{fontSize:'2.25rem',fontWeight:'800',color:'#1D9E75',margin:'0',letterSpacing:'-1px'}}>{stat}</p>
              <p style={{fontSize:'13px',color:'#888',margin:'4px 0 0',fontWeight:'500'}}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF BAR */}
      <section style={{background:'#1D9E75',padding:'1rem 2rem'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',display:'flex',justifyContent:'center',gap:'2rem',flexWrap:'wrap'}}>
          {['11 copy formats','Seller meeting prep','Pricing assistant','On-site photo drafts','7-day launch kit','Objection handler','Social content planner','Seller net sheet','Agent portfolio','Commission calculator'].map(item => (
            <span key={item} style={{color:'#fff',fontSize:'13px',fontWeight:'600'}}>✓ {item}</span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{padding:'5rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'820px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>The full listing workflow. One tool.</h2>
          <p style={{color:'#777',marginBottom:'3.5rem',fontSize:'15px'}}>From seller appointment to launch day — Listing Whisperer handles it all.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'2rem'}}>
            {[
              {step:'1',title:'Before the appointment',desc:'Generate a complete seller meeting prep kit — talking points, questions to ask, and a follow-up email — before you walk in the door.',color:'#1D9E75'},
              {step:'2',title:'On-site with Snap & Start',desc:'Upload property photos from your phone. Our AI detects features and generates your first draft while you\'re still at the property.',color:'#085041'},
              {step:'3',title:'Full marketing launch',desc:'Generate all 11 copy formats, download PDF flyers, and get a 7-day launch plan — everything ready before you leave your desk.',color:'#1D9E75'},
            ].map(({step,title,desc,color}) => (
              <div key={step} style={{textAlign:'center',padding:'1.5rem',background:'#fff',borderRadius:'16px',border:'1px solid #eee',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
                <div style={{width:'52px',height:'52px',background:color,color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',fontWeight:'800',margin:'0 auto 1.25rem',boxShadow:`0 4px 12px ${color}40`}}>{step}</div>
                <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'10px'}}>{title}</h3>
                <p style={{fontSize:'13px',color:'#777',lineHeight:'1.75',margin:'0'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" style={{padding:'5rem 2rem',background:'#fff'}}>
        <div style={{maxWidth:'920px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>One assistant. The entire listing workflow.</h2>
          <p style={{textAlign:'center',color:'#777',marginBottom:'3.5rem',fontSize:'15px'}}>Not a generic AI tool — a purpose-built assistant for every stage of the listing process.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))',gap:'1.5rem'}}>
            {[
              {icon:'📋',title:'Seller Meeting Prep',desc:'Meeting outlines, talking points, seller questions, and follow-up emails — before every appointment.'},
              {icon:'📸',title:'Snap & Start',desc:'Upload photos on-site, confirm details, and generate your first draft before you leave the property.'},
              {icon:'🏠',title:'11 Copy Formats',desc:'MLS, Luxury MLS, Instagram, Facebook, Email, Open House, Video Script, SMS, Flyer, Price Drop, SEO — and more formats coming.'},
              {icon:'🚀',title:'7-Day Launch Kit',desc:'A complete day-by-day marketing plan with social posts, email sequences, and pro tips.'},
              {icon:'✨',title:'Listing Rewriter',desc:'Paste any boring MLS description and get a polished, buyer-ready rewrite instantly.'},
              {icon:'🎙️',title:'Brand Voice Memory',desc:'Save your tone, style, and CTA preferences so every listing sounds like you.'},
              {icon:'🛡️',title:'Objection Handler',desc:'Turn any seller or buyer objection into a confident, professional response — instantly.'},
              {icon:'📅',title:'Social Content Planner',desc:'Generate a full 7-day social media calendar for any listing — Instagram, Facebook, LinkedIn, Twitter and SMS.'},
              {icon:'💰',title:'Seller Net Sheet',desc:'Estimate your seller\'s take-home proceeds before closing. Fast, clear, and easy to share.'},
              {icon:'🏆',title:'Agent Portfolio',desc:'A shareable public portfolio page with all your past listings. Send it to any potential client. Pro only.'},
              {icon:'👥',title:'Leads & CRM',desc:'Track your pipeline, manage contacts, and stay on top of every client relationship.'},
              {icon:'✦',title:'AI Chat Assistant',desc:'Ask anything about real estate or your listings. Your always-on AI assistant built for agents.'},
            ].map(({icon,title,desc}) => (
              <div key={title} style={{background:'#f8fafc',borderRadius:'14px',padding:'1.5rem',border:'1px solid #eee',transition:'all 0.2s'}}
                onMouseOver={e => {e.currentTarget.style.borderColor='#1D9E75';e.currentTarget.style.boxShadow='0 4px 20px rgba(29,158,117,0.1)'}}
                onMouseOut={e => {e.currentTarget.style.borderColor='#eee';e.currentTarget.style.boxShadow='none'}}>
                <div style={{fontSize:'2rem',marginBottom:'12px'}}>{icon}</div>
                <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'8px'}}>{title}</h3>
                <p style={{fontSize:'13px',color:'#777',lineHeight:'1.75',margin:'0'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE/AFTER */}
      <section style={{padding:'5rem 2rem',maxWidth:'900px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>From rough notes to full marketing kit</h2>
        <p style={{textAlign:'center',color:'#777',marginBottom:'3.5rem',fontSize:'15px'}}>Fill in the details — we handle everything from MLS copy to launch plans.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1.5rem',alignItems:'center'}}>
          <div style={{background:'#fff8f0',border:'1px solid #fde8c8',borderRadius:'14px',padding:'1.75rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#aaa',marginBottom:'10px',letterSpacing:'1px'}}>YOUR ROUGH NOTES</p>
            <p style={{fontSize:'14px',color:'#666',lineHeight:'1.85',fontStyle:'italic',margin:'0'}}>
              "4bd 3ba NB, 2200sf, ocean views, chefs kitchen quartz, spa bath, 3 car garage, solar, smart home, top schools, $1.295m"
            </p>
          </div>
          <div style={{fontSize:'2.5rem',color:'#1D9E75',fontWeight:'800',textAlign:'center'}}>→</div>
          <div style={{background:'#f0fdf8',border:'1px solid #bbf0d9',borderRadius:'14px',padding:'1.75rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'10px',letterSpacing:'1px'}}>11 READY-TO-USE FORMATS (AND GROWING)</p>
            <p style={{fontSize:'13px',color:'#333',lineHeight:'2',margin:'0'}}>
              ✅ MLS Description<br/>✅ Luxury MLS<br/>✅ Instagram Caption<br/>✅ Facebook Post<br/>✅ Email Blast<br/>✅ Open House Flyer<br/>✅ Video Script<br/>✅ SMS, Flyer & Price Drop<br/>✅ SEO Copy
            </p>
          </div>
        </div>
      </section>

      {/* SAMPLE OUTPUTS */}
      <section id="examples" style={{padding:'5rem 2rem',background:'#f9fafb',maxWidth:'100%'}}>
        <div style={{maxWidth:'860px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>See real output</h2>
          <p style={{textAlign:'center',color:'#777',marginBottom:'0.5rem',fontSize:'15px'}}>One set of property notes. Three formats. Ready to copy and paste.</p>
          <p style={{textAlign:'center',fontSize:'13px',color:'#1D9E75',fontWeight:'600',marginBottom:'2.5rem'}}>👇 Click each tab to preview</p>

          {/* TABS */}
          <div style={{display:'flex',gap:'10px',justifyContent:'center',marginBottom:'1.5rem',flexWrap:'wrap'}}>
            {[
              {key:'mls',label:'🏠 MLS Description',color:'#1D9E75',bg:'#E1F5EE',desc:'MLS ready'},
              {key:'instagram',label:'📸 Instagram',color:'#e1306c',bg:'#fde8f0',desc:'Social ready'},
              {key:'email',label:'📧 Email Blast',color:'#6366f1',bg:'#eef2ff',desc:'Send ready'}
            ].map(t => (
              <button key={t.key} onClick={() => setActiveOutput(t.key)}
                style={{padding:'10px 22px',borderRadius:'20px',border:'2px solid',fontSize:'13px',cursor:'pointer',fontWeight:'600',transition:'all 0.15s',
                  borderColor: activeOutput === t.key ? t.color : '#e5e7eb',
                  background: activeOutput === t.key ? t.bg : '#fff',
                  color: activeOutput === t.key ? t.color : '#888',
                  boxShadow: activeOutput === t.key ? `0 4px 12px ${t.color}20` : 'none'}}>
                {t.label}
                {activeOutput === t.key && <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',opacity:0.7}}>{t.desc}</span>}
              </button>
            ))}
          </div>

          {/* OUTPUT CARD */}
          <div style={{background:'#fff',borderRadius:'16px',border:'2px solid',overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.06)',
            borderColor: activeOutput === 'mls' ? '#1D9E75' : activeOutput === 'instagram' ? '#e1306c' : '#6366f1'}}>

            {/* CARD HEADER */}
            <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid #f0f0f0',display:'flex',justifyContent:'space-between',alignItems:'center',
              background: activeOutput === 'mls' ? '#f0fdf8' : activeOutput === 'instagram' ? '#fdf2f5' : '#f5f3ff'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{fontSize:'1.25rem'}}>{activeOutput === 'mls' ? '🏠' : activeOutput === 'instagram' ? '📸' : '📧'}</span>
                <div>
                  <p style={{margin:'0',fontSize:'13px',fontWeight:'700',color:'#111'}}>
                    {activeOutput === 'mls' ? 'MLS Description' : activeOutput === 'instagram' ? 'Instagram Caption' : 'Email Blast'}
                  </p>
                  <p style={{margin:'0',fontSize:'11px',color:'#888'}}>
                    {activeOutput === 'mls' ? 'Ready to paste into your MLS portal' : activeOutput === 'instagram' ? 'Ready to post — hashtags included' : 'Ready to send to your list'}
                  </p>
                </div>
              </div>
              <span style={{fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'20px',
                background: activeOutput === 'mls' ? '#E1F5EE' : activeOutput === 'instagram' ? '#fde8f0' : '#eef2ff',
                color: activeOutput === 'mls' ? '#085041' : activeOutput === 'instagram' ? '#e1306c' : '#6366f1'}}>
                SAMPLE OUTPUT
              </span>
            </div>

            {/* CARD BODY */}
            <div style={{padding:'1.75rem'}}>
              <p style={{fontSize:'14px',lineHeight:'1.95',color:'#333',whiteSpace:'pre-wrap',margin:'0'}}>{sampleOutputs[activeOutput]}</p>
            </div>
          </div>

          <div style={{textAlign:'center',marginTop:'2rem'}}>
            <a href="/signup" onClick={() => trackCTAClick('examples_cta', 'homepage')}
              style={{display:'inline-block',background:'#1D9E75',color:'#fff',padding:'13px 32px',borderRadius:'10px',textDecoration:'none',fontWeight:'700',fontSize:'14px',boxShadow:'0 4px 16px rgba(29,158,117,0.3)'}}>
              Generate yours free →
            </a>
            <p style={{fontSize:'12px',color:'#aaa',marginTop:'8px'}}>No credit card · Takes 60 seconds</p>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{padding:'5rem 2rem',background:'#fff'}}>
        <div style={{maxWidth:'720px',margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg,#f0fdf8,#e8f9f2)',borderRadius:'16px',padding:'2.25rem',marginBottom:'2.5rem',border:'1px solid #bbf0d9'}}>
            <p style={{fontSize:'13px',color:'#085041',fontWeight:'700',marginBottom:'10px',letterSpacing:'0.3px'}}>👋 A NOTE FROM THE FOUNDER</p>
            <p style={{fontSize:'15px',color:'#333',lineHeight:'1.85',marginBottom:'12px'}}>
              I built Listing Whisperer because I watched agents spend hours writing copy for every single listing — MLS, Instagram, email, open house — separately, manually, every time.
            </p>
            <p style={{fontSize:'15px',color:'#333',lineHeight:'1.85',marginBottom:'16px'}}>
              This tool does all of it in under 60 seconds. It's built specifically for real estate agents, and early users get priority support directly from me.
            </p>
            <p style={{fontSize:'14px',color:'#1D9E75',fontWeight:'700',margin:'0'}}>— Adrian, Founder of Listing Whisperer</p>
          </div>
          <h3 style={{fontSize:'1.4rem',fontWeight:'700',marginBottom:'0.4rem',textAlign:'center'}}>What early users are saying</h3>
          <p style={{fontSize:'13px',color:'#aaa',textAlign:'center',marginBottom:'2rem'}}>From our first beta users</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'1.5rem'}}>
            {[
              {quote:'"Saved me hours on my last listing. The Instagram captions were ready to post."',initials:'S.M.',role:'Realtor, Orange County'},
              {quote:'"Finally something built for agents. Not just another generic AI tool. The MLS copy was spot on."',initials:'J.T.',role:'Agent, Los Angeles'},
              {quote:'"I used to dread writing listing descriptions. Now I generate everything in one click."',initials:'L.R.',role:'Broker, San Diego'},
            ].map(({quote,initials,role}) => (
              <div key={initials} style={{background:'#f9fafb',borderRadius:'14px',padding:'1.5rem',border:'1px solid #eee'}}>
                <div style={{display:'flex',gap:'2px',marginBottom:'10px'}}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{color:'#f59e0b',fontSize:'14px'}}>★</span>)}
                </div>
                <p style={{fontSize:'14px',color:'#333',lineHeight:'1.8',marginBottom:'1rem',fontStyle:'italic'}}>{quote}</p>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'36px',height:'36px',background:'#1D9E75',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700'}}>{initials}</div>
                  <p style={{fontSize:'12px',color:'#aaa',margin:'0'}}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NOT GENERIC AI */}
      <section style={{padding:'5rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'700px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>Why not just use ChatGPT?</h2>
          <p style={{color:'#777',marginBottom:'3.5rem',fontSize:'15px'}}>Great question. Here's the real difference.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:'1.5rem',textAlign:'left'}}>
            <div style={{background:'#fff',borderRadius:'14px',padding:'1.75rem',border:'1px solid #eee'}}>
              <p style={{fontWeight:'700',marginBottom:'1rem',color:'#bbb',fontSize:'14px'}}>❌ ChatGPT / Generic AI</p>
              <ul style={{fontSize:'14px',color:'#888',lineHeight:'2.2',paddingLeft:'1rem',margin:'0'}}>
                <li>Write your own prompts every time</li>
                <li>One format at a time</li>
                <li>No real estate workflow</li>
                <li>No tone or buyer targeting</li>
                <li>No saved listing history</li>
                <li>No seller prep or pricing tools</li>
              </ul>
            </div>
            <div style={{background:'#f0fdf8',borderRadius:'14px',padding:'1.75rem',border:'2px solid #bbf0d9'}}>
              <p style={{fontWeight:'700',marginBottom:'1rem',color:'#1D9E75',fontSize:'14px'}}>✅ Listing Whisperer</p>
              <ul style={{fontSize:'14px',color:'#333',lineHeight:'2.2',paddingLeft:'1rem',margin:'0'}}>
                <li>Built-in real estate workflow</li>
                <li>11 formats in one click</li>
                <li>Seller meeting prep included</li>
                <li>On-site photo drafts</li>
                <li>Tone & buyer targeting</li>
                <li>Saved listing history</li>
                <li>Pricing assistant</li>
                <li>Objection handler</li>
                <li>Social content planner</li>
                <li>Seller net sheet</li>
                <li>Agent portfolio page</li>
                <li>AI chat assistant</li>
                <li>Follow-up tools</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'5rem 2rem',maxWidth:'760px',margin:'0 auto',textAlign:'center'}}>
        <h2 style={{fontSize:'2rem',fontWeight:'700',marginBottom:'0.5rem',letterSpacing:'-0.3px'}}>Simple, honest pricing</h2>
        <p style={{color:'#777',marginBottom:'0.5rem',fontSize:'15px'}}>Try free for 24 hours — then go Pro for $20/month.</p>
        <p style={{color:'#aaa',fontSize:'13px',marginBottom:'3.5rem'}}>No credit card required to start free.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:'1.5rem',maxWidth:'600px',margin:'0 auto'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'1px solid #eee',textAlign:'left'}}>
            <h3 style={{fontSize:'18px',fontWeight:'700',marginBottom:'4px'}}>Free Trial</h3>
            <p style={{color:'#aaa',fontSize:'13px',marginBottom:'1rem'}}>No credit card required</p>
            <p style={{fontSize:'2.5rem',fontWeight:'800',marginBottom:'4px',letterSpacing:'-1px'}}>$0</p>
            <p style={{fontSize:'12px',color:'#bbb',marginBottom:'1.5rem'}}>24 hours of full Pro access</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 24 hours of Pro access</li>
              <li>✅ 2 listings included</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ All AI assistant tools</li>
              <li>✅ No credit card needed</li>
            </ul>
            <a href="/signup" onClick={() => trackCTAClick('pricing_free_cta', 'homepage')}
              style={{display:'block',textAlign:'center',padding:'11px',borderRadius:'8px',border:'1px solid #ddd',color:'#333',textDecoration:'none',fontSize:'14px',fontWeight:'500'}}>
              Start free trial
            </a>
          </div>
          <div style={{background:'#1D9E75',borderRadius:'16px',padding:'2rem',textAlign:'left',color:'#fff',position:'relative',boxShadow:'0 8px 32px rgba(29,158,117,0.25)'}}>
            <div style={{position:'absolute',top:'-13px',left:'50%',transform:'translateX(-50%)',background:'#d4af37',color:'#000',fontSize:'11px',fontWeight:'700',padding:'4px 14px',borderRadius:'20px',whiteSpace:'nowrap'}}>
              MOST POPULAR
            </div>
            <h3 style={{fontSize:'18px',fontWeight:'700',marginBottom:'4px'}}>Pro</h3>
            <p style={{color:'#a8f0d4',fontSize:'13px',marginBottom:'1rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'800',marginBottom:'4px',letterSpacing:'-1px'}}>$20<span style={{fontSize:'16px',fontWeight:'400',opacity:0.7}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#a8f0d4',marginBottom:'1.5rem'}}>Unlimited everything — cancel anytime</p>
            <ul style={{fontSize:'14px',color:'#e0f7ee',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ All AI assistant tools</li>
              <li>✅ Seller meeting prep</li>
              <li>✅ Snap & start on-site</li>
              <li>✅ 7-day launch kit</li>
              <li>✅ Pricing assistant</li>
              <li>✅ Objection handler</li>
              <li>✅ Social content planner</li>
              <li>✅ Seller net sheet</li>
              <li>✅ Agent portfolio page</li>
              <li>✅ AI chat assistant</li>
              <li>✅ Brand voice memory</li>
              <li>✅ Priority support</li>
            </ul>
            <a href="/signup" onClick={() => trackCTAClick('pricing_pro_cta', 'homepage')}
              style={{display:'block',textAlign:'center',padding:'11px',borderRadius:'8px',background:'#fff',color:'#1D9E75',textDecoration:'none',fontSize:'14px',fontWeight:'700'}}>
              Start free → Go Pro
            </a>
          </div>
        </div>
        <p style={{fontSize:'13px',color:'#bbb',marginTop:'1.5rem',textAlign:'center'}}>Use code <strong style={{color:'#1D9E75'}}>WELCOME50</strong> for 50% off your first month</p>
      </section>

      {/* FAQ */}
      <section style={{padding:'5rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'620px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'2rem',fontWeight:'700',marginBottom:'3.5rem',letterSpacing:'-0.3px'}}>Frequently asked questions</h2>
          {[
            {q:'Is this really free to start?',a:'Yes. You get 24 hours of full Pro access and 2 listings completely free — no credit card required. After your trial, Pro is $20/month with unlimited listings and all features.'},
            {q:'What formats does it generate?',a:'MLS standard, Luxury MLS, Instagram captions, Facebook post, Email blast, Open house announcement, Video script, SMS, Flyer, Price Drop, and SEO copy — all from one set of notes.'},
            {q:'What is Seller Meeting Prep?',a:'Before your listing appointment, Listing Whisperer generates a complete meeting outline, talking points, questions to ask the seller, and a follow-up email — so you walk in fully prepared.'},
            {q:'What is Snap & Start?',a:'On your phone or tablet, upload property photos on-site. Our AI detects visible features, you confirm the details, and generate your first draft before you leave the property.'},
            {q:'How is this different from ChatGPT?',a:'Listing Whisperer is built specifically for real estate agents. It covers the entire listing workflow — seller prep, on-site photo drafts, full marketing launch, and pricing strategy — not just copy generation. No prompt writing required.'},
            {q:'Can I cancel anytime?',a:'Yes. No contracts, no commitments. Cancel your Pro subscription anytime from your account settings.'},
            {q:'How good is the copy quality?',a:'Our AI is trained specifically for real estate marketing and produces MLS-ready, professional copy that sounds like it was written by an experienced agent.'},
            {q:'What is the Objection Handler?',a:'Type in any objection you\'re hearing from a seller or buyer — like "your commission is too high" or "Zillow says it\'s worth more" — and get a confident, professional response instantly.'},
            {q:'What is the Seller Net Sheet?',a:'A fast proceeds estimator. Enter the sale price, mortgage balance, commission, and closing costs — and instantly see how much your seller will walk away with. Easy to print and share.'},
            {q:'What is the Agent Portfolio?',a:'A shareable public page at listingwhisperer.com/portfolio/yourname that shows all your past listings and brand info. Send it to any potential client to showcase your work. Pro only.'},
            {q:'Does it have an AI chat assistant?',a:'Yes. The AI chat widget is available on your dashboard. Ask it anything about real estate, your listings, or how to use any tool in the app.'},
          ].map(({q,a}) => (
            <div key={q} style={{borderBottom:'1px solid #e5e7eb',paddingBottom:'1.5rem',marginBottom:'1.5rem'}}>
              <p style={{fontWeight:'700',fontSize:'15px',marginBottom:'8px',color:'#111'}}>{q}</p>
              <p style={{fontSize:'14px',color:'#777',lineHeight:'1.85',margin:'0'}}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{padding:'5rem 2rem',background:'linear-gradient(135deg,#f0fdf8,#e8f9f2)',textAlign:'center',borderTop:'1px solid #bbf0d9'}}>
        <h2 style={{fontSize:'2rem',fontWeight:'800',marginBottom:'0.75rem',letterSpacing:'-0.3px'}}>Your AI listing assistant is ready.</h2>
        <p style={{fontSize:'15px',color:'#555',marginBottom:'2rem',maxWidth:'420px',margin:'0 auto 2rem'}}>Start free — 24 hours of full Pro access, 2 listings included. No credit card needed.</p>
        <a href="/signup" onClick={() => trackCTAClick('bottom_cta', 'homepage')}
          style={{display:'inline-block',background:'#1D9E75',color:'#fff',padding:'16px 40px',borderRadius:'10px',textDecoration:'none',fontWeight:'700',fontSize:'16px',boxShadow:'0 4px 24px rgba(29,158,117,0.35)'}}>
          Get Started Free →
        </a>
        <p style={{fontSize:'13px',color:'#aaa',marginTop:'1rem'}}>No credit card · 2 listings included · Cancel anytime</p>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'2rem',textAlign:'center',borderTop:'1px solid #eee',background:'#fff'}}>
        <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'8px'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <p style={{fontSize:'13px',color:'#aaa',marginBottom:'8px'}}>The AI assistant for real estate agents. Before the appointment, on-site, and at launch.</p>
        <p style={{fontSize:'13px',color:'#aaa'}}>© 2026 Listing Whisperer · <a href="/login" style={{color:'#aaa'}}>Sign In</a> · <a href="/signup" style={{color:'#aaa'}}>Get Started Free</a> · <a href="#pricing" style={{color:'#aaa'}}>Pricing</a> · <a href="/contact" style={{color:'#aaa'}}>Contact Us</a> · <a href="/terms" style={{color:'#aaa'}}>Terms</a> · <a href="/privacy" style={{color:'#aaa'}}>Privacy</a></p>
      </footer>

    </main>
  )
}