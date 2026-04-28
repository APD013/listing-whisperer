'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { trackDashboardView, trackListingCreated, trackOutputCopied, trackUpgradeClick } from '../lib/analytics'
import jsPDF from 'jspdf'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [listingsUsed, setListingsUsed] = useState(0)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [listingCredits, setListingCredits] = useState(0)
  const [outputs, setOutputs] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pastListings, setPastListings] = useState<any[]>([])
  const [activePage, setActivePage] = useState('home')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [featuredKey, setFeaturedKey] = useState('mls_standard')
  const [userName, setUserName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [referralCopied, setReferralCopied] = useState(false)
  const [showReferralBanner, setShowReferralBanner] = useState(false)
  const [dueReminders, setDueReminders] = useState<any[]>([])
  const [showReminderPopup, setShowReminderPopup] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentListingId, setCurrentListingId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<{role:string,content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  const [form, setForm] = useState({
    type: 'Single family', beds: '', sqft: '', price: '',
    neighborhood: '', features: '', tone: 'Professional', buyer: 'Move-up families',
    notes: '', name: ''
  })

  const loadingSteps = [
    '🔍 Analyzing property details...',
    '✍️ Writing MLS description...',
    '📸 Crafting social media posts...',
    '📧 Composing email blast...',
    '📄 Building flyer copy...',
    '🎬 Writing video script...',
    '✨ Finalizing all 11 formats...',
  ]

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded')
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('listings_used, plan, listing_credits, brand_voice, full_name, referral_code')
        .eq('id', user.id)
        .single()
      if (profile) {
        setListingsUsed(profile.listings_used || 0)
        setPlan(profile.plan || 'starter')
        setListingCredits(profile.listing_credits || 0)
        setUserName(profile.full_name || '')
        setReferralCode(profile.referral_code || '')
        trackDashboardView(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            if (bv.preferredTone) setForm(prev => ({ ...prev, tone: bv.preferredTone }))
          } catch(e) {}
        }
      } else { setPlanLoaded(true) }
      const { data: listings } = await supabase
        .from('listings').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(10)
      if (listings) setPastListings(listings)
      if (upgraded) setPlan('pro')

      const checkReminders = async () => {
        const { data: reminders } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .eq('sent', false)
          .lte('remind_at', new Date().toISOString())
        if (reminders && reminders.length > 0) {
          setDueReminders(reminders)
          setShowReminderPopup(true)
        }
      }
      checkReminders()
    }
    getUser()
  }, [])

  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const interval = setInterval(() => {
      setLoadingStep(prev => prev < loadingSteps.length - 1 ? prev + 1 : prev)
    }, 2500)
    return () => clearInterval(interval)
  }, [loading])

  const generate = async () => {
    if (!form.features && !form.neighborhood) { alert('Please fill in at least the neighborhood and features!'); return }
    if (plan === 'starter' && listingsUsed >= 2 && listingCredits <= 0) { setShowUpgradeModal(true); return }
    setLoading(true)
    setOutputs(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form, userId })
      })
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') { setShowUpgradeModal(true); setLoading(false); return }
      if (data.outputs) {
        setOutputs(data.outputs)
        setListingsUsed(prev => prev + 1)
        trackListingCreated(plan, form.neighborhood)
        setActivePage('results')
        setShowReferralBanner(true)
        const { data: listings } = await supabase
          .from('listings').select('*').eq('user_id', userId)
          .order('created_at', { ascending: false }).limit(10)
        if (listings) {
          setPastListings(listings)
          if (listings[0]) setCurrentListingId(listings[0].id)
        }
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMessage = { role: 'user', content: chatInput }
    const updatedMessages = [...chatMessages, userMessage]
    setChatMessages(updatedMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      })
      const data = await res.json()
      if (data.message) {
        setChatMessages([...updatedMessages, { role: 'assistant', content: data.message }])
      }
    } catch(e: any) {
      setChatMessages([...updatedMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setChatLoading(false)
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
    trackOutputCopied(key, plan)
  }

  const handleShare = (platform: string, text: string) => {
    const encodedText = encodeURIComponent(text.substring(0, 500))
    const encodedUrl = encodeURIComponent('https://listingwhisperer.com')
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  const handleDownloadPdf = async (type: string) => {
    setGeneratingPdf(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const contentWidth = pageWidth - margin * 2
      let y = 20
      const addText = (text: string, x: number, yPos: number, options: any = {}) => { doc.text(text, x, yPos, options) }
      const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, lineHeight: number = 6) => {
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, yPos)
        return yPos + (lines.length * lineHeight)
      }
      const addSectionTitle = (title: string, yPos: number) => {
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
        addText(title.toUpperCase(), margin, yPos)
        doc.setDrawColor(29, 158, 117); doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2)
        return yPos + 8
      }
      const checkPageBreak = (yPos: number, needed: number = 30) => {
        if (yPos > 270 - needed) { doc.addPage(); return 20 }
        return yPos
      }
      if (type === 'mls') {
        doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
        addText('ListingWhisperer', margin, y)
        doc.setFontSize(18); doc.setTextColor(17, 17, 17); doc.setFont('helvetica', 'bold')
        addText(form.price || '', pageWidth - margin, y, { align: 'right' })
        y += 8; doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
        addText(form.neighborhood || '', pageWidth - margin, y, { align: 'right' })
        doc.setDrawColor(29, 158, 117); doc.setLineWidth(0.8); doc.line(margin, y + 4, pageWidth - margin, y + 4)
        y += 14; y = addSectionTitle('MLS Description', y)
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)
        y += 10; y = checkPageBreak(y); y = addSectionTitle('Luxury MLS', y)
        y = addWrappedText(outputs.mls_luxury || '', margin, y, contentWidth)
        y += 10; y = checkPageBreak(y); y = addSectionTitle('Email Blast', y)
        y = addWrappedText(outputs.email || '', margin, y, contentWidth)
        doc.setFontSize(9); doc.setTextColor(150, 150, 150)
        addText('Generated by ListingWhisperer.com', pageWidth / 2, 285, { align: 'center' })
        doc.save(`MLS-Sheet-${form.neighborhood || 'listing'}.pdf`)
      } else if (type === 'flyer') {
        doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(29, 158, 117)
        addText(form.price || '', pageWidth / 2, y + 10, { align: 'center' })
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 17, 17)
        addText(form.neighborhood || '', pageWidth / 2, y + 20, { align: 'center' })
        doc.setDrawColor(29, 158, 117); doc.setLineWidth(0.8); doc.line(margin, y + 32, pageWidth - margin, y + 32)
        y += 42; y = addSectionTitle('About This Home', y)
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)
        doc.save(`Flyer-${form.neighborhood || 'listing'}.pdf`)
      }
    } catch(e: any) { alert('PDF error: ' + e.message) }
    setGeneratingPdf(false)
  }

  const outputCards = [
    { key: 'mls_standard', label: 'MLS Description', icon: '🏠', color: '#1D9E75', social: false },
    { key: 'mls_luxury', label: 'Luxury MLS', icon: '✨', color: '#d4af37', social: false },
    { key: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c', social: true, platform: 'instagram' },
    { key: 'facebook', label: 'Facebook Post', icon: '👥', color: '#1877f2', social: true, platform: 'facebook' },
    { key: 'email', label: 'Email Blast', icon: '📧', color: '#6366f1', social: false },
    { key: 'openhouse', label: 'Open House', icon: '🚪', color: '#f59e0b', social: false },
    { key: 'video', label: 'Video Script', icon: '🎬', color: '#ef4444', social: false },
    { key: 'seo', label: 'SEO Copy', icon: '🔍', color: '#8b5cf6', social: false },
    { key: 'text_message', label: 'SMS / Text', icon: '📱', color: '#10b981', social: true, platform: 'twitter' },
    { key: 'flyer', label: 'Flyer Copy', icon: '📄', color: '#f97316', social: false },
    { key: 'price_drop', label: 'Price Drop', icon: '💰', color: '#06b6d4', social: false },
  ]

  const navItems = [
    { key: 'home', icon: '🏠', label: 'Home' },
    { key: 'generate', icon: '✨', label: 'New Listing' },
    { key: 'results', icon: '📊', label: 'Results', disabled: !outputs },
    { key: 'history', icon: '🕐', label: 'History' },
  ]

  const styles = {
    page: { minHeight: '100vh', background: '#111318', fontFamily: "'Inter', sans-serif", display: 'flex' as const },
    sidebar: { width: '210px', background: '#0d1018', borderRight: '1px solid rgba(255,255,255,0.04)', display: 'flex' as const, flexDirection: 'column' as const, position: 'fixed' as const, top: 0, left: 0, height: '100vh', zIndex: 200, transition: 'transform 0.3s ease' as const, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-210px)' },
    main: { flex: 1, minHeight: '100vh', display: 'flex' as const, flexDirection: 'column' as const },
    card: { background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0' },
    label: { fontSize: '11px', color: '#6b7280', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = userName ? userName.split(' ')[0] : ''

  const buckets = [
    {
      label: 'WIN THE LISTING',
      color: '#8b5cf6',
      cards: [
        { icon: '📋', title: 'Seller Prep', desc: 'Prepare for your listing appointment', color: '#8b5cf6', href: '/seller-prep' },
        { icon: '💲', title: 'Pricing Assistant', desc: 'Get a data-backed price range and strategy', color: '#d4af37', href: '/pricing-assistant' },
        { icon: '🎯', title: 'Listing Presentation', desc: 'Build your full seller appointment deck', color: '#a78bfa', href: '/listing-presentation' },
        { icon: '🏆', title: 'Agent Portfolio', desc: 'Your shareable listing portfolio page', color: '#d4af37', href: '/agent-portfolio' },
      ]
    },
    {
      label: 'BUILD THE LISTING',
      color: '#1D9E75',
      cards: [
        { icon: '✨', title: 'New Listing', desc: 'Full guided form → 11 marketing formats', color: '#1D9E75', action: () => { setActivePage('generate'); setOutputs(null); setCurrentListingId(null); setForm({type:'Single family',beds:'',sqft:'',price:'',neighborhood:'',features:'',tone:'Professional',buyer:'Move-up families',notes:'',name:''}) } },
        { icon: '⚡', title: 'Quick Listing', desc: 'Faster manual start, fewer inputs', color: '#d4af37', href: '/quick-listing' },
        { icon: '📸', title: 'Snap & Start', desc: 'On-site? Start from photos instantly', color: '#e1306c', href: '/snap-start' },
        { icon: '✍️', title: 'Rewrite Listing', desc: 'Polish and improve existing copy', color: '#6366f1', href: '/rewrite' },
        { icon: '🖼️', title: 'Photo Library', desc: 'Manage your saved property photos', color: '#f97316', href: '/photos' },
      ]
    },
    {
      label: 'LAUNCH THE LISTING',
      color: '#f59e0b',
      cards: [
        { icon: '🚀', title: 'Launch Plan', desc: '7-day marketing rollout strategy', color: '#f59e0b', href: '/launch-kit' },
        { icon: '📅', title: 'Social Planner', desc: '7-day social media content calendar', color: '#e1306c', href: '/social-planner' },
        { icon: '🏡', title: 'Open House Kit', desc: 'Flyer, posts, and follow-up emails', color: '#10b981', href: '/open-house' },
        { icon: '💰', title: 'Price Drop Kit', desc: 'Price improvement announcement suite', color: '#ef4444', href: '/price-drop' },
      ]
    },
    {
      label: 'MANAGE THE RELATIONSHIP',
      color: '#10b981',
      cards: [
        { icon: '👥', title: 'Leads & Clients', desc: 'Track your pipeline and contacts', color: '#10b981', href: '/leads' },
        { icon: '📩', title: 'Follow-Up Assistant', desc: 'Post-meeting and post-showing emails', color: '#6366f1', href: '/follow-up' },
        { icon: '💰', title: 'Seller Net Sheet', desc: 'Estimate seller proceeds before closing', color: '#1D9E75', href: '/seller-net-sheet' },
        { icon: '🧮', title: 'Commission Calculator', desc: 'Calculate your real take-home after splits and fees', color: '#d4af37', href: '/commission-calculator' },
        { icon: '🛡️', title: 'Objection Handler', desc: 'Turn any objection into a confident response', color: '#8b5cf6', href: '/objection-handler' },
      ]
    },
  ]

  return (
    <div style={styles.page}>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.75)',zIndex:199}}/>
      )}

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={{padding:'1.5rem 1.25rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0',letterSpacing:'-0.2px'}}>
                Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
              </div>
              {planLoaded && plan === 'pro' ? (
                <div style={{fontSize:'10px',marginTop:'3px',fontWeight:'600'}}>
                  <span style={{color:'#1D9E75'}}>Listing</span>
                  <span style={{color:'#6b7280'}}>Whisperer</span>
                  <span style={{color:'#d4af37'}}>Pro</span>
                </div>
              ) : (
                <div style={{fontSize:'10px',color:'#333',marginTop:'3px'}}>AI Assistant for Agents</div>
              )}
            </div>
            <button onClick={() => setSidebarOpen(false)}
              style={{background:'none',border:'none',color:'#333',fontSize:'16px',cursor:'pointer',padding:'0'}}>✕</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:'auto' as const,padding:'0.75rem 0'}}>
          {navItems.map(item => (
            <button key={item.key}
              onClick={() => { !item.disabled && setActivePage(item.key); setSidebarOpen(false) }}
              style={{
                width:'100%', padding:'9px 1.25rem', display:'flex', alignItems:'center', gap:'9px',
                background: activePage === item.key ? 'rgba(29,158,117,0.1)' : 'transparent',
                border:'none',
                borderLeft: activePage === item.key ? '2px solid #1D9E75' : '2px solid transparent',
                color: activePage === item.key ? '#1D9E75' : item.disabled ? '#222' : '#4a4f62',
                fontSize:'12px', fontWeight: activePage === item.key ? '600' : '400',
                cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign:'left' as const,
                transition:'all 0.15s', marginBottom:'1px',
              }}>
              <span style={{fontSize:'13px'}}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{margin:'0.75rem 1.25rem',borderTop:'1px solid rgba(255,255,255,0.04)'}}/>
          <p style={{fontSize:'9px',fontWeight:'700',color:'#2a2a2a',letterSpacing:'1.2px',margin:'0 0 4px',padding:'0 1.25rem'}}>TOOLS</p>
          {[
            { href: '/seller-prep', icon: '📋', label: 'Seller Prep' },
            { href: '/pricing-assistant', icon: '💲', label: 'Pricing Assistant' },
            { href: '/quick-listing', icon: '⚡', label: 'Quick Listing' },
            { href: '/snap-start', icon: '📸', label: 'Snap & Start' },
            { href: '/rewrite', icon: '✍️', label: 'Rewrite' },
            { href: '/launch-kit', icon: '🚀', label: 'Launch Plan' },
            { href: '/leads', icon: '👥', label: 'Leads & Clients' },
            { href: '/photos', icon: '🖼️', label: 'Photo Library' },
            { href: '/seller-net-sheet', icon: '💰', label: 'Seller Net Sheet' },
            { href: '/commission-calculator', icon: '🧮', label: 'Commission Calculator' },
            { href: '/agent-portfolio', icon: '🏆', label: 'Agent Portfolio' },
            { href: '/objection-handler', icon: '🛡️', label: 'Objection Handler' },
            { href: '/social-planner', icon: '📅', label: 'Social Planner' },
            { href: '/settings', icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <a key={item.href} href={item.href}
              style={{width:'100%',padding:'7px 1.25rem',display:'flex',alignItems:'center',gap:'9px',color:'#3a3f52',fontSize:'12px',textDecoration:'none',borderLeft:'2px solid transparent',transition:'color 0.15s'}}
              onMouseOver={e => e.currentTarget.style.color='#6b7280'}
              onMouseOut={e => e.currentTarget.style.color='#3a3f52'}>
              <span style={{fontSize:'12px'}}>{item.icon}</span> {item.label}
            </a>
          ))}
        </div>

        <div style={{padding:'1rem 1.25rem',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
          {plan === 'starter' && (
            <a href="/pricing" onClick={() => trackUpgradeClick('sidebar', plan)}
              style={{display:'block',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',padding:'11px',borderRadius:'9px',textAlign:'center',textDecoration:'none',fontSize:'11px',fontWeight:'700',marginBottom:'6px',lineHeight:'1.7',boxShadow:'0 0 16px rgba(29,158,117,0.2)'}}>
              ⚡ Upgrade to Pro
              <span style={{display:'block',fontSize:'10px',fontWeight:'400',opacity:0.85}}>Unlimited listings & all features</span>
              <span style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#d4af37',marginTop:'2px'}}>Use code WELCOME50 for 50% off</span>
            </a>
          )}
          {plan === 'starter' && (
            <div style={{fontSize:'10px',color:'#2a2a2a',textAlign:'center',marginBottom:'8px'}}>
              {listingCredits > 0 ? `${listingCredits} credit${listingCredits > 1 ? 's' : ''} remaining` : listingsUsed < 2 ? 'Try free — 24 hours of Pro on us' : '⚠️ Trial ended — upgrade to continue'}
            </div>
          )}
          <div style={{display:'flex',justifyContent:'center',gap:'10px'}}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLScCLYVYMcFti8uxW4_3T7nhHK__AdYfsUEeB1WfGIAE2SHgJg/viewform?usp=publish-editor" target="_blank"
              style={{fontSize:'10px',color:'#2a2a2a',textDecoration:'none'}}>Feedback</a>
            <a href="/contact" style={{fontSize:'10px',color:'#2a2a2a',textDecoration:'none'}}>Contact</a>
            <a href="/" style={{fontSize:'10px',color:'#2a2a2a',textDecoration:'none'}}>Sign out</a>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div style={{background:'rgba(10,13,20,0.98)',borderBottom:'1px solid rgba(255,255,255,0.04)',padding:'0.75rem 1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
          <button onClick={() => setSidebarOpen(true)}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.07)',color:'#5a5f72',fontSize:'15px',cursor:'pointer',padding:'5px 10px',borderRadius:'7px'}}>
            ☰
          </button>
          <div style={{fontSize:'14px',fontWeight:'700',color:'#f0f0f0'}}>
            Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
            {planLoaded && plan === 'pro' && (
              <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
            )}
          </div>
          <a href="/pricing" style={{fontSize:'11px',color: plan === 'pro' ? '#d4af37' : '#444',textDecoration:'none',fontWeight:'600'}}>
            {plan === 'pro' ? '✦ Pro' : 'Upgrade'}
          </a>
        </div>

        <div style={{padding:'2.5rem 1.5rem 3rem',flex:1,maxWidth:'860px',width:'100%',margin:'0 auto'}}>

          {/* HOME PAGE */}
          {activePage === 'home' && (
            <div>
              <div style={{marginBottom:'3rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',marginBottom:'8px'}}>
                  <div>
                    <h1 style={{fontSize:'2rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 8px',letterSpacing:'-0.5px'}}>
                      {greeting}{firstName ? `, ${firstName}` : ''} 👋
                    </h1>
                    <p style={{fontSize:'15px',color:'#3a3f52',margin:'0',fontWeight:'400'}}>
                      What would you like to do today?
                    </p>
                  </div>

                  {planLoaded && plan === 'pro' && (
                    <div style={{display:'flex',alignItems:'center',gap:'10px',background:'linear-gradient(135deg,rgba(212,175,55,0.06),rgba(212,175,55,0.02))',border:'1px solid rgba(212,175,55,0.15)',borderRadius:'12px',padding:'10px 16px'}}>
                      <div style={{width:'30px',height:'30px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',boxShadow:'0 0 12px rgba(29,158,117,0.3)'}}>✦</div>
                      <div>
                        <div style={{fontSize:'12px',fontWeight:'700',letterSpacing:'0.2px'}}>
                          <span style={{color:'#e8e8e8'}}>Listing</span>
                          <span style={{color:'#1D9E75'}}>Whisperer</span>
                          <span style={{color:'#d4af37'}}>Pro</span>
                        </div>
                        <div style={{fontSize:'10px',color:'#333',marginTop:'2px'}}>Unlimited access · All features</div>
                      </div>
                    </div>
                  )}

                  {planLoaded && plan === 'starter' && (
                    <a href="/pricing" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'10px 14px',transition:'border-color 0.2s'}}
                      onMouseOver={e => e.currentTarget.style.borderColor='rgba(29,158,117,0.3)'}
                      onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}>
                      <div>
                        <div style={{fontSize:'11px',fontWeight:'600',color:'#d0d0d0'}}>
                          {listingCredits > 0 ? `${listingCredits} credit${listingCredits > 1 ? 's' : ''} left` : listingsUsed < 2 ? '24 hours of Pro — on us' : '⚠️ Trial ended'}
                        </div>
                        <div style={{fontSize:'10px',color:'#1D9E75',marginTop:'2px',fontWeight:'500'}}>Upgrade to Pro →</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:'2.5rem',marginBottom:'3rem'}}>
                {buckets.map((bucket, bi) => (
                  <div key={bi}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                      <span style={{width:'3px',height:'14px',background:bucket.color,borderRadius:'2px',display:'inline-block',boxShadow:`0 0 8px ${bucket.color}60`}}/>
                      <p style={{fontSize:'10px',fontWeight:'700',color:bucket.color,letterSpacing:'1.5px',margin:'0',opacity:0.8}}>{bucket.label}</p>
                      <span style={{flex:1,height:'1px',background:`${bucket.color}12`,display:'inline-block'}}/>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(190px, 1fr))',gap:'10px'}}>
                      {bucket.cards.map((card: any, ci: number) => (
                        card.href ? (
                          <a key={ci} href={card.href}
                            style={{background:'linear-gradient(135deg,#111420,#13161f)',borderRadius:'13px',border:'1px solid rgba(255,255,255,0.05)',padding:'1.125rem',textDecoration:'none',display:'block',transition:'all 0.2s'}}
                            onMouseOver={e => {e.currentTarget.style.borderColor=`${card.color}30`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,0.4)`}}
                            onMouseOut={e => {e.currentTarget.style.borderColor='rgba(255,255,255,0.05)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                            <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}12`,border:`1px solid ${card.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{card.icon}</div>
                            <div style={{fontSize:'13px',fontWeight:'700',color:'#e0e0e0',marginBottom:'3px'}}>{card.title}</div>
                            <div style={{fontSize:'11px',color:'#6b7280',lineHeight:'1.5'}}>{card.desc}</div>
                          </a>
                        ) : (
                          <div key={ci} onClick={card.action}
                            style={{background:`linear-gradient(135deg,${card.color}0e,${card.color}05)`,borderRadius:'13px',border:`1px solid ${card.color}20`,padding:'1.125rem',cursor:'pointer',transition:'all 0.2s'}}
                            onMouseOver={e => {e.currentTarget.style.borderColor=`${card.color}45`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,0.4)`}}
                            onMouseOut={e => {e.currentTarget.style.borderColor=`${card.color}20`;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                            <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',marginBottom:'10px'}}>{card.icon}</div>
                            <div style={{fontSize:'13px',fontWeight:'700',color:'#e0e0e0',marginBottom:'3px'}}>{card.title}</div>
                            <div style={{fontSize:'11px',color:'#6b7280',lineHeight:'1.5'}}>{card.desc}</div>
                            <div style={{marginTop:'8px',fontSize:'11px',fontWeight:'600',color:card.color}}>Start now →</div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {pastListings.length > 0 && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                    <p style={{fontSize:'10px',fontWeight:'700',color:'#6b7280',letterSpacing:'1px',margin:'0'}}>RECENT WORK</p>
                    <button onClick={() => setActivePage('history')} style={{background:'none',border:'none',color:'#333',fontSize:'11px',cursor:'pointer',padding:'0'}}>View all →</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
                    {pastListings.slice(0, 3).map(listing => (
                      <div key={listing.id}
                        onClick={() => { setOutputs(listing.outputs); setCurrentListingId(listing.id); setActivePage('results') }}
                        style={{background:'rgba(255,255,255,0.015)',borderRadius:'9px',border:'1px solid rgba(255,255,255,0.04)',padding:'0.8rem 1rem',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.2)';e.currentTarget.style.background='rgba(29,158,117,0.03)'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='rgba(255,255,255,0.04)';e.currentTarget.style.background='rgba(255,255,255,0.015)'}}>
                        <div>
                          <p style={{margin:'0',fontSize:'13px',fontWeight:'600',color:'#e0e0e0'}}>{listing.name || `${listing.property_type} — ${listing.neighborhood}`}</p>
                          <p style={{margin:'2px 0 0',fontSize:'11px',color:'#4a4f62'}}>{listing.price} · {new Date(listing.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{fontSize:'11px',color:'#1D9E75',fontWeight:'500'}}>View →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GENERATE PAGE */}
          {activePage === 'generate' && (
            <div style={{maxWidth:'680px'}}>
              <div style={{marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'12px'}}>
                <button onClick={() => setActivePage('home')} style={{background:'none',border:'none',color:'#444',fontSize:'13px',cursor:'pointer',padding:'0'}}>← Home</button>
                <h1 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>New Listing</h1>
                <span style={{background:'rgba(29,158,117,0.15)',color:'#1D9E75',fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.3)'}}>11 formats</span>
              </div>

              <div style={{...styles.card, marginBottom:'1rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>PROPERTY DETAILS</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'12px',marginBottom:'12px'}}>
                  <div><label style={styles.label}>Listing name</label><input placeholder="123 Oak Street" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={styles.select}><option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option></select></div>
                  <div><label style={styles.label}>Beds / Baths</label><input placeholder="3 bed / 2 bath" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Sq Ft</label><input placeholder="1,850" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Price</label><input placeholder="$899,000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Neighborhood</label><input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({...form, neighborhood: e.target.value})} style={styles.input}/></div>
                </div>
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px',marginBottom:'12px'}}>
                  <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 12px'}}>FEATURES & MARKETING</p>
                  <label style={styles.label}>Key features</label>
                  <input placeholder="Ocean views, chef's kitchen, spa bath..." value={form.features} onChange={e => setForm({...form, features: e.target.value})} style={{...styles.input, marginBottom:'8px'}}/>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
                    {["Ocean views","Chef's kitchen","Spa bath","3-car garage","Solar panels","Pool","Open floor plan","Natural light","Updated finishes","Smart home","Walk-in closet","Outdoor entertaining"].map(chip => (
                      <button key={chip} onClick={() => { const current = form.features; if (!current.toLowerCase().includes(chip.toLowerCase())) setForm({...form, features: current ? current + ', ' + chip : chip}) }}
                        style={{padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.08)',background:'rgba(0,0,0,0.2)',color:'#6b7280',fontSize:'11px',cursor:'pointer'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor='#1D9E75';e.currentTarget.style.color='#1D9E75'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.color='#6b7280'}}>+ {chip}</button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                    <div><label style={styles.label}>Tone</label><select value={form.tone} onChange={e => setForm({...form, tone: e.target.value})} style={styles.select}><option>Professional</option><option>Luxury & aspirational</option><option>Warm & inviting</option><option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option></select></div>
                    <div><label style={styles.label}>Target buyer</label><select value={form.buyer} onChange={e => setForm({...form, buyer: e.target.value})} style={styles.select}><option>Move-up families</option><option>Luxury buyers</option><option>First-time buyers</option><option>Investors</option><option>Downsizers</option></select></div>
                  </div>
                </div>
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'16px'}}>
                  <label style={styles.label}>Additional notes</label>
                  <textarea placeholder="Seller story, open house date, urgency..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{...styles.input, minHeight:'60px', resize:'vertical' as const, marginBottom:'16px'}}/>
                  <button onClick={generate} disabled={loading} style={{width:'100%',padding:'15px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 30px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
                    {loading ? '⏳ Generating...' : '✨ Generate 11 Formats'}
                  </button>
                </div>
              </div>

              {loading && (
                <div>
                  <style>{`
                    @keyframes shimmer { 0% { background-position: -800px 0 } 100% { background-position: 800px 0 } }
                    @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
                    .skeleton { background: linear-gradient(90deg, #1a1d2e 25%, #22263a 50%, #1a1d2e 75%); background-size: 800px 100%; animation: shimmer 1.5s infinite linear; border-radius: 6px; }
                  `}</style>
                  <div style={{...styles.card, padding:'1.25rem 1.5rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'12px'}}>
                    <div style={{display:'flex',gap:'4px'}}>{[0,1,2].map(i => <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#1D9E75',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}</div>
                    <p style={{color:'#f0f0f0',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>{loadingSteps[loadingStep]}</p>
                    <span style={{fontSize:'12px',color:'#1D9E75',fontWeight:'600'}}>{Math.round(((loadingStep + 1) / loadingSteps.length) * 100)}%</span>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.2)',borderRadius:'8px',height:'3px',marginBottom:'1.5rem',overflow:'hidden'}}>
                    <div style={{height:'100%',background:'linear-gradient(90deg,#1D9E75,#085041)',borderRadius:'8px',width:`${((loadingStep + 1) / loadingSteps.length) * 100}%`,transition:'width 0.5s ease'}}/>
                  </div>
                  <div style={{background:'linear-gradient(135deg,#1e2235,#232840)',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.15)',padding:'2rem',marginBottom:'1rem'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.5rem'}}>
                      <div className="skeleton" style={{width:'42px',height:'42px',borderRadius:'10px',flexShrink:0}}/>
                      <div style={{flex:1}}><div className="skeleton" style={{height:'14px',width:'140px',marginBottom:'8px'}}/><div className="skeleton" style={{height:'11px',width:'200px'}}/></div>
                      <div className="skeleton" style={{width:'80px',height:'32px',borderRadius:'8px'}}/>
                    </div>
                    <div className="skeleton" style={{height:'13px',marginBottom:'8px'}}/><div className="skeleton" style={{height:'13px',marginBottom:'8px'}}/><div className="skeleton" style={{height:'13px',marginBottom:'8px',width:'85%'}}/><div className="skeleton" style={{height:'13px',width:'70%'}}/>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:'12px'}}>
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} style={{background:'linear-gradient(135deg,#1a1d2e,#1e2235)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.06)',padding:'1.25rem'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px'}}>
                          <div className="skeleton" style={{width:'32px',height:'32px',borderRadius:'8px',flexShrink:0}}/>
                          <div style={{flex:1}}><div className="skeleton" style={{height:'12px',width:'100px',marginBottom:'6px'}}/><div className="skeleton" style={{height:'10px',width:'60px'}}/></div>
                        </div>
                        <div className="skeleton" style={{height:'11px',marginBottom:'6px'}}/><div className="skeleton" style={{height:'11px',marginBottom:'6px',width:'90%'}}/><div className="skeleton" style={{height:'11px',width:'75%',marginBottom:'14px'}}/>
                        <div style={{display:'flex',gap:'6px'}}><div className="skeleton" style={{height:'28px',width:'80px',borderRadius:'6px'}}/><div className="skeleton" style={{height:'28px',width:'120px',borderRadius:'6px'}}/></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RESULTS PAGE */}
          {activePage === 'results' && outputs && (
            <div>
              {showReferralBanner && referralCode && (
                <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.12),rgba(8,80,65,0.08))',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.25)',padding:'1.25rem 1.5rem',marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <span style={{fontSize:'1.5rem'}}>🎁</span>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0 0 3px'}}>Share Listing Whisperer — you both get a reward!</p>
                      <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>They get 24 hours of Pro free · You get 25% off your next month</p>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                    <div style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',padding:'7px 12px',fontSize:'12px',color:'#1D9E75',fontWeight:'600'}}>listingwhisperer.com/signup?ref={referralCode}</div>
                    <button onClick={() => { navigator.clipboard.writeText(`https://listingwhisperer.com/signup?ref=${referralCode}`); setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000) }}
                      style={{padding:'7px 16px',borderRadius:'8px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontWeight:'600',background: referralCopied ? '#1D9E75' : 'rgba(29,158,117,0.15)',color: referralCopied ? '#fff' : '#1D9E75',borderColor: referralCopied ? '#1D9E75' : 'rgba(29,158,117,0.3)'}}>
                      {referralCopied ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                    <button onClick={() => setShowReferralBanner(false)} style={{background:'none',border:'none',color:'#555',fontSize:'18px',cursor:'pointer',padding:'0 4px'}}>✕</button>
                  </div>
                </div>
              )}

              <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.12),rgba(8,80,65,0.08))',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.2)',padding:'1.5rem 2rem',marginBottom:'2rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
                  <div>
                    <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'6px'}}>
                      <span style={{fontSize:'1.75rem'}}>🎉</span>
                      <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>Marketing Suite Ready</h1>
                      <span style={{background:'rgba(29,158,117,0.2)',color:'#1D9E75',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.4)'}}>✓ 11 FORMATS</span>
                    </div>
                    <p style={{fontSize:'14px',color:'#8b8fa8',margin:'0'}}>
                      <input
                        key={currentListingId || 'new'}
                        placeholder="Name this listing..."
                        defaultValue={form.name || form.neighborhood || ''}
                        onBlur={async (e) => {
                          const newName = e.target.value
                          setForm(prev => ({...prev, name: newName}))
                          if (userId && currentListingId && newName) {
                            await supabase.from('listings').update({ name: newName }).eq('id', currentListingId)
                            setPastListings(prev => prev.map(l => l.id === currentListingId ? {...l, name: newName} : l))
                          }
                        }}
                        style={{background:'transparent',border:'none',borderBottom:'1px solid rgba(255,255,255,0.1)',color:'#8b8fa8',fontSize:'14px',outline:'none',width:'200px',padding:'2px 4px'}}
                      />
                      {form.price ? ` · ${form.price}` : ''} · {form.beds || ''} · {form.sqft ? `${form.sqft} sq ft` : ''}
                    </p>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button onClick={() => handleDownloadPdf('mls')} style={{padding:'8px 16px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#8b8fa8',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>📄 MLS PDF</button>
                    <button onClick={() => handleDownloadPdf('flyer')} style={{padding:'8px 16px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#8b8fa8',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>🏠 Flyer PDF</button>
                    <button onClick={() => { setActivePage('generate'); setOutputs(null); setCurrentListingId(null); setForm({type:'Single family',beds:'',sqft:'',price:'',neighborhood:'',features:'',tone:'Professional',buyer:'Move-up families',notes:'',name:''}) }} style={{padding:'8px 16px',background:'rgba(29,158,117,0.15)',border:'1px solid rgba(29,158,117,0.3)',borderRadius:'8px',color:'#1D9E75',fontSize:'12px',cursor:'pointer',fontWeight:'600'}}>+ New Listing</button>
                  </div>
                </div>
              </div>

              <div style={{background:'linear-gradient(135deg,#1e2235,#232840)',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.25)',padding:'2rem',marginBottom:'1.5rem',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem',flexWrap:'wrap',gap:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div style={{width:'42px',height:'42px',background:'linear-gradient(135deg,rgba(212,175,55,0.2),rgba(212,175,55,0.05))',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',border:'1px solid rgba(212,175,55,0.2)'}}>🏠</div>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'15px',fontWeight:'700',color:'#f0f0f0'}}>{outputCards.find(c => c.key === featuredKey)?.label || 'MLS Description'}</span>
                        <span style={{fontSize:'10px',fontWeight:'700',color:'#d4af37',background:'rgba(212,175,55,0.1)',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.2)'}}>{outputCards.find(c => c.key === featuredKey)?.label || 'MLS Description'}</span>
                      </div>
                      <span style={{fontSize:'11px',color:'#6b7280'}}>Primary listing copy — MLS ready</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    {featuredKey !== 'mls_standard' && (
                      <button onClick={() => setFeaturedKey('mls_standard')}
                        style={{padding:'8px 16px',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.1)',fontSize:'12px',cursor:'pointer',fontWeight:'500',background:'rgba(255,255,255,0.05)',color:'#6b7280'}}>
                        ↩ Reset
                      </button>
                    )}
                    <button onClick={() => handleCopy(featuredKey, outputs[featuredKey] || '')}
                      style={{padding:'8px 20px',borderRadius:'8px',border:'1px solid',fontSize:'13px',cursor:'pointer',fontWeight:'600',background: copied === featuredKey ? '#d4af37' : 'rgba(212,175,55,0.1)',color: copied === featuredKey ? '#000' : '#d4af37',borderColor: copied === featuredKey ? '#d4af37' : 'rgba(212,175,55,0.3)'}}>
                      {copied === featuredKey ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
                <p style={{fontSize:'15px',lineHeight:'1.9',color:'#e8e8e8',margin:'0',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'1rem',whiteSpace:'pre-wrap'}}>{outputs[featuredKey] || ''}</p>
              </div>

              {[
                { label: 'CORE LISTING', labelColor: '#d4af37', cards: [{key:'mls_luxury',label:'Luxury MLS',icon:'✨',color:'#d4af37',desc:'Premium luxury version'},{key:'openhouse',label:'Open House',icon:'🚪',color:'#f59e0b',desc:'Open house announcement'},{key:'price_drop',label:'Price Drop',icon:'💰',color:'#ef4444',desc:'Price reduction alert'}]},
                { label: 'SOCIAL MEDIA', labelColor: '#818cf8', cards: [{key:'instagram',label:'Instagram',icon:'📸',color:'#e1306c',platform:'instagram'},{key:'facebook',label:'Facebook Post',icon:'👥',color:'#1877f2',platform:'facebook'},{key:'video',label:'Video Script',icon:'🎬',color:'#ef4444',platform:null}]},
                { label: 'EMAIL & OUTREACH', labelColor: '#1D9E75', cards: [{key:'email',label:'Email Blast',icon:'📧',color:'#1D9E75'},{key:'text_message',label:'SMS / Text',icon:'📱',color:'#10b981'},{key:'seo',label:'SEO Copy',icon:'🔍',color:'#8b5cf6'}]},
                { label: 'PRINT & FLYER', labelColor: '#f97316', cards: [{key:'flyer',label:'Flyer Copy',icon:'📄',color:'#f97316'}]},
              ].map(section => (
                <div key={section.label} style={{marginBottom:'1.5rem'}}>
                  <p style={{fontSize:'11px',fontWeight:'700',color:section.labelColor,letterSpacing:'1.5px',margin:'0 0 12px',display:'flex',alignItems:'center',gap:'8px'}}>
                    <span style={{width:'24px',height:'1px',background:`${section.labelColor}30`,display:'inline-block'}}/>{section.label}<span style={{flex:1,height:'1px',background:`${section.labelColor}10`,display:'inline-block'}}/>
                  </p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',gap:'12px'}}>
                    {section.cards.map((card: any) => (
                      <div key={card.key} style={{background:'linear-gradient(135deg,#1a1d2e,#1e2235)',borderRadius:'14px',border:'1px solid rgba(255,255,255,0.07)',padding:'1.25rem',transition:'all 0.2s'}}
                        onMouseOver={e => (e.currentTarget.style.borderColor = `${card.color}30`)}
                        onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                            <span style={{fontSize:'16px'}}>{card.icon}</span>
                            <div>
                              <div style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0'}}>{card.label}</div>
                              {card.desc && <div style={{fontSize:'10px',color:'#555'}}>{card.desc}</div>}
                            </div>
                          </div>
                          <span style={{fontSize:'10px',fontWeight:'600',color:card.color,background:`${card.color}15`,padding:'2px 8px',borderRadius:'20px',border:`1px solid ${card.color}30`}}>READY</span>
                        </div>
                        <p style={{fontSize:'12px',color:'#6b7280',lineHeight:'1.7',margin:'0 0 12px',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{outputs[card.key] || ''}</p>
                        <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                          <button onClick={() => handleCopy(card.key, outputs[card.key] || '')}
                            style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'rgba(0,0,0,0.2)',color: copied === card.key ? '#fff' : '#6b7280',borderColor: copied === card.key ? card.color : 'rgba(255,255,255,0.08)'}}>
                            {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                          </button>
                          <button onClick={() => { setFeaturedKey(card.key); window.scrollTo({top:0,behavior:'smooth'}) }}
                            style={{padding:'5px 12px',borderRadius:'6px',border:`1px solid ${card.color}30`,fontSize:'11px',cursor:'pointer',background: featuredKey === card.key ? card.color : `${card.color}10`,color: featuredKey === card.key ? '#fff' : card.color,fontWeight:'500'}}>
                            {featuredKey === card.key ? '✓ Previewing' : '↑ Set as Main Preview'}
                          </button>
                          {card.platform === 'facebook' && (<><button onClick={() => handleShare('facebook', outputs[card.key] || '')} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid rgba(24,119,242,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(24,119,242,0.1)',color:'#1877f2'}}>Facebook</button><button onClick={() => handleShare('linkedin', outputs[card.key] || '')} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid rgba(10,102,194,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(10,102,194,0.1)',color:'#0a66c2'}}>LinkedIn</button></>)}
                          {card.platform === 'instagram' && (<div><button onClick={() => handleCopy(card.key+'_ig', outputs[card.key] || '')} style={{padding:'5px 10px',borderRadius:'6px',border:'1px solid rgba(225,48,108,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(225,48,108,0.1)',color:'#e1306c'}}>Copy for Instagram</button><p style={{fontSize:'10px',color:'#444',margin:'3px 0 0'}}>Instagram requires manual posting</p></div>)}
                          {card.key === 'flyer' && (<button onClick={() => handleDownloadPdf('flyer')} style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid rgba(249,115,22,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(249,115,22,0.1)',color:'#f97316',fontWeight:'500'}}>📥 Download PDF</button>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.08),rgba(8,80,65,0.05))',borderRadius:'16px',border:'1px solid rgba(29,158,117,0.15)',padding:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
                <div>
                  <p style={{fontSize:'14px',fontWeight:'600',color:'#f0f0f0',margin:'0 0 4px'}}>Ready to launch this listing?</p>
                  <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>Generate a 7-day marketing plan or improve existing copy.</p>
                </div>
                <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                  <a href="/launch-kit" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>🚀 7-Day Launch Kit</a>
                  <a href="/rewrite" style={{padding:'10px 20px',background:'rgba(0,0,0,0.2)',color:'#8b8fa8',borderRadius:'10px',textDecoration:'none',fontSize:'13px',border:'1px solid rgba(255,255,255,0.08)'}}>✨ Rewrite & Improve</a>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY PAGE */}
          {activePage === 'history' && (
            <div style={{maxWidth:'760px'}}>
              <div style={{marginBottom:'1.5rem'}}>
                <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>Listing History</h1>
                <p style={{fontSize:'14px',color:'#8b8fa8'}}>{pastListings.length} most recent listings</p>
              </div>
              {pastListings.length === 0 ? (
                <div style={{...styles.card,textAlign:'center',padding:'3rem'}}>
                  <p style={{color:'#8b8fa8'}}>No listings yet!</p>
                  <button onClick={() => setActivePage('generate')} style={{marginTop:'1rem',padding:'10px 24px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px'}}>Generate First Listing</button>
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {pastListings.map(listing => (
                    <div key={listing.id} style={{...styles.card}}
                      onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                      onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',cursor:'pointer'}} onClick={() => { setOutputs(listing.outputs); setCurrentListingId(listing.id); setActivePage('results') }}>
                        <div>
                          <p style={{margin:'0',fontSize:'14px',fontWeight:'600',color:'#f0f0f0'}}>{listing.name || `${listing.property_type} — ${listing.neighborhood}`}</p>
                          <p style={{margin:'4px 0 0',fontSize:'12px',color:'#8b8fa8'}}>{listing.beds_baths} · {listing.sqft} sq ft · {listing.price}</p>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <p style={{margin:'0',fontSize:'11px',color:'#666'}}>{new Date(listing.created_at).toLocaleDateString()}</p>
                          <p style={{margin:'4px 0 0',fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>View →</p>
                        </div>
                      </div>
                      <textarea placeholder="Agent notes..." defaultValue={listing.agent_notes || ''}
                        onBlur={async (e) => { await supabase.from('listings').update({agent_notes: e.target.value}).eq('id', listing.id) }}
                        onClick={e => e.stopPropagation()}
                        style={{width:'100%',padding:'8px',background:'rgba(0,0,0,0.2)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',fontSize:'12px',color:'#8b8fa8',minHeight:'60px',resize:'vertical',boxSizing:'border-box'}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* REMINDER POPUP */}
      {showReminderPopup && dueReminders.length > 0 && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.9)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{background:'linear-gradient(135deg,#1a1d2e,#1e2235)',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.4)',padding:'2.5rem',maxWidth:'500px',width:'100%',boxShadow:'0 0 80px rgba(212,175,55,0.15)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1.5rem'}}>
              <div style={{width:'44px',height:'44px',borderRadius:'12px',background:'rgba(212,175,55,0.15)',border:'1px solid rgba(212,175,55,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',flexShrink:0}}>⏰</div>
              <div>
                <h2 style={{fontSize:'1.25rem',fontWeight:'700',color:'#f0f0f0',margin:'0 0 4px'}}>You have {dueReminders.length} reminder{dueReminders.length > 1 ? 's' : ''} due</h2>
                <p style={{fontSize:'13px',color:'#6b7280',margin:'0'}}>Take care of these before you get started</p>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'1.5rem'}}>
              {dueReminders.map(reminder => (
                <div key={reminder.id} style={{background:'rgba(0,0,0,0.25)',borderRadius:'12px',border:'1px solid rgba(212,175,55,0.15)',padding:'1rem 1.25rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>{reminder.contact_name || 'Follow up'}</p>
                    <span style={{fontSize:'11px',color:'#d4af37',background:'rgba(212,175,55,0.1)',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.2)',whiteSpace:'nowrap',marginLeft:'8px'}}>{new Date(reminder.remind_at).toLocaleString()}</span>
                  </div>
                  <p style={{fontSize:'12px',color:'#8b8fa8',margin:'0 0 10px',lineHeight:'1.6',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' as const,overflow:'hidden'}}>{reminder.content}</p>
                  <button onClick={async () => { await supabase.from('reminders').update({sent: true}).eq('id', reminder.id); const remaining = dueReminders.filter(r => r.id !== reminder.id); setDueReminders(remaining); if (remaining.length === 0) setShowReminderPopup(false) }}
                    style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid rgba(29,158,117,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(29,158,117,0.1)',color:'#1D9E75',fontWeight:'600'}}>✓ Mark as Done</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowReminderPopup(false)} style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#d4af37,#a08040)',color:'#000',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Dismiss All & Continue</button>
            <p style={{fontSize:'11px',color:'#444',textAlign:'center',margin:'10px 0 0'}}>Dismissed reminders are marked as done and won't show again</p>
          </div>
        </div>
      )}

      {/* CHAT WIDGET */}
      <div style={{position:'fixed',bottom:'24px',right:'24px',zIndex:1500}}>
        {showChat && (
          <div style={{position:'absolute',bottom:'70px',right:'0',width:'360px',height:'500px',background:'linear-gradient(135deg,#1a1d2e,#1e2235)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.25)',boxShadow:'0 24px 60px rgba(0,0,0,0.5)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(0,0,0,0.2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px'}}>✦</div>
                <div>
                  <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>Listing Whisperer AI</p>
                  <p style={{fontSize:'10px',color:'#1D9E75',margin:'0'}}>Real estate assistant</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} style={{background:'none',border:'none',color:'#555',fontSize:'18px',cursor:'pointer'}}>✕</button>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'1rem',display:'flex',flexDirection:'column',gap:'10px'}}>
              {chatMessages.length === 0 && (
                <div style={{textAlign:'center',padding:'2rem 1rem'}}>
                  <div style={{fontSize:'2rem',marginBottom:'8px'}}>✦</div>
                  <p style={{fontSize:'13px',fontWeight:'600',color:'#f0f0f0',margin:'0 0 6px'}}>How can I help you?</p>
                  <p style={{fontSize:'12px',color:'#5a5f72',margin:'0 0 1.5rem'}}>Ask me anything about real estate or how to use Listing Whisperer</p>
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {['How do I use Snap & Start?','How should I price this listing?','What is the 7-Day Launch Kit?','How do I handle a lowball offer?'].map(q => (
                      <button key={q} onClick={() => setChatInput(q)}
                        style={{padding:'8px 12px',background:'rgba(29,158,117,0.08)',border:'1px solid rgba(29,158,117,0.15)',borderRadius:'8px',color:'#8b8fa8',fontSize:'11px',cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.4)';e.currentTarget.style.color='#1D9E75'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.15)';e.currentTarget.style.color='#8b8fa8'}}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{display:'flex',justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
                  <div style={{maxWidth:'85%',padding:'10px 14px',borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',background: msg.role === 'user' ? 'linear-gradient(135deg,#1D9E75,#085041)' : 'rgba(255,255,255,0.05)',border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',fontSize:'13px',lineHeight:'1.6',color:'#f0f0f0',whiteSpace:'pre-wrap'}}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{display:'flex',justifyContent:'flex-start'}}>
                  <div style={{padding:'10px 14px',borderRadius:'14px 14px 14px 4px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:'4px',alignItems:'center'}}>
                    {[0,1,2].map(i => <div key={i} style={{width:'6px',height:'6px',borderRadius:'50%',background:'#1D9E75',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}
                  </div>
                </div>
              )}
            </div>
            <div style={{padding:'0.875rem',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',gap:'8px'}}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()} placeholder="Ask anything..."
                style={{flex:1,padding:'10px 14px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',fontSize:'13px',color:'#f0f0f0',outline:'none'}}/>
              <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}
                style={{width:'40px',height:'40px',borderRadius:'10px',background: chatInput.trim() ? 'linear-gradient(135deg,#1D9E75,#085041)' : 'rgba(255,255,255,0.05)',border:'none',color:'#fff',fontSize:'16px',cursor: chatInput.trim() ? 'pointer' : 'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                ↑
              </button>
            </div>
          </div>
        )}
        <button onClick={() => setShowChat(!showChat)}
          style={{width:'56px',height:'56px',borderRadius:'50%',background:'linear-gradient(135deg,#1D9E75,#085041)',border:'none',color:'#fff',fontSize:'24px',cursor:'pointer',boxShadow:'0 4px 20px rgba(29,158,117,0.4)',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}
          onMouseOver={e => e.currentTarget.style.transform='scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
          {showChat ? '✕' : '✦'}
        </button>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.3)',padding:'2.5rem',maxWidth:'480px',width:'100%',boxShadow:'0 0 60px rgba(29,158,117,0.15)',textAlign:'center',position:'relative'}}>
            <button onClick={() => setShowUpgradeModal(false)} style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',fontSize:'16px',cursor:'pointer'}}>✕</button>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🚀</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Your free trial has ended</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem',lineHeight:'1.7'}}>Upgrade to Pro to keep generating unlimited listings, rewrites, and more.</p>
            <div style={{marginBottom:'1.5rem'}}>
              <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.15),rgba(8,80,65,0.15))',borderRadius:'12px',padding:'1.5rem',border:'1px solid rgba(29,158,117,0.3)',textAlign:'left'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <p style={{fontSize:'15px',fontWeight:'700',color:'#f0f0f0',margin:'0'}}>Pro Plan</p>
                  <p style={{fontSize:'2rem',fontWeight:'800',color:'#1D9E75',margin:'0'}}>$20<span style={{fontSize:'14px',color:'#6b7280'}}>/mo</span></p>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px',marginBottom:'16px'}}>
                  {['Unlimited listings','All AI tools','Seller Prep','Launch Kit','Pricing Assistant','Priority support'].map(f => (
                    <p key={f} style={{fontSize:'12px',color:'#a8f0d4',margin:'0'}}>✅ {f}</p>
                  ))}
                </div>
                <a href="/pricing" style={{display:'block',textAlign:'center',padding:'12px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>Upgrade to Pro — $20/mo</a>
              </div>
            </div>
            <p style={{fontSize:'12px',color:'#444'}}>Use code <strong style={{color:'#d4af37'}}>WELCOME50</strong> for 50% off your first month</p>
          </div>
        </div>
      )}
    </div>
  )
}