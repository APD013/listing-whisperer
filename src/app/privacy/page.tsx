'use client'
import { useState } from 'react'

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('overview')

  const sections = [
    { id: 'overview', title: '1. Overview' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'use', title: '3. How We Use Your Information' },
    { id: 'sharing', title: '4. Information Sharing' },
    { id: 'storage', title: '5. Data Storage & Security' },
    { id: 'cookies', title: '6. Cookies & Analytics' },
    { id: 'ai', title: '7. AI & Your Data' },
    { id: 'rights', title: '8. Your Rights' },
    { id: 'children', title: '9. Children\'s Privacy' },
    { id: 'changes', title: '10. Changes to This Policy' },
    { id: 'contact', title: '11. Contact Us' },
  ]

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
        <a href="/dashboard" style={{fontSize:'13px',color:'#5a5f72',textDecoration:'none'}}>Dashboard →</a>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'3rem 1.5rem',display:'flex',gap:'2rem',alignItems:'flex-start'}}>

        {/* SIDEBAR */}
        <div style={{width:'220px',flexShrink:0,position:'sticky',top:'80px'}}>
          <div style={{...styles.card,padding:'1rem'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 12px'}}>CONTENTS</p>
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`}
                onClick={() => setActiveSection(s.id)}
                style={{display:'block',padding:'6px 8px',borderRadius:'6px',fontSize:'12px',textDecoration:'none',marginBottom:'2px',
                  background: activeSection === s.id ? 'rgba(29,158,117,0.1)' : 'transparent',
                  color: activeSection === s.id ? '#1D9E75' : '#5a5f72',
                  borderLeft: activeSection === s.id ? '2px solid #1D9E75' : '2px solid transparent'}}>
                {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{flex:1}}>
          <div style={{marginBottom:'2rem'}}>
            <h1 style={{fontSize:'2rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 8px',letterSpacing:'-0.3px'}}>Privacy Policy</h1>
            <p style={{fontSize:'13px',color:'#5a5f72',margin:'0'}}>Last updated: May 13, 2026</p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>

            <div id="overview" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>1. Overview</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Listing Whisperer ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our AI assistant platform for real estate agents. By using Listing Whisperer, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            <div id="collection" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>2. Information We Collect</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>We collect the following types of information:</p>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#d0d0d0',margin:'0 0 6px'}}>Account Information</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0 0 12px'}}>
                <li>Name and email address</li>
                <li>Password (stored encrypted)</li>
                <li>Billing information (processed securely by Stripe)</li>
                <li>Account preferences and brand voice settings</li>
              </ul>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#d0d0d0',margin:'0 0 6px'}}>Usage Information</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0 0 12px'}}>
                <li>Property details you enter to generate listings</li>
                <li>Generated listing content and marketing materials</li>
                <li>Tool usage patterns and feature interactions</li>
                <li>Listing history and saved content</li>
              </ul>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#d0d0d0',margin:'0 0 6px'}}>Technical Information</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Pages visited and time spent on the platform</li>
                <li>Referral sources</li>
              </ul>
            </div>

            <div id="use" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>3. How We Use Your Information</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>We use your information to:</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>Provide and improve the Listing Whisperer service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Generate AI-powered marketing content based on your inputs</li>
                <li>Send account-related emails and reminders you set</li>
                <li>Analyze usage patterns to improve the platform</li>
                <li>Respond to support requests and inquiries</li>
                <li>Prevent fraud and enforce our Terms of Service</li>
              </ul>
            </div>

            <div id="sharing" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>4. Information Sharing</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>
                We do not sell your personal information. We may share your information with:
              </p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li><strong style={{color:'#d0d0d0'}}>Stripe</strong> — for payment processing</li>
                <li><strong style={{color:'#d0d0d0'}}>Supabase</strong> — for secure database storage</li>
                <li><strong style={{color:'#d0d0d0'}}>Anthropic</strong> — your property inputs are sent to generate AI content</li>
                <li><strong style={{color:'#d0d0d0'}}>Decor8 AI</strong> — when you use the Virtual Staging feature, photos you upload are sent to Decor8 AI for processing. Decor8 AI's privacy policy governs how they handle your images.</li>
                <li><strong style={{color:'#d0d0d0'}}>OpenAI</strong> — audio recordings from Call Capture are sent to OpenAI's Whisper API for transcription.</li>
                <li><strong style={{color:'#d0d0d0'}}>Resend</strong> — for transactional email delivery</li>
                <li><strong style={{color:'#d0d0d0'}}>Vercel</strong> — for platform hosting and analytics</li>
                <li><strong style={{color:'#d0d0d0'}}>Law enforcement</strong> — when required by law</li>
              </ul>
            </div>

            <div id="storage" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>5. Data Storage & Security</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Your data is stored securely using Supabase, which provides enterprise-grade security including encryption at rest and in transit. We implement row-level security to ensure your data is only accessible to you. Passwords are stored using industry-standard hashing. While we take reasonable precautions to protect your data, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account.
              </p>
            </div>

            <div id="cookies" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>6. Cookies & Analytics</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                We use Google Analytics 4 to understand how users interact with our platform. This includes page views, feature usage, and conversion events. Analytics data is anonymized and aggregated. We use session cookies to maintain your login state. We do not use advertising cookies or sell your browsing data to advertisers. You can opt out of Google Analytics by using the Google Analytics Opt-out Browser Add-on.
              </p>
            </div>

            <div id="ai" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>7. AI & Your Data</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                When you generate content using Listing Whisperer, your property details and inputs are sent to Anthropic's API to generate AI responses. Anthropic's privacy policy governs how they handle this data. We do not use your listing data to train our own AI models. Generated content is stored in your account history for your convenience and can be deleted at any time from your account settings.
              </p>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#d0d0d0',margin:'12px 0 6px'}}>Virtual Staging</p>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>
                When you use Virtual Staging, the photos you upload are transmitted to Decor8 AI's servers for processing. We do not store your uploaded photos beyond what is needed to generate the staged image. Generated staged images are stored in your account for download. We recommend you do not upload photos containing identifiable personal information.
              </p>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#d0d0d0',margin:'0 0 6px'}}>Call Capture</p>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Audio recordings are sent to OpenAI's Whisper API for transcription. Recordings are not stored on our servers after transcription is complete.
              </p>
            </div>

            <div id="rights" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>8. Your Rights</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>You have the right to:</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Export your listing history and generated content</li>
                <li>Opt out of non-essential communications</li>
                <li>Lodge a complaint with your local data protection authority</li>
              </ul>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'12px 0 0'}}>
                To exercise any of these rights, contact us at <a href="mailto:support@listingwhisperer.com" style={{color:'#1D9E75'}}>support@listingwhisperer.com</a>.
              </p>
            </div>

            <div id="children" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>9. Children's Privacy</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Listing Whisperer is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately and we will take steps to delete that information.
              </p>
            </div>

            <div id="changes" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>10. Changes to This Policy</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our platform. The "Last updated" date at the top of this page reflects the most recent revision. Your continued use of Listing Whisperer after changes are posted constitutes your acceptance of the updated policy.
              </p>
            </div>

            <div id="contact" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>11. Contact Us</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                If you have any questions about this Privacy Policy or how we handle your data, please contact us:<br/><br/>
                <strong style={{color:'#f0f0f0'}}>Listing Whisperer</strong><br/>
                <a href="mailto:support@listingwhisperer.com" style={{color:'#1D9E75'}}>support@listingwhisperer.com</a><br/>
                <a href="/contact" style={{color:'#1D9E75'}}>listingwhisperer.com/contact</a>
              </p>
            </div>

          </div>

          <div style={{marginTop:'2rem',padding:'1.5rem',background:'rgba(29,158,117,0.06)',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#5a5f72',margin:'0 0 12px'}}>Have questions? We're here to help.</p>
            <a href="/contact" style={{display:'inline-block',padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'8px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>
              Contact Us →
            </a>
          </div>
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