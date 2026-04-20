

export default function Home() {
  return (
    <main style={{fontFamily:'sans-serif',color:'#111'}}>

      {/* NAV */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 2rem',borderBottom:'1px solid #eee',background:'#fff',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'18px',fontWeight:'600'}}>Listing<span style={{color:'#1D9E75'}}>Whisperer</span></div>
        <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
          <a href="#how-it-works" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>How It Works</a>
          <a href="#examples" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Examples</a>
          <a href="#pricing" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Pricing</a>
          <a href="/login" style={{fontSize:'14px',color:'#555',textDecoration:'none'}}>Sign In</a>
          <a href="/signup" style={{fontSize:'14px',background:'#1D9E75',color:'#fff',padding:'8px 18px',borderRadius:'8px',textDecoration:'none',fontWeight:'500'}}>Get Started Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{textAlign:'center',padding:'5rem 2rem 3rem',background:'linear-gradient(180deg,#f0fdf8 0%,#fff 100%)'}}>
        <div style={{display:'inline-block',background:'#E1F5EE',color:'#085041',fontSize:'12px',fontWeight:'600',padding:'4px 12px',borderRadius:'20px',marginBottom:'1.5rem',letterSpacing:'0.5px'}}>
          BUILT FOR REAL ESTATE AGENTS
        </div>
        <h1 style={{fontSize:'3rem',fontWeight:'700',lineHeight:'1.2',maxWidth:'700px',margin:'0 auto 1.5rem'}}>
          Turn rough listing notes into MLS copy, social posts, and email blasts —{' '}
          <span style={{color:'#1D9E75'}}>in under 60 seconds.</span>
        </h1>
        <p style={{fontSize:'1.125rem',color:'#555',maxWidth:'520px',margin:'0 auto 2rem',lineHeight:'1.7'}}>
          No prompts. No ChatGPT guesswork. Just fill in your property details and get 8 ready-to-use marketing formats instantly.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap',marginBottom:'1rem'}}>
          <a href="/signup" style={{background:'#1D9E75',color:'#fff',padding:'14px 32px',borderRadius:'8px',textDecoration:'none',fontWeight:'600',fontSize:'16px'}}>
            Try 3 Free Listings
          </a>
          <a href="#examples" style={{background:'#fff',color:'#111',padding:'14px 32px',borderRadius:'8px',textDecoration:'none',fontWeight:'500',fontSize:'16px',border:'1px solid #ddd'}}>
            See Real Outputs
          </a>
        </div>
        <p style={{fontSize:'13px',color:'#999'}}>No credit card required · Cancel anytime · Built specifically for real estate agents</p>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section style={{background:'#1D9E75',padding:'1rem 2rem'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',display:'flex',justifyContent:'center',gap:'3rem',flexWrap:'wrap'}}>
          {['8 copy formats in one click','MLS-ready formatting','Tone & buyer targeting','Saves listing history'].map(item => (
            <span key={item} style={{color:'#fff',fontSize:'14px',fontWeight:'500'}}>✓ {item}</span>
          ))}
        </div>
      </section>

      {/* BEFORE/AFTER */}
      <section style={{padding:'4rem 2rem',maxWidth:'900px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>From messy notes to polished copy</h2>
        <p style={{textAlign:'center',color:'#666',marginBottom:'3rem'}}>Just fill in the details — we handle the writing.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'1rem',alignItems:'center'}}>
          <div style={{background:'#fff8f0',border:'1px solid #fde8c8',borderRadius:'12px',padding:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#999',marginBottom:'8px',letterSpacing:'1px'}}>YOUR ROUGH NOTES</p>
            <p style={{fontSize:'14px',color:'#555',lineHeight:'1.8',fontStyle:'italic'}}>
              "4bd 3ba NB, 2200sf, ocean views, chefs kitchen quartz, spa bath, 3 car garage, solar, smart home, top schools, $1.295m"
            </p>
          </div>
          <div style={{fontSize:'2rem',color:'#1D9E75',fontWeight:'bold',textAlign:'center'}}>→</div>
          <div style={{background:'#f0fdf8',border:'1px solid #bbf0d9',borderRadius:'12px',padding:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',marginBottom:'8px',letterSpacing:'1px'}}>8 READY-TO-USE FORMATS</p>
            <p style={{fontSize:'13px',color:'#333',lineHeight:'1.8'}}>✅ MLS Description<br/>✅ Luxury MLS<br/>✅ Instagram Caption<br/>✅ Facebook Post<br/>✅ Email Blast<br/>✅ Open House Flyer<br/>✅ Video Script<br/>✅ SEO Copy</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'800px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>How it works</h2>
          <p style={{color:'#666',marginBottom:'3rem'}}>Three steps. Under 60 seconds.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'2rem'}}>
            {[
              {step:'1',title:'Enter your property details',desc:'Fill in the basics — type, beds, price, neighborhood, features, tone, and target buyer.'},
              {step:'2',title:'Click Generate',desc:'Our AI writes 8 formats of marketing copy tailored to your property in seconds.'},
              {step:'3',title:'Copy, paste, done',desc:'Grab the MLS copy, Instagram caption, email blast, and more — all ready to use.'},
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

      {/* SAMPLE OUTPUTS */}
      <section id="examples" style={{padding:'4rem 2rem',maxWidth:'800px',margin:'0 auto'}}>
        <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>See real outputs</h2>
        <p style={{textAlign:'center',color:'#666',marginBottom:'2rem'}}>One set of notes. Three formats. Ready to use.</p>
        <SampleOutputs />
      </section>

      {/* TESTIMONIAL */}
      <section style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'700px',margin:'0 auto',textAlign:'center'}}>
          <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'3rem'}}>Built specifically for real estate agents</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.5rem'}}>
            {[
              {quote:'"I used to spend 30 minutes per listing writing copy. Now it takes me 60 seconds."',name:'Sarah M.',role:'Realtor, Orange County'},
              {quote:'"The Instagram captions alone are worth it. My engagement doubled since I started using this."',name:'James T.',role:'Real Estate Agent, LA'},
              {quote:'"Finally a tool built for agents, not generic AI. The MLS formatting is spot on."',name:'Lisa R.',role:'Broker, San Diego'},
            ].map(({quote,name,role}) => (
              <div key={name} style={{background:'#fff',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee',textAlign:'left'}}>
                <p style={{fontSize:'14px',color:'#333',lineHeight:'1.8',marginBottom:'1rem',fontStyle:'italic'}}>{quote}</p>
                <p style={{fontSize:'13px',fontWeight:'600',margin:'0'}}>{name}</p>
                <p style={{fontSize:'12px',color:'#999',margin:'0'}}>{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY NOT CHATGPT */}
      <section style={{padding:'4rem 2rem'}}>
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
                <li>8 formats in one click</li>
                <li>Tone & buyer targeting</li>
                <li>MLS-ready formatting</li>
                <li>Saved listing history</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:'4rem 2rem',maxWidth:'700px',margin:'0 auto',textAlign:'center'}}>
        <h2 style={{fontSize:'1.75rem',fontWeight:'600',marginBottom:'0.5rem'}}>Simple pricing</h2>
        <p style={{color:'#666',marginBottom:'1rem'}}>One listing can take 20–30 minutes to write manually. Listing Whisperer cuts that to seconds.</p>
        <p style={{color:'#999',fontSize:'13px',marginBottom:'3rem'}}>No credit card required to start.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'2rem',border:'1px solid #eee',textAlign:'left'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Free</h3>
            <p style={{color:'#666',fontSize:'13px',marginBottom:'1rem'}}>Perfect for trying it out</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'1.5rem'}}>$0</p>
            <ul style={{fontSize:'14px',color:'#555',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ 3 free listings</li>
              <li>✅ All 8 copy formats</li>
              <li>✅ MLS, Instagram, Email & more</li>
              <li>✅ No credit card required</li>
            </ul>
            <a href="/signup" style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',border:'1px solid #ddd',color:'#333',textDecoration:'none',fontSize:'14px'}}>Get started free</a>
          </div>
          <div style={{background:'#1D9E75',borderRadius:'16px',padding:'2rem',textAlign:'left',color:'#fff'}}>
            <h3 style={{fontSize:'20px',fontWeight:'600',marginBottom:'4px'}}>Pro</h3>
            <p style={{color:'#a8f0d4',fontSize:'13px',marginBottom:'1rem'}}>For active agents</p>
            <p style={{fontSize:'2.5rem',fontWeight:'700',marginBottom:'4px'}}>$29<span style={{fontSize:'16px',fontWeight:'400'}}>/mo</span></p>
            <p style={{fontSize:'12px',color:'#a8f0d4',marginBottom:'1.5rem'}}>Less than the cost of one hour of your time</p>
            <ul style={{fontSize:'14px',color:'#e0f7ee',lineHeight:'2.2',paddingLeft:'0',listStyle:'none',marginBottom:'1.5rem'}}>
              <li>✅ Unlimited listings</li>
              <li>✅ All 8 copy formats</li>
              <li>✅ Saved listing history</li>
              <li>✅ Email copy to yourself</li>
              <li>✅ Real estate-specific workflow</li>
              <li>✅ Priority support</li>
            </ul>
            <a href="/signup" style={{display:'block',textAlign:'center',padding:'10px',borderRadius:'8px',background:'#fff',color:'#1D9E75',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>Start free trial</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{padding:'4rem 2rem',background:'#f9fafb'}}>
        <div style={{maxWidth:'600px',margin:'0 auto'}}>
          <h2 style={{textAlign:'center',fontSize:'1.75rem',fontWeight:'600',marginBottom:'3rem'}}>Frequently asked questions</h2>
          {[
            {q:'Is this really free to start?',a:'Yes. You get 3 full listings completely free, no credit card required. Each listing generates all 8 formats.'},
            {q:'What formats does it generate?',a:'MLS standard, Luxury MLS, Instagram captions, Facebook post, Email blast, Open house announcement, Video script, and SEO copy — all from one set of notes.'},
            {q:'How is this different from ChatGPT?',a:'Listing Whisperer is purpose-built for real estate agents. It has a structured workflow, tone targeting, buyer targeting, MLS-ready formatting, and saves your listing history — no prompt engineering required.'},
            {q:'Can I cancel anytime?',a:'Yes. No contracts, no commitments. Cancel your Pro subscription anytime from your account settings.'},
            {q:'Who is this built for?',a:'Real estate agents who want to spend less time writing and more time selling. Whether you do 2 listings a month or 20, Listing Whisperer saves you hours.'},
            {q:'How good is the copy quality?',a:'The copy is generated by Claude, one of the most advanced AI models available. It is trained to produce MLS-ready, professional marketing copy — not generic AI filler.'},
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
        <p style={{fontSize:'13px',color:'#999',marginBottom:'8px'}}>Built for real estate agents. Not generic AI.</p>
        <p style={{fontSize:'13px',color:'#999'}}>© 2025 Listing Whisperer · <a href="/login" style={{color:'#999'}}>Sign In</a> · <a href="/signup" style={{color:'#999'}}>Get Started Free</a> · <a href="#pricing" style={{color:'#999'}}>Pricing</a></p>
      </footer>

    </main>
  )
}