'use client'
import { useState } from 'react'

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    items: [
      {
        q: 'What is Listing Whisperer?',
        a: 'An AI assistant built for real estate agents. It turns your listing details into full marketing campaigns — MLS descriptions, social posts, emails, open house content, follow-ups, and more.',
      },
      {
        q: 'Who is it for?',
        a: 'Licensed real estate agents and brokers who want to save time on marketing and focus on closing deals.',
      },
      {
        q: 'Do I need technical skills?',
        a: 'No. If you can fill out a form, you can use Listing Whisperer.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. 24 hours of full Pro access, no credit card required.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing & Billing',
    icon: '💳',
    items: [
      {
        q: 'How much does Pro cost?',
        a: '$20/month. Cancel anytime.',
      },
      {
        q: 'Is there a discount?',
        a: 'Yes. Use code WELCOME50 for 50% off your first month.',
      },
      {
        q: 'Do you offer refunds?',
        a: "We don't offer refunds for partial months, but you can cancel anytime.",
      },
      {
        q: 'What payment methods do you accept?',
        a: 'All major credit and debit cards via Stripe.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. Cancel from your account settings. Access continues until end of billing period.',
      },
    ],
  },
  {
    id: 'tools',
    title: 'AI Tools & Features',
    icon: '🤖',
    items: [
      {
        q: 'What does the listing generator create?',
        a: '11 formats: MLS description, luxury MLS version, Instagram caption, Facebook post, email blast, open house announcement, video script, SEO copy, SMS text, flyer copy, and price drop announcement.',
      },
      {
        q: 'What is Virtual Staging?',
        a: 'Upload an empty room photo, choose a style, and get a professionally staged version in seconds. Pro includes 3 per month.',
      },
      {
        q: 'What is Call Capture?',
        a: 'Record a client call, upload it, and get a structured lead summary with key details extracted automatically. Pro only.',
      },
      {
        q: 'What is Brand Voice?',
        a: 'Set your name, brokerage, tone, and style preferences once. Every tool output sounds like you.',
      },
      {
        q: 'Does the AI know real estate?',
        a: 'Yes. Every tool is pre-configured for real estate workflows — MLS language, disclosure awareness, buyer psychology, and agent-specific copy.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Data & Privacy',
    icon: '🔒',
    items: [
      {
        q: 'Is my data private?',
        a: 'Yes. We never sell your data. Property details are used only to generate your content.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Securely in Supabase with encryption at rest and in transit.',
      },
      {
        q: 'Who can see my listings?',
        a: 'Only you. Your data is private to your account.',
      },
      {
        q: 'Are my uploaded photos stored?',
        a: 'Photos uploaded for Virtual Staging are processed by Decor8 AI and not permanently stored on our servers.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes. Email support@listingwhisperer.com and we\'ll delete your account and data.',
      },
    ],
  },
  {
    id: 'virtual-staging',
    title: 'Virtual Staging',
    icon: '🛋️',
    items: [
      {
        q: 'What rooms can I stage?',
        a: 'Living room, bedroom, dining room, kitchen, bathroom, home office, and kids room.',
      },
      {
        q: 'How many styles are available?',
        a: '9 styles: Modern, Scandinavian, Industrial, Bohemian, Coastal, Farmhouse, Luxury, Minimalist, Mid-Century.',
      },
      {
        q: 'Do I need to disclose virtually staged images?',
        a: 'Yes. MLS rules and NAR guidelines require disclosure when using virtually staged images in listings. Always label staged photos and check your local MLS rules.',
      },
      {
        q: 'How many stagings do I get per month?',
        a: 'Pro includes 3 free stagings per month, resetting on the 1st. Additional credits are available as add-ons.',
      },
      {
        q: 'Can I buy more staging credits?',
        a: 'Yes. Buy packs of 5 ($9), 15 ($24), or 30 ($44) from the Virtual Staging page.',
      },
    ],
  },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{width:'100%',textAlign:'left',padding:'1rem 0',background:'none',border:'none',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'12px',fontFamily:"var(--font-plus-jakarta), sans-serif"}}
      >
        <span style={{fontSize:'14px',fontWeight:'600',color:'#f0f0f0',lineHeight:'1.5'}}>{q}</span>
        <span style={{fontSize:'18px',color:'#1D9E75',flexShrink:0,transition:'transform 0.2s',transform:open?'rotate(45deg)':'rotate(0deg)'}}>+</span>
      </button>
      {open && (
        <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 1rem',paddingRight:'2rem'}}>{a}</p>
      )}
    </div>
  )
}

export default function FAQPage() {
  const styles = {
    page: { minHeight: '100vh', background: '#0d1117', fontFamily: "var(--font-plus-jakarta), sans-serif", color: '#f0f0f0' },
    card: { background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' },
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={{background:'rgba(10,13,20,0.98)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0.875rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
        <a href="/" style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0',textDecoration:'none'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
        </a>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/pricing" style={{fontSize:'13px',color:'#5a5f72',textDecoration:'none'}}>Pricing</a>
          <a href="/dashboard" style={{fontSize:'13px',color:'#5a5f72',textDecoration:'none'}}>Dashboard →</a>
        </div>
      </div>

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'3rem 1.5rem 5rem'}}>

        {/* HERO */}
        <div style={{textAlign:'center',marginBottom:'3rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>FAQ</p>
          <h1 style={{fontSize:'2rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 12px',letterSpacing:'-0.3px'}}>Frequently Asked Questions</h1>
          <p style={{fontSize:'15px',color:'#5a5f72',margin:'0'}}>Everything you need to know about Listing Whisperer</p>
        </div>

        {/* SECTIONS */}
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          {FAQ_SECTIONS.map(section => (
            <div key={section.id} id={section.id} style={{...styles.card}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.25rem'}}>
                <span style={{fontSize:'22px'}}>{section.icon}</span>
                <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0'}}>{section.title}</h2>
              </div>
              <div>
                {section.items.map(item => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{marginTop:'3rem',padding:'2rem',background:'rgba(29,158,117,0.06)',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.15)',textAlign:'center'}}>
          <p style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0',margin:'0 0 8px'}}>Still have questions?</p>
          <p style={{fontSize:'14px',color:'#5a5f72',margin:'0 0 1.25rem'}}>We're happy to help. Reach out anytime.</p>
          <a href="/contact" style={{display:'inline-block',padding:'11px 28px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'700',boxShadow:'0 4px 16px rgba(29,158,117,0.25)'}}>
            Contact Us →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{padding:'2rem',textAlign:'center',borderTop:'1px solid rgba(255,255,255,0.05)',marginTop:'2rem'}}>
        <p style={{fontSize:'13px',color:'#444'}}>
          © 2026 Listing Whisperer · <a href="/terms" style={{color:'#444'}}>Terms</a> · <a href="/privacy" style={{color:'#444'}}>Privacy</a> · <a href="/faq" style={{color:'#444'}}>FAQ</a> · <a href="/contact" style={{color:'#444'}}>Contact</a>
        </p>
      </footer>
    </div>
  )
}
