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
  const [activeTab, setActiveTab] = useState('mls_standard')
  const [copied, setCopied] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [pastListings, setPastListings] = useState<any[]>([])
  const [activePage, setActivePage] = useState('generate')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [form, setForm] = useState({
    type: 'Single family', beds: '', sqft: '', price: '',
    neighborhood: '', features: '', tone: 'Professional', buyer: 'Move-up families',
    notes: '', name: ''
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded')
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('listings_used, plan, listing_credits, brand_voice')
        .eq('id', user.id)
        .single()
      if (profile) {
        setListingsUsed(profile.listings_used || 0)
        setPlan(profile.plan || 'starter')
        setListingCredits(profile.listing_credits || 0)
        trackDashboardView(profile.plan || 'starter')
        setPlanLoaded(true)
        if (profile.brand_voice) {
          try {
            const bv = JSON.parse(profile.brand_voice)
            if (bv.preferredTone) setForm(prev => ({ ...prev, tone: bv.preferredTone }))
          } catch(e) {}
        }
      } else {
        setPlanLoaded(true)
      }
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (listings) setPastListings(listings)
      if (upgraded) setPlan('pro')
    }
    getUser()
  }, [])

  const generate = async () => {
    if (!form.features && !form.neighborhood) { alert('Please fill in at least the neighborhood and features!'); return }
    if (plan === 'starter' && listingsUsed >= 2 && listingCredits <= 0) { setShowUpgradeModal(true); return }
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: form, userId })
      })
      const data = await res.json()
      if (data.error === 'LIMIT_REACHED') { setShowUpgradeModal(true); return }
      if (data.outputs) {
        setOutputs(data.outputs)
        setActiveTab('mls_standard')
        setListingsUsed(prev => prev + 1)
        trackListingCreated(plan, form.neighborhood)
        setActivePage('generate')
        const { data: listings } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (listings) setPastListings(listings)
      }
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(outputs[activeTab] || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackOutputCopied(activeTab, plan)
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
        y += 14; doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 17, 17)
        addText(`${form.type || 'Property'} — ${form.beds || ''}`, margin, y)
        y += 7; doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
        addText(`${form.sqft || ''} sq ft  |  ${form.neighborhood || ''}`, margin, y)
        y += 12; y = addSectionTitle('MLS Description', y)
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)
        y += 10; y = checkPageBreak(y); y = addSectionTitle('Luxury MLS Version', y)
        y = addWrappedText(outputs.mls_luxury || '', margin, y, contentWidth)
        y += 10; y = checkPageBreak(y); y = addSectionTitle('Instagram Caption', y)
        y = addWrappedText((outputs.instagram || '').split('---')[0].trim(), margin, y, contentWidth)
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
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
        addText(`${form.type || ''} | ${form.beds || ''} | ${form.sqft || ''} sq ft`, pageWidth / 2, y + 28, { align: 'center' })
        doc.setDrawColor(29, 158, 117); doc.setLineWidth(0.8); doc.line(margin, y + 32, pageWidth - margin, y + 32)
        y += 42; y = addSectionTitle('About This Home', y)
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(50, 50, 50)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)
        y += 10; y = checkPageBreak(y); y = addSectionTitle('Key Features', y)
        const features = (form.features || '').split(',')
        features.forEach((feature: string) => {
          y = checkPageBreak(y, 10)
          addText(`✓ ${feature.trim()}`, margin, y); y += 6
        })
        doc.save(`Flyer-${form.neighborhood || 'listing'}.pdf`)
      }
    } catch(e: any) { alert('PDF error: ' + e.message) }
    setGeneratingPdf(false)
  }

  const remaining = 2 - listingsUsed
  const tabs = [
    { key: 'mls_standard', label: 'MLS', icon: '🏠' },
    { key: 'mls_luxury', label: 'Luxury', icon: '✨' },
    { key: 'instagram', label: 'Instagram', icon: '📸' },
    { key: 'facebook', label: 'Facebook', icon: '👥' },
    { key: 'email', label: 'Email', icon: '📧' },
    { key: 'openhouse', label: 'Open House', icon: '🚪' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'seo', label: 'SEO', icon: '🔍' },
    { key: 'text_message', label: 'SMS', icon: '📱' },
    { key: 'flyer', label: 'Flyer', icon: '📄' },
    { key: 'price_drop', label: 'Price Drop', icon: '💰' },
  ]

  const navItems = [
    { key: 'generate', icon: '✨', label: 'New Listing', desc: 'Create' },
    { key: 'results', icon: '📊', label: 'Results', desc: 'View', disabled: !outputs },
    { key: 'history', icon: '🕐', label: 'History', desc: 'Past' },
  ]

  const styles = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)', fontFamily: "'Inter', sans-serif", display: 'flex' as const },
    sidebar: { width: '220px', background: 'linear-gradient(180deg, #13161f 0%, #0f1117 100%)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 0', display: 'flex' as const, flexDirection: 'column' as const, position: 'fixed' as const, top: 0, left: 0, height: '100vh', zIndex: 200, transition: 'transform 0.3s ease' as const, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-220px)' },
    main: { flex: 1, padding: '0', minHeight: '100vh', display: 'flex' as const, flexDirection: 'column' as const },
    card: { background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' },
    input: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#f0f0f0' },
    label: { fontSize: '11px', color: '#6b7280', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  return (
    <div style={styles.page}>

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:199}}/>
      )}

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f0f0f0' }}>
              Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
              {planLoaded && plan === 'pro' && (
                <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: planLoaded && plan === 'pro' ? '#1D9E75' : '#8b8fa8', marginTop: '4px', fontWeight: plan === 'pro' ? '500' : '400' }}>
              {planLoaded && plan === 'pro' ? '✦ Pro Workspace' : 'AI Assistant for Agents'}
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            style={{background:'none',border:'none',color:'#6b7280',fontSize:'20px',cursor:'pointer',padding:'0',marginTop:'4px'}}>✕</button>
        </div>

        <div style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' as const }}>
          <div style={{padding:'0 0.75rem', marginBottom:'8px'}}>
            <p style={{fontSize:'10px',fontWeight:'700',color:'#444',letterSpacing:'1px',margin:'0 0 6px',padding:'0 0.75rem'}}>WORKSPACE</p>
            {navItems.map(item => (
              <button key={item.key}
                onClick={() => { !item.disabled && setActivePage(item.key); setSidebarOpen(false) }}
                style={{
                  width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px',
                  background: activePage === item.key ? 'rgba(29,158,117,0.15)' : 'transparent',
                  border: 'none', borderRadius: '8px',
                  borderLeft: activePage === item.key ? '3px solid #1D9E75' : '3px solid transparent',
                  color: activePage === item.key ? '#1D9E75' : item.disabled ? '#333' : '#8b8fa8',
                  fontSize: '13px', fontWeight: activePage === item.key ? '600' : '400',
                  cursor: item.disabled ? 'not-allowed' : 'pointer', textAlign: 'left' as const,
                  boxShadow: activePage === item.key ? '0 0 12px rgba(29,158,117,0.1)' : 'none',
                  transition: 'all 0.15s', marginBottom: '2px',
                }}>
                <span style={{fontSize:'15px'}}>{item.icon}</span>
                <div>
                  <div>{item.label}</div>
                  {activePage === item.key && <div style={{fontSize:'10px',color:'#1D9E75',opacity:0.7,fontWeight:'400'}}>{item.desc}</div>}
                </div>
                {activePage === item.key && <span style={{marginLeft:'auto',fontSize:'16px',color:'#1D9E75'}}>›</span>}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.5rem 0.75rem' }} />
          <p style={{fontSize:'10px',fontWeight:'700',color:'#444',letterSpacing:'1px',margin:'0 0 6px',padding:'0 1.5rem'}}>TOOLS</p>

          {[
            { href: '/quick-listing', icon: '⚡', label: 'Quick Listing' },
            { href: '/snap-start', icon: '📸', label: 'Snap & Start' },
            { href: '/photos', icon: '🖼️', label: 'Photo Library' },
            { href: '/seller-prep', icon: '📋', label: 'Seller Prep' },
            { href: '/rewrite', icon: '✨', label: 'Rewrite' },
            { href: '/launch-kit', icon: '🚀', label: 'Launch Kit' },
            { href: '/leads', icon: '👥', label: 'Leads & Clients' },
            { href: '/settings', icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <a key={item.href} href={item.href}
              style={{ width: '100%', padding: '10px 1.5rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#8b8fa8', fontSize: '13px', textDecoration: 'none', borderLeft: '3px solid transparent' }}>
              <span>{item.icon}</span> {item.label}
            </a>
          ))}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {plan === 'starter' && (
            <a href="/pricing" onClick={() => trackUpgradeClick('sidebar', plan)}
              style={{ display: 'block', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', padding: '12px', borderRadius: '10px', textAlign: 'center', textDecoration: 'none', fontSize: '12px', fontWeight: '600', marginBottom: '8px', boxShadow: '0 0 20px rgba(29,158,117,0.25)', lineHeight: '1.6' }}>
              ⚡ Upgrade to Pro<br/>
              <span style={{ fontSize: '10px', fontWeight: '400', opacity: 0.85 }}>Unlimited listings, rewrites & launch kits</span>
            </a>
          )}
          {plan === 'starter' && (
            <div style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginBottom: '10px' }}>
              {listingCredits > 0 ? `${listingCredits} credit${listingCredits > 1 ? 's' : ''} remaining` : remaining > 0 ? `${remaining} free listing${remaining > 1 ? 's' : ''} left` : '⚠️ No listings left'}
            </div>
          )}
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScCLYVYMcFti8uxW4_3T7nhHK__AdYfsUEeB1WfGIAE2SHgJg/viewform?usp=publish-editor" target="_blank"
            style={{ display: 'block', fontSize: '12px', color: '#1D9E75', textAlign: 'center', textDecoration: 'none', marginBottom: '6px', fontWeight: '500' }}>
            💬 Give Feedback
          </a>
          <a href="/contact"
            style={{ display: 'block', fontSize: '12px', color: '#6b7280', textAlign: 'center', textDecoration: 'none', marginBottom: '8px' }}>
            📧 Contact Us
          </a>
          <a href="/" style={{ display: 'block', fontSize: '12px', color: '#666', textAlign: 'center', textDecoration: 'none' }}>Sign out</a>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* MOBILE HEADER */}
        <div style={{background:'rgba(13,17,23,0.95)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(10px)'}}>
          <button onClick={() => setSidebarOpen(true)}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.1)',color:'#f0f0f0',fontSize:'18px',cursor:'pointer',padding:'4px 10px',borderRadius:'8px'}}>
            ☰
          </button>
          <div style={{fontSize:'15px',fontWeight:'700',color:'#f0f0f0'}}>
            Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
            {planLoaded && plan === 'pro' && (
              <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle'}}>PRO</span>
            )}
          </div>
          <a href="/pricing" style={{fontSize:'12px',color: plan === 'pro' ? '#1D9E75' : '#6b7280',textDecoration:'none',fontWeight:'500'}}>
            {plan === 'pro' ? '✦ Pro' : '⚡ Upgrade'}
          </a>
        </div>

        {/* CONTENT */}
        <div style={{padding:'2rem',flex:1}}>

          {/* GENERATE PAGE */}
          {activePage === 'generate' && (
            <div style={{ display: 'grid', gridTemplateColumns: outputs ? 'minmax(320px, 1fr) minmax(320px, 1fr)' : '1fr', gap: '1.5rem', maxWidth: outputs ? '100%' : '760px', transition: 'all 0.3s', alignItems: 'start' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f0f0f0', margin: '0' }}>New Listing</h1>
                  <span style={{ background: 'rgba(29,158,117,0.15)', color: '#1D9E75', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(29,158,117,0.3)' }}>11 formats in one click</span>
                </div>
                <p style={{ fontSize: '14px', color: '#8b8fa8' }}>Fill in the property details below — your AI assistant will generate MLS copy, social posts, email blasts, and more instantly.</p>
              </div>

              <div style={{ ...styles.card, marginBottom: '1rem' }}>
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #2a2d3a' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#1D9E75', letterSpacing: '1px', margin: '0' }}>PROPERTY DETAILS</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.label}>Listing name</label>
                    <input placeholder="123 Oak Street" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Property type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={styles.select}>
                      <option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Beds / Baths</label>
                    <input placeholder="3 bed / 2 bath" value={form.beds} onChange={e => setForm({ ...form, beds: e.target.value })} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Sq Ft</label>
                    <input placeholder="1,850" value={form.sqft} onChange={e => setForm({ ...form, sqft: e.target.value })} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Price</label>
                    <input placeholder="$899,000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={styles.input} />
                  </div>
                  <div>
                    <label style={styles.label}>Neighborhood</label>
                    <input placeholder="Newport Beach, CA" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} style={styles.input} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px', borderBottom: '1px solid #2a2d3a', paddingBottom: '16px', borderTop: '1px solid #2a2d3a', paddingTop: '16px', marginTop: '4px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 12px' }}>FEATURES & MARKETING</p>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={styles.label}>Key features <span style={{ color: '#555', fontWeight: '400', textTransform: 'none' as const }}>— the more detail, the better the copy</span></label>
                    <input placeholder="Ocean views, chef's kitchen, spa bath, 3-car garage, solar..." value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} style={styles.input} />
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                      {["Ocean views","Chef's kitchen","Spa bath","3-car garage","Solar panels","Pool","Open floor plan","Natural light","Updated finishes","Smart home","Walk-in closet","Outdoor entertaining"].map(chip => (
                        <button key={chip} onClick={() => {
                          const current = form.features
                          const already = current.toLowerCase().includes(chip.toLowerCase())
                          if (!already) setForm({ ...form, features: current ? current + ', ' + chip : chip })
                        }}
                          style={{ padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', color: '#6b7280', fontSize: '11px', cursor: 'pointer' }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#1D9E75'; e.currentTarget.style.color = '#1D9E75' }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#6b7280' }}>
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={styles.label}>Tone</label>
                    <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })} style={styles.select}>
                      <option>Professional</option><option>Luxury & aspirational</option><option>Warm & inviting</option><option>Modern & minimal</option><option>Family-friendly</option><option>Investment-focused</option>
                    </select>
                  </div>
                  <div>
                    <label style={styles.label}>Target buyer</label>
                    <select value={form.buyer} onChange={e => setForm({ ...form, buyer: e.target.value })} style={styles.select}>
                      <option>Move-up families</option><option>Luxury buyers</option><option>First-time buyers</option><option>Investors</option><option>Downsizers</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={styles.label}>Additional notes</label>
                  <textarea placeholder="Anything extra — seller story, open house date, urgency..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ ...styles.input, minHeight: '70px', resize: 'vertical' as const }} />
                </div>

                <div style={{ borderTop: '1px solid #2a2d3a', paddingTop: '16px' }}>
                  <button onClick={generate} disabled={loading}
                    style={{ width: '100%', padding: '16px', background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75 0%,#085041 100%)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px', boxShadow: loading ? 'none' : '0 0 30px rgba(29,158,117,0.3)' }}>
                    {loading ? '⏳ Generating your listing...' : '✨ Generate 11 Formats — MLS, Social, Email & More'}
                  </button>
                  <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '8px' }}>Takes about 15-20 seconds · Your brand voice is applied automatically</p>
                </div>
              </div>

              {loading && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
                  <p style={{ color: '#f0f0f0', fontWeight: '600', marginBottom: '6px' }}>Generating 11 marketing formats...</p>
                  <p style={{ color: '#8b8fa8', fontSize: '13px' }}>This takes about 15-20 seconds. Please don't close this page!</p>
                </div>
              )}

              {/* MOBILE APP BANNER */}
              <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.1),rgba(8,80,65,0.1))',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.2)',padding:'1rem',marginBottom:'1rem'}}>
                <p style={{fontSize:'12px',fontWeight:'700',color:'#1D9E75',marginBottom:'6px',letterSpacing:'0.5px'}}>📱 USE ON YOUR PHONE</p>
                <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'10px',lineHeight:'1.6'}}>Add Listing Whisperer to your home screen for instant access on-site!</p>
                <div style={{fontSize:'12px',color:'#8b8fa8',lineHeight:'2'}}>
                  <p style={{margin:'0',fontWeight:'600',color:'#f0f0f0',marginBottom:'4px'}}>iPhone (Safari):</p>
                  <p style={{margin:'0'}}>1. Tap the Share button ⬆️</p>
                  <p style={{margin:'0'}}>2. Tap "Add to Home Screen"</p>
                  <p style={{margin:'0'}}>3. Tap "Add" ✅</p>
                  <p style={{margin:'8px 0 4px',fontWeight:'600',color:'#f0f0f0'}}>Android (Chrome):</p>
                  <p style={{margin:'0'}}>1. Tap the menu ⋮</p>
                  <p style={{margin:'0'}}>2. Tap "Add to Home Screen"</p>
                  <p style={{margin:'0'}}>3. Tap "Add" ✅</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#1D9E75', letterSpacing: '1px', margin: '0 0 12px' }}>YOUR AI TOOLKIT</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {[
                  { href: '/quick-listing', icon: '⚡', title: 'Quick Listing', desc: 'Photo → Full listing' },
                  { href: '/leads', icon: '👥', title: 'Leads & Clients', desc: 'Track your pipeline' },
                  { href: '/snap-start', icon: '📸', title: 'Snap & Start', desc: 'Start from photos' },
                  { href: '/seller-prep', icon: '📋', title: 'Seller Prep', desc: 'Meeting preparation' },
                  { href: '/launch-kit', icon: '🚀', title: 'Launch Kit', desc: '7-day plan' },
                  { href: '/rewrite', icon: '✨', title: 'Rewriter', desc: 'Polish existing copy' },
                ].map(item => (
                  <a key={item.href} href={item.href}
                    style={{ ...styles.card, textDecoration: 'none', display: 'block', padding: '1rem', transition: 'border-color 0.2s' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f0f0', marginBottom: '2px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#8b8fa8' }}>{item.desc}</div>
                  </a>
                ))}
              </div>
            {/* INLINE RESULTS - shows to the right when outputs exist */}
            {outputs && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' }}>🎉 Ready!</h2>
                    <p style={{ fontSize: '13px', color: '#8b8fa8' }}>11 formats generated</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '1rem' }}>
                  {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      style={{
                        padding: '5px 10px', borderRadius: '8px', border: '1px solid', fontSize: '11px', cursor: 'pointer',
                        borderColor: activeTab === t.key ? '#1D9E75' : '#2a2d3a',
                        background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                        color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                        fontWeight: activeTab === t.key ? '600' : '400',
                      }}>
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', padding: '1.25rem', position: 'relative', marginBottom: '1rem', minHeight: '200px' }}>
                  <button onClick={handleCopy}
                    style={{ position: 'absolute', top: '12px', right: '12px', padding: '5px 12px', borderRadius: '20px', border: '1px solid', fontSize: '11px', cursor: 'pointer', background: copied ? '#1D9E75' : 'transparent', color: copied ? '#fff' : '#8b8fa8', borderColor: copied ? '#1D9E75' : '#2a2d3a' }}>
                    {copied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                  <p style={{ fontSize: '13px', lineHeight: '1.9', whiteSpace: 'pre-wrap' as const, color: '#e0e0e0', margin: '0', paddingRight: '80px' }}>
                    {outputs[activeTab] || ''}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                  <button onClick={() => handleDownloadPdf('mls')} disabled={generatingPdf}
                    style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '12px', cursor: 'pointer' }}>
                    📄 MLS PDF
                  </button>
                  <button onClick={() => handleDownloadPdf('flyer')} disabled={generatingPdf}
                    style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '12px', cursor: 'pointer' }}>
                    🏠 Flyer PDF
                  </button>
                  <a href="/launch-kit"
                    style={{ padding: '7px 12px', background: 'rgba(29,158,117,0.15)', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', fontSize: '12px', textDecoration: 'none' }}>
                    🚀 Launch Kit
                  </a>
                  <button onClick={() => setOutputs(null)}
                    style={{ padding: '7px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#6b7280', fontSize: '12px', cursor: 'pointer' }}>
                    🔄 Clear
                  </button>
                </div>
              </div>
            )}
            </div>
          )}

          {/* RESULTS PAGE */}
          {activePage === 'results' && outputs && (
            <div style={{ maxWidth: '760px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f0f0f0', marginBottom: '4px' }}>🎉 Your listing is ready!</h1>
                  <p style={{ fontSize: '14px', color: '#8b8fa8' }}>11 formats generated — click any tab to view and copy</p>
                </div>
                <button onClick={() => setActivePage('generate')}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '13px', cursor: 'pointer' }}>
                  ← New Listing
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px', marginBottom: '1rem' }}>
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: '6px 12px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: activeTab === t.key ? '600' : '400',
                      borderColor: activeTab === t.key ? '#1D9E75' : '#2a2d3a',
                      background: activeTab === t.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                      color: activeTab === t.key ? '#1D9E75' : '#6b7280',
                      boxShadow: activeTab === t.key ? '0 0 12px rgba(29,158,117,0.2)' : 'none'
                    }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              <div style={{ ...styles.card, position: 'relative', marginBottom: '1rem' }}>
                <button onClick={handleCopy}
                  style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 16px', borderRadius: '20px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: '500', background: copied ? '#1D9E75' : 'transparent', color: copied ? '#fff' : '#8b8fa8', borderColor: copied ? '#1D9E75' : '#2a2d3a' }}>
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
                <p style={{ fontSize: '14px', lineHeight: '1.9', whiteSpace: 'pre-wrap' as const, color: '#e0e0e0', margin: '0', paddingRight: '90px' }}>
                  {outputs[activeTab] || ''}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <button onClick={() => handleDownloadPdf('mls')} disabled={generatingPdf}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '13px', cursor: 'pointer' }}>
                  📄 MLS Sheet PDF
                </button>
                <button onClick={() => handleDownloadPdf('flyer')} disabled={generatingPdf}
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '13px', cursor: 'pointer' }}>
                  🏠 Flyer PDF
                </button>
                <a href="/launch-kit"
                  style={{ padding: '8px 16px', background: 'rgba(29,158,117,0.15)', border: '1px solid #1D9E75', borderRadius: '8px', color: '#1D9E75', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                  🚀 7-Day Launch Kit
                </a>
                <a href="/rewrite"
                  style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#8b8fa8', fontSize: '13px', textDecoration: 'none' }}>
                  ✨ Rewrite & Improve
                </a>
              </div>
            </div>
          )}

          {/* HISTORY PAGE */}
          {activePage === 'history' && (
            <div style={{ maxWidth: '760px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f0f0f0', marginBottom: '6px' }}>Listing History</h1>
                <p style={{ fontSize: '14px', color: '#8b8fa8' }}>Your {pastListings.length} most recent listings</p>
              </div>

              {pastListings.length === 0 ? (
                <div style={{ ...styles.card, textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#8b8fa8' }}>No listings yet — generate your first one!</p>
                  <button onClick={() => setActivePage('generate')}
                    style={{ marginTop: '1rem', padding: '10px 24px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    Generate a Listing
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                  {pastListings.map(listing => (
                    <div key={listing.id} style={{ ...styles.card }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                      onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}
                        onClick={() => { setOutputs(listing.outputs); setActiveTab('mls_standard'); setActivePage('generate') }}>
                        <div>
                          <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#f0f0f0' }}>
                            {listing.name || `${listing.property_type} — ${listing.neighborhood}`}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8b8fa8' }}>
                            {listing.beds_baths} · {listing.sqft} sq ft · {listing.price}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>{new Date(listing.created_at).toLocaleDateString()}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1D9E75', fontWeight: '500' }}>View copy →</p>
                        </div>
                      </div>
                      <textarea
                        placeholder="Agent notes: seller motivation, property quirks, things to remember..."
                        defaultValue={listing.agent_notes || ''}
                        onBlur={async (e) => { await supabase.from('listings').update({ agent_notes: e.target.value }).eq('id', listing.id) }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '12px', color: '#8b8fa8', minHeight: '60px', resize: 'vertical' as const, boxSizing: 'border-box' as const }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
          <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.3)',padding:'2.5rem',maxWidth:'480px',width:'100%',boxShadow:'0 0 60px rgba(29,158,117,0.15)',textAlign:'center',position:'relative'}}>
            <button onClick={() => setShowUpgradeModal(false)}
              style={{position:'absolute',top:'1rem',right:'1rem',background:'rgba(255,255,255,0.1)',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',fontSize:'16px',cursor:'pointer'}}>✕</button>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🚀</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>You've used your 2 free listings!</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'1.5rem',lineHeight:'1.7'}}>Upgrade to Pro or buy a single listing credit to keep generating.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'1.5rem',textAlign:'left'}}>
              <div style={{background:'rgba(0,0,0,0.2)',borderRadius:'12px',padding:'1.25rem',border:'1px solid rgba(255,255,255,0.07)'}}>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Pay Per Listing</p>
                <p style={{fontSize:'2rem',fontWeight:'700',color:'#1D9E75',marginBottom:'8px'}}>$9</p>
                <ul style={{fontSize:'12px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'0',listStyle:'none',marginBottom:'12px'}}>
                  <li>✅ 1 listing credit</li>
                  <li>✅ All 11 formats</li>
                  <li>✅ Never expires</li>
                </ul>
                <a href="/pricing" style={{display:'block',textAlign:'center',padding:'8px',borderRadius:'8px',background:'rgba(29,158,117,0.15)',color:'#1D9E75',textDecoration:'none',fontSize:'13px',fontWeight:'600',border:'1px solid rgba(29,158,117,0.3)'}}>
                  Buy 1 Listing
                </a>
              </div>
              <div style={{background:'linear-gradient(135deg,rgba(29,158,117,0.15),rgba(8,80,65,0.15))',borderRadius:'12px',padding:'1.25rem',border:'1px solid rgba(29,158,117,0.3)'}}>
                <p style={{fontSize:'13px',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Pro — Best Value</p>
                <p style={{fontSize:'2rem',fontWeight:'700',color:'#1D9E75',marginBottom:'8px'}}>$29<span style={{fontSize:'14px',color:'#6b7280'}}>/mo</span></p>
                <ul style={{fontSize:'12px',color:'#8b8fa8',lineHeight:'2',paddingLeft:'0',listStyle:'none',marginBottom:'12px'}}>
                  <li>✅ Unlimited listings</li>
                  <li>✅ Unlimited rewrites</li>
                  <li>✅ All features</li>
                </ul>
                <a href="/pricing" style={{display:'block',textAlign:'center',padding:'8px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontSize:'13px',fontWeight:'600',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
                  Go Pro
                </a>
              </div>
            </div>
            <p style={{fontSize:'12px',color:'#444'}}>Use code <strong style={{color:'#1D9E75'}}>WELCOME50</strong> for 50% off your first Pro month</p>
          </div>
        </div>
      )}
    </div>
  )
}