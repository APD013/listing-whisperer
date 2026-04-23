'use client'
import { useState, useEffect } from 'react'
import { trackCTAClick, trackEvent, preserveUTMs } from './lib/analytics'

export default function Home() {
  const [activeOutput, setActiveOutput] = useState('mls')
  useEffect(() => {
    preserveUTMs()
    trackEvent('landing_page_view')
  }, [])

  const sampleOutputs: Record<string, string> = {
    mls: `Welcome to this stunning 4-bedroom, 3-bath home nestled in the heart of Newport Beach. Spanning 2,200 sq ft of thoughtfully designed living space, this residence seamlessly blends coastal elegance with modern comfort. The chef's kitchen features quartz countertops, premium stainless appliances, and a large island perfect for entertaining. Retreat to the primary suite with spa-inspired bath and private ocean-view balcony. Three-car garage, solar panels, and smart home system included. Steps from top-rated schools, dining, and the beach. Priced at $1,295,000 — this one won't last.`,
    instagram: `🌊 Your dream coastal home just hit the market.\n\n4 beds · 3 baths · Ocean views · Chef's kitchen\nNewport Beach, CA — $1,295,000\n\nSwipe to see inside 👉\n\n#NewportBeach #LuxuryRealEstate #DreamHome #CoastalLiving #JustListed #OceanView`,
    email: `Subject: Just Listed — Stunning Ocean View Home in Newport Beach\n\nHi [First Name],\n\nA property just came to market that I think you'll love.\n\n4 bedrooms · 3 bathrooms · 2,200 sq ft\nNewport Beach, CA · Listed at $1,295,000\n\nOcean views, updated kitchen, and a primary suite that feels like a private retreat.\n\nReply to schedule a private showing before the weekend open house.\n\nBest,\n[Agent Name]`,
  }

  return (
    <main style={{fontFamily:'sans-serif',color:'#111'}}>

      {/* NAV */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.5rem',borderBottom:'1px solid #eee',background:'#fff',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'18px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="#features" style={{fontSize:'14px',color:'#555',textDecoration:'none',display:'none'}} className="desktop-only">Features</a>
          <a href="#pricing" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Pricing</a>
          <a href="/login" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Sign In</a>
          <a href="/signup" style={{fontSize:'13px',background:'#1D9E75',color:'#fff',padding:'8px 14px',borderRadius:'8px',textDecoration:'none',fontWeight:'500',whiteSpace:'nowrap'}}>Get Started Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{textAlign:'center',padding:'5rem 2rem 3rem',background:'linear-gradient(180deg,#f0fdf8 0%,#fff 100%)'}}>
        <div style={{display:'inline-block',background:'#E1F5EE',color:'#085041',fontSize:'12px',fontWeight:'600',padding:'4px 12px',borderRadius:'20px',marginBottom:'1.5rem',letterSpacing:'0.5px'}}>
          BUILT FOR REAL ESTATE AGENTS
        </div>
        <h1 style={{fontSize:'3rem',fontWeight:'700',lineHeight:'1.2',maxWidth:'700px',margin:'0 auto 1.5rem'}}>
          The AI assistant that works with you{' '}
          <span style={{color:'#1D9E75'}}>before, during, and after every listing.</span>
        </h1>
        <p style={{fontSize:'1.125rem',color:'#555',maxWidth:'560px',margin:'0 auto 2rem',lineHeight:'1.7'}}>
          From seller meeting prep to on-site photo drafts to full marketing kits — Listing Whisperer is the AI field assistant built specifically for real estate agents.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap',marginBottom:'1rem'}}>
          <a href="/signup" onClick={() => trackCTAClick('hero_cta', 'homepage')} style={{background:'#1D9E75',color:'#fff',padding:'14px 32px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',fontSize:'16px'}}>
            Try 3 Free Listings
          </a>
          <a href="#examples" style={{background:'#fff',color:'#111',padding:'14px 32px',borderRadius:'8px',textDecoration:'none',fontWeight:'500',fontSize:'16px',border:'1px solid #ddd'}}>
            See Real Outputs
          </a>
        </div>
        <p style={{fontSize:'13px',color:'#999'}}>No credit card required · Cancel anytime · Built specifically for real estate agents</p>
      </section>

      {/* STATS STRIP */}
      <section style={{background:'#fff',padding:'1.5rem 2rem',borderBottom:'1px solid #eee'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',display:'flex',justifyContent:'center',gap:'4rem',flexWrap:'wrap'}}>
          {[
            {stat:'11',label:'Copy formats per listing'},
            {stat:'60s',label:'Average generation time'},
            {stat:'3',label:'Free listings to start'},
            {stat:'$0',label:'No credit card needed'},
          ].map(({stat,label}) => (
            <div key={label} style={{textAlign:'center'}}>
              <p style={{fontSize:'2rem',fontWeight:'700',color:'#1D9E75',margin:'0'}}>{stat}</p>
              <p style={{fontSize:'13px',color:'#666',margin:'0'}}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF BAR */}
      <section style={{background:'#1D9E75',padding:'1rem 2rem'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',display:'flex',justifyContent:'center',gap:'3rem',flexWrap:'wrap'}}>
          {['11 copy formats','Seller meeting prep','On-site photo drafts','7-day launch kit'].map(item => (
            <span key={item} style={{color:'#fff',fontSize:'14px',fontWeight:'500'}}>✓ {item}</span>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>How it works</h2>
          <p style={{color:'#666',marginBottom:'3rem'}}>One tool. The entire listing workflow.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2rem'}}>
            {[
              {step:'1',title:'Before the appointment',desc:'Use Seller Meeting Prep to get a meeting outline, talking points, and questions to ask before you walk in the door.'},
              {step:'2',title:'On-site with Snap & Start',desc:'Upload photos on your phone, confirm the details, and generate your first draft while still at the property.'},
              {step:'3',title:'Full marketing launch',desc:'Generate 11 copy formats, download PDF flyers, and get a 7-day launch plan — all in one click.'},
            ].map(({step,title,desc}) => (
              <div key={step} style={{textAlign:'center'}}>
                <div style={{width:'48px',height:'48px',background:'#1D9E75',color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:'700',margin:'0 auto 1rem'}}>{step}</div>
                <h3 style={{fontSize:'16px',fontWeight:'600',marginBottom:'8px'}}>{title}</h3>
                <p style={{fontSize:'14px',color:'#666',lineHeight:'1.7'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" style={{padding:'4rem 2rem',background:'#fff'}}>
        <div style={{maxWidth:'900px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Everything an agent needs</h2>
          <p style={{textAlign:'center',color:'#666',marginBottom:'3rem'}}>Built around the real listing workflow — not generic AI.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:'1.5rem'}}>
            {[
              {icon:'📋',title:'Seller Meeting Prep',desc:'Meeting outlines, talking points, seller questions, and follow-up emails before every appointment.'},
              {icon:'📸',title:'Snap & Start',desc:'Upload photos on-site, confirm details, and generate your first draft before you leave the property.'},
              {icon:'🏠',title:'11 Copy Formats',desc:'MLS, Luxury MLS, Instagram, Facebook, Email, Open House, Video Script, SMS, Flyer, Price Drop, and SEO.'},
              {icon:'🚀',title:'7-Day Launch Kit',desc:'A complete day-by-day marketing plan with social posts, email sequences, and pro tips.'},
              {icon:'✨',title:'Listing Rewriter',desc:'Paste any boring MLS description and get a polished, buyer-ready rewrite instantly.'},
              {icon:'🎙️',title:'Brand Voice Memory',desc:'Save your tone, style, and CTA preferences so every listing sounds like you.'},
            ].map(({icon,title,desc}) => (
              <div key={title} style={{background:'#f8fafc',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee'}}>
                <div style={{fontSize:'2rem',marginBottom:'12px'}}>{icon}</div>
                <h3 style={{fontSize:'15px',fontWeight:'600',marginBottom:'8px'}}>{title}</h3>
                <p style={{fontSize:'13px',color:'#666',lineHeight:'1.7',margin:'0'}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE/AFTER */}
      <section style={{padding:'4rem 2rem',maxWidth:'900px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>From rough notes to full marketing kit</h2>
        <p style={{textAlign:'center',color:'#666',marginBottom:'3rem'}}>Fill in the details — we handle everything from MLS copy to launch plans.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'1rem',alignItems:'center'}}>
          <div style={{background:'#fff8f0',border:'1px solid #fde8c8',borderRadius:'12px',padding:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#999',marginBottom:'8px',letterSpacing:'1px'}}>YOUR ROUGH NOTES</p>
            <p style={{fontSize:'14px',color:'#555',lineHeight:'1.8',fontStyle:'italic'}}>
              "4bd 3ba NB, 2200sf, ocean views, chefs kitchen quartz, spa bath, 3 car garage, solar, smart home, top schools, $1.295m"
            </p>
          </div>
          <div style={{fontSize:'2rem',color:'#1D9E75',fontWeight:'bold',textAlign:'center'}}>→</div>
          <div style={{background:'#f0fdf8',border:'1px solid #bbf0d9',borderRadius:'12px',padding:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'8px',letterSpacing:'1px'}}>11 READY-TO-USE FORMATS</p>
            <p style={{fontSize:'13px',color:'#333',lineHeight:'1.8'}}>✅ MLS Description<br/>✅ Luxury MLS<br/>✅ Instagram Caption<br/>✅ Facebook Post<br/>✅ Email Blast<br/>✅ Open House Flyer<br/>✅ Video Script<br/>✅ SMS, Flyer & Price Drop<br/>✅ SEO Copy</p>
          </div>
        </div>
      </section>

      {/* SAMPLE OUTPUTS */}
      <section id="examples" style={{padding:'4rem 2rem',maxWidth:'800px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>See real outputs</h2>
        <p style={{textAlign:'center',color:'#666',marginBottom:'0.5rem'}}>One set of property notes. Three formats. Ready to copy and paste.</p>
        <p style={{textAlign:'center',fontSize:'13px',color:'#1D9E75',fontWeight:'600',marginBottom:'2rem'}}>👇 Click each tab to see the actual output</p>
        <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          {[{key:'mls',label:'MLS Description'},{key:'instagram',label:'Instagram'},{key:'email',label:'Email Blast'}].map(t => (
            <button key={t.key} onClick={() => setActiveOutput(t.key)}
              style={{padding:'8px 18px',borderRadius:'20px',border:'1px solid',fontSize:'13px',cursor:'pointer',
                borderColor: activeOutput === t.key ? '#1D9E75' : '#ddd',
                background: activeOutput === t.key ? '#E1F5EE' : '#fff',
                color: activeOutput === t.key ? '#085041' : '#666'}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{background:'#f9fafb',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee'}}>
          <p style={{fontSize:'14px',lineHeight:'1.9',color:'#333',whiteSpace:'pre-wrap'}}>{sampleOutputs[activeOutput]}</p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{padding:'4rem 2rem',background:'#fff'}}>
        <div style={{maxWidth:'700px',margin:'0 auto'}}>
          <div style={{background:'linear-gradient(135deg,#f0fdf8,#e8f9f2)',borderRadius:'16px',padding:'2rem',marginBottom:'2rem',border:'1px solid #bbf0d9'}}>
            <p style={{fontSize:'14px',color:'#085041',fontWeight:'600',marginBottom:'8px'}}>👋 A note from the founder</p>
            <p style={{fontSize:'15px',color:'#333',lineHeight:'1.8',marginBottom:'12px'}}>
              I built Listing Whisperer because I watched agents spend 30+ minutes writing copy for every single listing — MLS, Instagram, email, open house — separately, manually, every time.
            </p>
            <p style={{fontSize:'15px',color:'#333',lineHeight:'1.8',marginBottom:'12px'}}>
              This tool does all of it in under 60 seconds. It's new, it's built specifically for real estate agents, and early users get priority support directly from me.
            </p>
            <p style={{fontSize:'14px',color:'#1D9E75',fontWeight:'600'}}>— Adrian, Founder of Listing Whisperer</p>
          </div>
          <h3 style={{fontSize:'1.25rem',fontWeight:'600',marginBottom:'0.5rem',textAlign:'center'}}>Early user feedback</h3>
          <p style={{fontSize:'13px',color:'#999',textAlign:'center',marginBottom:'2rem'}}>From our first beta users</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem'}}>
            {[
              {quote:'"Saved me at least 20 minutes on my last listing. The Instagram captions were ready to post."',initials:'S.M.',role:'Realtor, Orange County'},
              {quote:'"Finally something built for agents. Not just another generic AI tool. The MLS copy was spot on."',initials:'J.T.',role:'Agent, Los Angeles'},
              {quote:'"I used to dread writing listing descriptions. Now I generate everything in one click."',initials:'L.R.',role:'Broker, San Diego'},
            ].map(({quote,initials,role}) => (
              <div key={initials} style={{background:'#f9fafb',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee'}}>
                <p style={{fontSize:'14px',color:'#333',lineHeight:'1.8',marginBottom:'1rem',fontStyle:'italic'}}>{quote}</p>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'36px',height:'36px',background:'#1D9E75',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'13px',fontWeight:'600'}}>{initials}</div>
                  <p style={{fontSize:'12px',color:'#999',margin:'0'}}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NOT GENERIC AI */}
      <section style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'700px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Why not just use generic AI?</h2>
          <p style={{color:'#666',marginBottom:'3rem'}}>Great question. Here's the difference.</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',textAlign:'left'}}>
            <div style={{background:'#fff',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee'}}>
              <p style={{fontWeight:'600',marginBottom:'1rem',color:'#999'}}>❌ Generic AI Tools</p>
              <ul style={{fontSize:'14px',color:'#666',lineHeight:'2',paddingLeft:'1rem'}}>
                <li>Write your own prompts every time</li>
                <li>One format at a time</li>
                <li>No real estate workflow</li>
                <li>No tone or buyer targeting</li>
                <li>No saved listing history</li>
              </ul>
            </div>
            <div style={{background:'#f0fdf8',borderRadius:'12px',padding:'1.5rem',border:'1px solid #bbf0d9'}}>
              <p style={{fontWeight:'600',marginBottom:'1rem',color:'#1D9E75'}}>✅ Listing Whisperer</p>
              <ul style={{fontSize:'14px',color:'#333',lineHeight:'2',paddingLeft:'1rem'}}>
                <li>Built-in real estate workflow</li>
                <li>11 formats in one click</li>
                <li>Seller meeting prep</li>
                <li>On-site photo drafts</li>
                <li>Tone & buyer targeting</li>
                <li>Saved listing history</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'4rem 2rem',maxWidth:'700px',margin:'0 auto',textAlign:'center'}}>
        <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Simple, flexible pricing</h2>
        <p style={{color:'#666',marginBottom:'0.5rem'}}>Only have one listing this month? Pay $9. Use it often? Go Pro.</p>
        <p style={{color:'#999',fontSize:'13px',marginBottom:'3rem'}}>No credit card required to start free.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'1.5rem'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'1px solid #eee',textAlign:'left'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Free</h3>
            <p style={{color:'#666',fontSize:'13px',marginBottom:'1rem'}}>Try it out</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'1.5rem'}}>$0</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 2 free listings</li>
              <li>✅ 3 free rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ No credit card required</li>
            </ul>
            <a href="/signup" onClick={() => trackCTAClick('pricing_free_cta', 'homepage')} style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',border:'1px solid #ddd',color:'#333',textDecoration:'none',fontSize:'14px'}}>Get started free</a>
          </div>
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'2px solid #1D9E75',textAlign:'left',position:'relative'}}>
            <div style={{position:'absolute',top:'-12px',left:'50%',transform:'translateX(-50%)',background:'#1D9E75',color:'#fff',fontSize:'11px',fontWeight:'700',padding:'3px 12px',borderRadius:'20px',whiteSpace:'nowrap'}}>
              MOST POPULAR
            </div>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Pay Per Listing</h3>
            <p style={{color:'#666',fontSize:'13px',marginBottom:'1rem'}}>No subscription. No commitment.</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px'}}>$9<span style={{fontSize:'16px',fontWeight:'400'}}>/listing</span></p>
            <p style={{fontSize:'12px',color:'#999',marginBottom:'1.5rem'}}>No subscription needed</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 1 full listing generation</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ Saved to your history</li>
              <li>✅ Never expires</li>
            </ul>
            <a href="/pricing" onClick={() => trackCTAClick('pricing_ppl_cta', 'homepage')} style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',background:'#1D9E75',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>Buy 1 Listing — $9</a>
          </div>
          <div style={{background:'#1D9E75',borderRadius:'16px',padding:'2rem',textAlign:'left',color:'#fff'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Pro</h3>
            <p style={{color:'#a8f0d4',fontSize:'13px',marginBottom:'1rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px'}}>$29<span style={{fontSize:'16px',fontWeight:'400'}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#a8f0d4',marginBottom:'1.5rem'}}>Best value for 4+ listings/month</p>
            <ul style={{fontSize:'14px',color:'#e0f7ee',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ Unlimited rewrites</li>
              <li>✅ All 11 copy formats</li>
              <li>✅ Seller Meeting Prep</li>
              <li>✅ Snap & Start on-site</li>
              <li>✅ 7-Day Launch Kit</li>
              <li>✅ Brand voice memory</li>
              <li>✅ Priority support</li>
            </ul>
            <a href="/signup" onClick={() => trackCTAClick('pricing_pro_cta', 'homepage')} style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',background:'#fff',color:'#1D9E75',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>Start free trial</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'3rem'}}>Frequently asked questions</h2>
          {[
            {q:'Is this really free to start?',a:'Yes. You get 2 full listings and 3 listing rewrites completely free, no credit card required. Each listing generates all 11 formats.'},
            {q:'What formats does it generate?',a:'MLS standard, Luxury MLS, Instagram captions, Facebook post, Email blast, Open house announcement, Video script, SMS, Flyer, Price Drop, and SEO copy — all from one set of notes.'},
            {q:'What is Seller Meeting Prep?',a:'Before your listing appointment, Listing Whisperer generates a complete meeting outline, talking points, questions to ask the seller, and a follow-up email — so you walk in fully prepared.'},
            {q:'What is Snap & Start?',a:'On your phone or tablet, upload property photos on-site. Our AI detects visible features, you confirm the details, and generate your first draft before you leave the property.'},
            {q:'How is this different from generic AI tools?',a:'Listing Whisperer is purpose-built for real estate agents. It covers the entire listing workflow — from seller prep to on-site drafts to full marketing launch — not just copy generation.'},
            {q:'Can I cancel anytime?',a:'Yes. No contracts, no commitments. Cancel your Pro subscription anytime from your account settings.'},
            {q:'How good is the copy quality?',a:'The copy is generated by Claude, one of the most advanced AI models available, trained to produce MLS-ready professional marketing copy.'},
          ].map(({q,a}) => (
            <div key={q} style={{borderBottom:'1px solid #eee',paddingBottom:'1.5rem',marginBottom:'1.5rem'}}>
              <p style={{fontWeight:'600',fontSize:'15px',marginBottom:'8px'}}>{q}</p>
              <p style={{fontSize:'14px',color:'#666',lineHeight:'1.8'}}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'2rem',textAlign:'center',borderTop:'1px solid #eee',background:'#fff'}}>
        <div style={{fontSize:'16px',fontWeight:'600',marginBottom:'8px'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <p style={{fontSize:'13px',color:'#999',marginBottom:'8px'}}>The AI assistant for real estate agents. Before the appointment, on-site, and at launch.</p>
        <p style={{fontSize:'13px',color:'#999'}}>© 2025 Listing Whisperer · <a href="/login" style={{color:'#999'}}>Sign In</a> · <a href="/signup" style={{color:'#999'}}>Get Started Free</a> · <a href="#pricing" style={{color:'#999'}}>Pricing</a></p>
      </footer>

    </main>
  )
}