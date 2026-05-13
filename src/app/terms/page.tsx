'use client'
import { useState } from 'react'

export default function TermsOfService() {
  const [activeSection, setActiveSection] = useState('acceptance')

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'description', title: '2. Description of Service' },
    { id: 'accounts', title: '3. Accounts & Registration' },
    { id: 'trial', title: '4. Free Trial' },
    { id: 'billing', title: '5. Subscriptions & Billing' },
    { id: 'use', title: '6. Acceptable Use' },
    { id: 'ip', title: '7. Intellectual Property' },
    { id: 'virtual-staging-terms', title: '8. Virtual Staging & AI Images' },
    { id: 'ai', title: '9. AI-Generated Content' },
    { id: 'privacy', title: '10. Privacy' },
    { id: 'disclaimer', title: '11. Disclaimers' },
    { id: 'liability', title: '12. Limitation of Liability' },
    { id: 'termination', title: '13. Termination' },
    { id: 'governing', title: '14. Governing Law' },
    { id: 'contact', title: '15. Contact' },
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
            <h1 style={{fontSize:'2rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 8px',letterSpacing:'-0.3px'}}>Terms of Service</h1>
            <p style={{fontSize:'13px',color:'#5a5f72',margin:'0'}}>Last updated: May 13, 2026</p>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'2rem'}}>

            <div id="acceptance" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>1. Acceptance of Terms</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                By accessing or using Listing Whisperer ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all users of the Service, including visitors, free trial users, and paid subscribers. We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </div>

            <div id="description" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>2. Description of Service</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Listing Whisperer is an AI-powered assistant built for real estate agents. The Service generates marketing copy, listing descriptions, seller meeting prep materials, pricing strategies, and other real estate workflow tools. The Service is intended for professional use by licensed real estate agents, brokers, and related real estate professionals. You are responsible for ensuring that any content generated through the Service complies with applicable real estate laws, MLS rules, and professional standards in your jurisdiction.
              </p>
            </div>

            <div id="accounts" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>3. Accounts & Registration</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>
                To access the full features of the Service, you must create an account. You agree to:
              </p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activity that occurs under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'12px 0 0'}}>
                You must be at least 18 years old to use the Service. We reserve the right to suspend or terminate accounts that violate these Terms.
              </p>
            </div>

            <div id="trial" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>4. Free Trial</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                We offer a 24-hour free trial that includes full Pro access and up to 2 listings at no charge. No credit card is required to start your trial. The free trial is available once per person and once per household. Creating multiple accounts to obtain additional free trials is prohibited and may result in account termination. After your trial expires, continued use of Pro features requires a paid subscription.
              </p>
            </div>

            <div id="billing" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>5. Subscriptions & Billing</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>
                Pro subscriptions are billed at $20 per month. Subscriptions automatically renew each month unless cancelled prior to the renewal date. By subscribing, you authorize us to charge your payment method on a recurring monthly basis.
              </p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0 0 12px'}}>
                <li>You may cancel your subscription at any time from your account settings</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds are provided for partial months</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Virtual Staging credits are available as one-time purchase add-ons (5, 15, or 30 credits). Pro subscribers receive 3 free staging credits per month, which reset on the 1st of each month and do not roll over. Purchased credit packs do not expire and are non-refundable.
              </p>
            </div>

            <div id="use" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>6. Acceptable Use</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>You agree not to use the Service to:</p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>Violate any applicable laws or regulations</li>
                <li>Generate false, misleading, or fraudulent real estate listings</li>
                <li>Infringe upon the intellectual property rights of others</li>
                <li>Attempt to reverse engineer or extract the underlying AI models</li>
                <li>Resell or redistribute the Service without written permission</li>
                <li>Use automated scripts to access the Service in an abusive manner</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </div>

            <div id="ip" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>7. Intellectual Property</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                The Listing Whisperer platform, including its design, code, branding, and non-AI-generated content, is owned by Listing Whisperer and protected by copyright and trademark laws. You retain ownership of the property information and content you input into the Service. AI-generated outputs produced through your use of the Service may be used by you for your professional real estate activities. You may not claim ownership of the underlying AI model or the Service platform itself.
              </p>
            </div>

            <div id="virtual-staging-terms" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>8. Virtual Staging & AI-Generated Images</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0 0 12px'}}>
                Virtual Staging is an AI-powered feature that uses Decor8 AI's API to generate furnished room images from photos you upload. By using Virtual Staging, you agree that:
              </p>
              <ul style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'1.5rem',margin:'0'}}>
                <li>You are responsible for ensuring all virtually staged images are properly disclosed when used in MLS listings, marketing materials, or client-facing content, in accordance with your local MLS rules, NAR guidelines, and applicable laws.</li>
                <li>Photos you upload are processed by Decor8 AI (a third-party provider). Their privacy policy governs how they handle uploaded images.</li>
                <li>Virtual Staging credits are non-refundable once used.</li>
                <li>Listing Whisperer is not responsible for MLS violations or compliance issues arising from your use of virtually staged images.</li>
                <li>You must not use virtually staged images to misrepresent a property's actual condition, remove structural defects, or deceive buyers.</li>
              </ul>
            </div>

            <div id="ai" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>9. AI-Generated Content</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                The Service uses AI to generate marketing copy, pricing guidance, and other real estate content. You acknowledge that: AI-generated content may contain errors, inaccuracies, or omissions; all content should be reviewed and verified before professional use; pricing suggestions are not certified appraisals and should not be relied upon as such; the Service does not replace the judgment of a licensed real estate professional. Listing Whisperer is not responsible for any decisions made based on AI-generated content.
              </p>
            </div>

            <div id="privacy" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>10. Privacy</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                Your use of the Service is also governed by our <a href="/privacy" style={{color:'#1D9E75'}}>Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.
              </p>
            </div>

            <div id="disclaimer" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>11. Disclaimers</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. LISTING WHISPERER DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY AI-GENERATED CONTENT. YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK.
              </p>
            </div>

            <div id="liability" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>12. Limitation of Liability</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LISTING WHISPERER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </div>

            <div id="termination" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>13. Termination</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                We reserve the right to suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or any other reason at our sole discretion. You may terminate your account at any time by contacting us. Upon termination, your right to use the Service ceases immediately. Provisions of these Terms that by their nature should survive termination shall survive, including intellectual property provisions, disclaimers, and limitations of liability.
              </p>
            </div>

            <div id="governing" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 12px'}}>14. Governing Law</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the state or federal courts located in Orange County, California. You consent to the personal jurisdiction of such courts.
              </p>
            </div>

            <div id="contact" style={{...styles.card}}>
              <h2 style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75',margin:'0 0 14px'}}>15. Contact</h2>
              <p style={{fontSize:'14px',color:'#8b8fa8',lineHeight:'1.8',margin:'0'}}>
                If you have any questions about these Terms, please contact us at:<br/><br/>
                <strong style={{color:'#f0f0f0'}}>Listing Whisperer</strong><br/>
                <a href="mailto:support@listingwhisperer.com" style={{color:'#1D9E75'}}>support@listingwhisperer.com</a><br/>
                <a href="/contact" style={{color:'#1D9E75'}}>listingwhisperer.com/contact</a>
              </p>
            </div>

          </div>

          <div style={{marginTop:'2rem',padding:'1.5rem',background:'rgba(29,158,117,0.06)',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)',textAlign:'center'}}>
            <p style={{fontSize:'13px',color:'#5a5f72',margin:'0 0 12px'}}>Ready to get started?</p>
            <a href="/signup" style={{display:'inline-block',padding:'10px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'8px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>
              Start Free Trial →
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
