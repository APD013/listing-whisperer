'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useTheme } from '../lib/theme'
import { trackDashboardView, trackListingCreated, trackOutputCopied, trackUpgradeClick, trackPurchase } from '../lib/analytics'
import jsPDF from 'jspdf'
import { PDF_COLORS, pdfHeader, pdfAgentBar, pdfSectionHeader, pdfFooter, cleanPdfText } from '../lib/pdfStyles'
import OnboardingModal from '../components/OnboardingModal'
import DashboardChecklist from '../components/DashboardChecklist'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [userId, setUserId] = useState<string | null>(null)
  const [listingsUsed, setListingsUsed] = useState(0)
  const [trialEndsAt, setTrialEndsAt] = useState('')
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
  const [brandVoice, setBrandVoice] = useState<any>({})
  const [referralCopied, setReferralCopied] = useState(false)
  const [showReferralBanner, setShowReferralBanner] = useState(false)
  const [dueReminders, setDueReminders] = useState<any[]>([])
  const [showReminderPopup, setShowReminderPopup] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [currentListingId, setCurrentListingId] = useState<string | null>(null)
  const [listingNameInput, setListingNameInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{role:string,content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<Record<string,boolean>>({'win':true,'build':true,'launch':true,'manage':true})
  const [leads, setLeads] = useState<any[]>([])
  const [workspaceListing, setWorkspaceListing] = useState<any>(null)
  const [workspaceLeads, setWorkspaceLeads] = useState<number>(0)
  const [workspaceReminders, setWorkspaceReminders] = useState<number>(0)
  const [recentActivity, setRecentActivity] = useState<{type:string;text:string;created_at:string}[]>([])
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [totalReminders, setTotalReminders] = useState<number | null>(null)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [recentWorkspaces, setRecentWorkspaces] = useState<any[]>([])

  const [form, setForm] = useState({
    type: 'Single family', beds: '', baths: '', sqft: '', price: '',
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
    const savedPos = sessionStorage.getItem('lw_scroll_position')
    if (savedPos) {
      window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'instant' })
      sessionStorage.removeItem('lw_scroll_position')
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const upgraded = params.get('upgraded')
    const generateFromLead = params.get('generate')
    const leadNeighborhood = params.get('neighborhood')
    const leadPrice = params.get('price')
    const leadName = params.get('name')
    if (generateFromLead) {
      setForm(prev => ({...prev, neighborhood: decodeURIComponent(leadNeighborhood || ''), price: decodeURIComponent(leadPrice || ''), name: decodeURIComponent(leadName || '')}))
      setActivePage('generate')
      window.scrollTo({top:0,behavior:'smooth'})
    }
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('listings_used, plan, listing_credits, brand_voice, full_name, referral_code, trial_ends_at')
        .eq('id', user.id)
        .single()
      if (profile) {
        setListingsUsed(profile.listings_used || 0)
        setTrialEndsAt(profile.trial_ends_at || '')
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
            setBrandVoice(bv)
          } catch(e) {}
        }
      } else { setPlanLoaded(true) }
      const { data: listings } = await supabase
        .from('listings').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(10)
      if (listings) setPastListings(listings)
      const { data: leadsData } = await supabase
        .from('leads').select('id, name, status, created_at').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(5)
      if (leadsData) setLeads(leadsData)

      const { data: wsListing } = await supabase.from('listings').select('id, name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      if (wsListing && wsListing[0]) setWorkspaceListing(wsListing[0])
      const { data: wsLeadsAll } = await supabase.from('leads').select('id').eq('user_id', user.id)
      setWorkspaceLeads(wsLeadsAll ? wsLeadsAll.length : 0)
      const { data: wsRemindersData } = await supabase.from('reminders').select('id').eq('user_id', user.id).eq('sent', false).lte('remind_at', new Date().toISOString())
      setWorkspaceReminders(wsRemindersData ? wsRemindersData.length : 0)
      const { data: allRemindersData } = await supabase.from('reminders').select('id').eq('user_id', user.id)
      setTotalReminders(allRemindersData ? allRemindersData.length : 0)
      const { data: wsData } = await supabase.from('listing_workspaces').select('id, address, status, assets, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(3)
      if (wsData) setRecentWorkspaces(wsData)
      if (sessionStorage.getItem('lw_nudge_dismissed')) setNudgeDismissed(true)
      const [{ data: actListings }, { data: actLeads }, { data: actVideoKits }] = await Promise.all([
        supabase.from('listings').select('name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('leads').select('name, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('video_kits').select('video_goal, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
      ])
      const allActivity = [
        ...(actListings || []).map((l: any) => ({ type: 'listing', text: `Generated listing: ${l.name || 'Untitled'}`, created_at: l.created_at })),
        ...(actLeads || []).map((l: any) => ({ type: 'lead', text: `Added lead: ${l.name}`, created_at: l.created_at })),
        ...(actVideoKits || []).map((v: any) => ({ type: 'video', text: `Created video kit: ${v.video_goal || 'Video Kit'}`, created_at: v.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
      setRecentActivity(allActivity)

      if (upgraded) { setPlan('pro'); trackPurchase('pro') }

      // scroll restore handled by separate useEffect

      const checkReminders = async () => {
        const { data: reminders } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', user.id)
          .eq('sent', false)
          .lte('remind_at', new Date().toISOString())
        if (reminders && reminders.length > 0) {
          const dismissed = JSON.parse(sessionStorage.getItem('lw_dismissed_reminders') || '[]')
          const undismissed = reminders.filter((r: any) => !dismissed.includes(r.id))
          if (undismissed.length > 0) {
            setDueReminders(undismissed)
            setShowReminderPopup(true)
          }
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
    if (plan === 'starter' && listingCredits <= 0 && new Date() > new Date((trialEndsAt || ''))) { setShowUpgradeModal(true); return }
    setLoading(true)
    setOutputs(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property: {...form, beds: `${form.beds} bed${form.baths ? ' / ' + form.baths + ' bath' : ''}`}, userId })
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
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentWidth = pageWidth - margin * 2

      const sectionBg: [number, number, number] = [248, 250, 251]
      const textDark: [number, number, number] = [26, 26, 46]
      const textMid: [number, number, number] = [74, 85, 104]
      const green: [number, number, number] = [29, 158, 117]
      const borderLight: [number, number, number] = [226, 232, 240]

      const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number, lineHeight = 5.5) => {
        const cleaned = cleanPdfText(text)
        const lines = doc.splitTextToSize(cleaned, maxWidth)
        doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...textDark)
        doc.text(lines, x, yPos)
        return yPos + lines.length * lineHeight
      }

      const checkPageBreak = (yPos: number, needed = 30) => {
        if (yPos > pageHeight - needed) {
          pdfFooter(doc, brandVoice)
          doc.addPage()
          return 20
        }
        return yPos
      }

      if (type === 'mls') {
        let y = pdfHeader(doc, 'MLS Marketing Sheet', form.neighborhood || form.name || '')

        // Property details strip below header
        if (form.price || form.type || form.beds) {
          const details = [form.price, form.type, form.beds, form.sqft ? form.sqft + ' sq ft' : ''].filter(Boolean).join('  ·  ')
          doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...green)
          doc.text(details, margin, y)
          y += 8
        }

        // Agent bar
        if (brandVoice?.agentName || brandVoice?.phone) {
          y = pdfAgentBar(doc, brandVoice, y)
          y += 4
        }

        y = pdfSectionHeader(doc, 'MLS Description', y)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)

        y += 8; y = checkPageBreak(y)
        y = pdfSectionHeader(doc, 'Luxury MLS Version', y)
        y = addWrappedText(outputs.mls_luxury || '', margin, y, contentWidth)

        y += 8; y = checkPageBreak(y)
        y = pdfSectionHeader(doc, 'Email Blast', y)
        y = addWrappedText(outputs.email || '', margin, y, contentWidth)

        pdfFooter(doc, brandVoice)
        doc.save(`MLS-Sheet-${(form.neighborhood || form.name || 'listing').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)

      } else if (type === 'flyer') {
        let y = pdfHeader(doc, 'Property Flyer', form.neighborhood || form.name || '')

        // Price — large, centered
        doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.setTextColor(...green)
        doc.text(form.price || 'Price Upon Request', pageWidth / 2, y + 10, { align: 'center' })
        y += 14

        // Address
        doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(...textMid)
        doc.text(form.neighborhood || form.name || '', pageWidth / 2, y + 5, { align: 'center' })
        y += 12

        // Property specs bar
        const specs = [form.type, form.beds, form.sqft ? form.sqft + ' sq ft' : ''].filter(Boolean)
        if (specs.length > 0) {
          const specWidth = (contentWidth - (specs.length - 1) * 4) / specs.length
          specs.forEach((spec, i) => {
            const x = margin + i * (specWidth + 4)
            doc.setFillColor(...sectionBg)
            doc.roundedRect(x, y - 3, specWidth, 14, 2, 2, 'F')
            doc.setFillColor(...green)
            doc.rect(x, y - 3, specWidth, 1.5, 'F')
            doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...textDark)
            doc.text(spec, x + specWidth / 2, y + 6, { align: 'center' })
          })
          y += 18
        }

        y = pdfSectionHeader(doc, 'About This Home', y)
        y = addWrappedText(outputs.mls_standard || '', margin, y, contentWidth)

        if (form.features) {
          y += 8; y = checkPageBreak(y)
          y = pdfSectionHeader(doc, 'Key Features', y)
          const features = form.features.split(',').map((f: string) => f.trim()).filter(Boolean)
          doc.setFontSize(10); doc.setTextColor(...textDark)
          features.forEach((feature: string) => {
            y = checkPageBreak(y, 10)
            doc.setFillColor(...green)
            doc.circle(margin + 2, y - 1, 1, 'F')
            doc.text(feature, margin + 6, y)
            y += 6
          })
        }

        if (brandVoice?.agentName || brandVoice?.phone) {
          y += 8; y = checkPageBreak(y, 30)
          pdfAgentBar(doc, brandVoice, y)
        }

        pdfFooter(doc, brandVoice)
        doc.save(`Flyer-${(form.neighborhood || form.name || 'listing').replace(/[^a-zA-Z0-9]/g, '-')}.pdf`)
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

  const isDark = theme === 'dark'
  const styles = {
    page: { minHeight: '100vh', background: isDark ? '#111318' : '#f4f5f7', fontFamily: "var(--font-plus-jakarta), sans-serif", display: 'flex' as const, color: isDark ? '#f0f0f0' : '#111318' },
    sidebar: { width: '210px', background: isDark ? '#0d1018' : '#ffffff', borderRight: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.08)', display: 'flex' as const, flexDirection: 'column' as const, position: 'fixed' as const, top: 0, left: 0, height: '100vh', zIndex: 200, transition: 'transform 0.3s ease' as const, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-210px)' },
    main: { flex: 1, minHeight: '100vh', display: 'flex' as const, flexDirection: 'column' as const },
    card: { background: isDark ? 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)', padding: '1.5rem', boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)' },
    input: { width: '100%', padding: '11px 14px', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: isDark ? '#f0f0f0' : '#111318', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.04)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: isDark ? '#f0f0f0' : '#111318' },
    label: { fontSize: '11px', color: isDark ? '#6b7280' : '#5a6172', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = userName ? userName.split(' ')[0] : ''

  const getRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return new Date(dateStr).toLocaleDateString()
  }

  const buckets = [
    {
      label: 'WIN THE LISTING',
      color: '#8b5cf6',
      cards: [
        { icon: '📋', title: 'Seller Prep', desc: 'Prepare for your listing appointment', color: '#8b5cf6', href: '/seller-prep', priority: true },
        { icon: '🏠', title: 'Buyer Consultation', desc: 'Prepare for your buyer appointments', color: '#6366f1', href: '/buyer-consultation' },
        { icon: '💲', title: 'Pricing Assistant', desc: 'Get a data-backed price range and strategy', color: '#d4af37', href: '/pricing-assistant' },
        { icon: '📊', title: 'Market Snapshot', desc: 'Instant market analysis for any neighborhood', color: '#1D9E75', href: '/market-snapshot' },
        { icon: '🎯', title: 'Listing Presentation', desc: 'Build your full seller appointment deck', color: '#a78bfa', href: '/listing-presentation' },
        { icon: '🏆', title: 'Agent Portfolio', desc: 'Your shareable listing portfolio page', color: '#d4af37', href: '/agent-portfolio' },
        { icon: '⭐', title: 'Career Highlights', desc: 'Capture your favorite closing moments forever', color: '#f59e0b', href: '/career-highlights' },
        { icon: '🚨', title: 'Listing Rescue', desc: 'Diagnose why your listing is sitting and get a complete rescue plan', color: '#ef4444', href: '/listing-rescue' },
      ]
    },
    {
      label: 'BUILD THE LISTING',
      color: '#1D9E75',
      cards: [
        { icon: '✨', title: 'New Listing', desc: 'Full guided form → 11 marketing formats', color: '#1D9E75', action: () => { setActivePage('generate'); setOutputs(null); setCurrentListingId(null); setForm({type:'Single family',beds:'',baths:'',sqft:'',price:'',neighborhood:'',features:'',tone:'Professional',buyer:'Move-up families',notes:'',name:''}) } },
        { icon: '⚡', title: 'Quick Listing', desc: 'Faster manual start, fewer inputs', color: '#d4af37', href: '/quick-listing', popular: true, startHere: true, tooltip: 'Upload 1 photo → generate full listing marketing', priority: true },
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
        { icon: '📋', title: 'Open House Sign-In', desc: 'Tablet-friendly visitor sign-in sheet', color: '#1D9E75', href: '/open-house-signin' },
        { icon: '💰', title: 'Price Drop Kit', desc: 'Price improvement announcement suite', color: '#ef4444', href: '/price-drop' },
        { icon: '📬', title: 'Postcard Copy', desc: 'Just Listed & Just Sold postcard copy generator', color: '#6366f1', href: '/postcard-copy' },
        { icon: '🎬', title: 'Video Studio', desc: 'Turn one listing photo into a complete video ad kit', color: '#e1306c', href: '/video-studio', pro: true },
        { icon: '🤝', title: 'Referral Request', desc: 'Turn every closing into your next listing', color: '#10b981', href: '/referral-request' },
      ]
    },
    {
      label: 'MANAGE THE RELATIONSHIP',
      color: '#10b981',
      cards: [
        { icon: '✅', title: 'Transaction Checklist', desc: 'Track every step from listing to closing', color: '#1D9E75', href: '/transaction-checklist' },
        { icon: '⏰', title: 'Reminders', desc: 'Never miss a follow-up or deadline', color: '#f59e0b', href: '/reminders' },
        { icon: '👥', title: 'Leads & Clients', desc: 'Track your pipeline and contacts', color: '#10b981', href: '/leads' },
        { icon: '📈', title: 'Listing Performance', desc: 'Track days on market, price changes, showings, and offers', color: '#1D9E75', href: '/listing-performance' },
        { icon: '📩', title: 'Follow-Up Assistant', desc: 'Post-meeting and post-showing emails', color: '#6366f1', href: '/follow-up', priority: true },
        { icon: '💰', title: 'Seller Net Sheet', desc: 'Estimate seller proceeds before closing', color: '#1D9E75', href: '/seller-net-sheet' },
        { icon: '🧮', title: 'Commission Calculator', desc: 'Calculate your real take-home after splits and fees', color: '#d4af37', href: '/commission-calculator' },
        { icon: '🛡️', title: 'Objection Handler', desc: 'Turn any objection into a confident response', color: '#8b5cf6', href: '/objection-handler' },
        { icon: '🏘️', title: 'Neighborhood Bio', desc: 'Generate compelling neighborhood descriptions instantly', color: '#1D9E75', href: '/neighborhood-bio' },
        { icon: '🔄', title: 'Follow-Up Sequence', desc: 'Generate a complete follow-up sequence for any lead', color: '#6366f1', href: '/follow-up-sequence', priority: true },
      ]
    },
  ]

  const sidebarSections: Array<{key:string;label:string;color:string;items:Array<{icon:string;label:string;href?:string;action?:()=>void}>}> = [
    {
      key: 'win', label: 'Win the Listing', color: '#8b5cf6',
      items: [
        { href: '/seller-prep', icon: '📋', label: 'Seller Prep' },
        { href: '/buyer-consultation', icon: '🏠', label: 'Buyer Consultation' },
        { href: '/pricing-assistant', icon: '💲', label: 'Pricing Assistant' },
        { href: '/market-snapshot', icon: '📊', label: 'Market Snapshot' },
        { href: '/listing-presentation', icon: '🎯', label: 'Listing Presentation' },
        { href: '/agent-portfolio', icon: '🏆', label: 'Agent Portfolio' },
        { href: '/career-highlights', icon: '⭐', label: 'Career Highlights' },
        { href: '/listing-rescue', icon: '🚨', label: 'Listing Rescue' },
      ]
    },
    {
      key: 'build', label: 'Build the Listing', color: '#1D9E75',
      items: [
        { action: () => { setActivePage('generate'); setOutputs(null); setCurrentListingId(null); setForm({type:'Single family',beds:'',baths:'',sqft:'',price:'',neighborhood:'',features:'',tone:'Professional',buyer:'Move-up families',notes:'',name:''}); setSidebarOpen(false) }, icon: '✨', label: 'New Listing' },
        { href: '/quick-listing', icon: '⚡', label: 'Quick Listing' },
        { href: '/snap-start', icon: '📸', label: 'Snap & Start' },
        { href: '/rewrite', icon: '✍️', label: 'Rewrite' },
        { href: '/photos', icon: '🖼️', label: 'Photo Library' },
        { href: '/virtual-staging', icon: '🛋️', label: 'Virtual Staging' },
      ]
    },
    {
      key: 'launch', label: 'Launch the Listing', color: '#f59e0b',
      items: [
        { href: '/launch-kit', icon: '🚀', label: 'Launch Plan' },
        { href: '/social-planner', icon: '📅', label: 'Social Planner' },
        { href: '/open-house', icon: '🏡', label: 'Open House Kit' },
        { href: '/open-house-signin', icon: '📋', label: 'Open House Sign-In' },
        { href: '/price-drop', icon: '💰', label: 'Price Drop Kit' },
        { href: '/postcard-copy', icon: '📬', label: 'Postcard Copy' },
        { href: '/video-studio', icon: '🎬', label: 'Video Studio' },
        { href: '/referral-request', icon: '🤝', label: 'Referral Request' },
      ]
    },
    {
      key: 'manage', label: 'Manage the Relationship', color: '#10b981',
      items: [
        { href: '/transaction-checklist', icon: '✅', label: 'Transaction Checklist' },
        { href: '/reminders', icon: '⏰', label: 'Reminders' },
        { href: '/leads', icon: '👥', label: 'Leads & Clients' },
        { href: '/listing-performance', icon: '📈', label: 'Listing Performance' },
        { href: '/follow-up', icon: '📩', label: 'Follow-Up Assistant' },
        { href: '/seller-net-sheet', icon: '💰', label: 'Seller Net Sheet' },
        { href: '/commission-calculator', icon: '🧮', label: 'Commission Calculator' },
        { href: '/objection-handler', icon: '🛡️', label: 'Objection Handler' },
        { href: '/neighborhood-bio', icon: '🏘️', label: 'Neighborhood Bio' },
        { href: '/follow-up-sequence', icon: '🔄', label: 'Follow-Up Sequence' },
      ]
    },
  ]

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('lw_dashboard_scroll')
    if (savedScroll) {
      const scrollTo = parseInt(savedScroll)
      sessionStorage.removeItem('lw_dashboard_scroll')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: scrollTo, behavior: 'instant' })
        })
      })
    }
  }, [pastListings])

  return (
    <div style={styles.page}>

      <OnboardingModal />

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

          <div style={{margin:'0.75rem 1.25rem',borderTop:'1px solid rgba(0,0,0,0.06)'}}/>

          <a href="/workspaces"
            style={{width:'100%',padding:'9px 1.25rem',display:'flex',alignItems:'center',gap:'9px',background:'transparent',color:'var(--lw-text-muted)',fontSize:'12px',fontWeight:'600',textDecoration:'none',borderLeft:'2px solid transparent',transition:'all 0.15s',marginBottom:'4px'}}
            onMouseOver={e => {e.currentTarget.style.color='#1D9E75';e.currentTarget.style.borderLeftColor='#1D9E75';e.currentTarget.style.background='rgba(29,158,117,0.06)'}}
            onMouseOut={e => {e.currentTarget.style.color='var(--lw-text-muted)';e.currentTarget.style.borderLeftColor='transparent';e.currentTarget.style.background='transparent'}}>
            <span style={{fontSize:'13px'}}>📁</span>
            My Workspaces
          </a>

          <div style={{margin:'0 1.25rem 0.5rem',borderTop:'1px solid rgba(0,0,0,0.06)'}}/>

          {sidebarSections.map(section => (
            <div key={section.key}>
              <button
                onClick={() => setSidebarCollapsed(prev => ({...prev, [section.key]: !prev[section.key]}))}
                style={{width:'100%',padding:'8px 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',background:'none',border:'none',cursor:'pointer',textAlign:'left' as const}}>
                <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{width:'7px',height:'7px',borderRadius:'50%',background:section.color,display:'inline-block',flexShrink:0}}/>
                  <span style={{fontSize:'10px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'0.8px'}}>{section.label.toUpperCase()}</span>
                </span>
                <span style={{fontSize:'11px',color:'var(--lw-text-muted)',transform:sidebarCollapsed[section.key] ? 'rotate(-90deg)' : 'rotate(0deg)',transition:'transform 0.2s',display:'inline-block',lineHeight:1}}>▾</span>
              </button>
              <div style={{maxHeight:sidebarCollapsed[section.key] ? '0' : '600px',overflow:'hidden',transition:'max-height 0.3s ease'}}>
                {section.items.map((item, idx) => (
                  item.action ? (
                    <button key={idx} onClick={item.action}
                      style={{width:'100%',padding:'6px 1.25rem 6px 2.5rem',display:'flex',alignItems:'center',gap:'8px',color:'var(--lw-text-muted)',fontSize:'12px',background:'none',border:'none',borderLeft:'2px solid transparent',cursor:'pointer',textAlign:'left' as const,transition:'color 0.15s',fontFamily:'var(--font-plus-jakarta),sans-serif'}}
                      onMouseOver={e => {e.currentTarget.style.color='var(--lw-text)';e.currentTarget.style.borderLeftColor=section.color}}
                      onMouseOut={e => {e.currentTarget.style.color='var(--lw-text-muted)';e.currentTarget.style.borderLeftColor='transparent'}}>
                      <span style={{fontSize:'12px'}}>{item.icon}</span> {item.label}
                    </button>
                  ) : (
                    <a key={idx} href={item.href}
                      style={{width:'100%',padding:'6px 1.25rem 6px 2.5rem',display:'flex',alignItems:'center',gap:'8px',color:'var(--lw-text-muted)',fontSize:'12px',textDecoration:'none',borderLeft:'2px solid transparent',transition:'color 0.15s'}}
                      onMouseOver={e => {e.currentTarget.style.color='var(--lw-text)';e.currentTarget.style.borderLeftColor=section.color}}
                      onMouseOut={e => {e.currentTarget.style.color='var(--lw-text-muted)';e.currentTarget.style.borderLeftColor='transparent'}}>
                      <span style={{fontSize:'12px'}}>{item.icon}</span> {item.label}
                    </a>
                  )
                ))}
              </div>
            </div>
          ))}

          <div style={{margin:'0.5rem 1.25rem',borderTop:'1px solid rgba(0,0,0,0.06)'}}/>
          <a href="/settings"
            style={{width:'100%',padding:'8px 1.25rem',display:'flex',alignItems:'center',gap:'9px',color:'var(--lw-text-muted)',fontSize:'12px',textDecoration:'none',borderLeft:'2px solid transparent',transition:'color 0.15s'}}
            onMouseOver={e => {e.currentTarget.style.color='var(--lw-text)'}}
            onMouseOut={e => {e.currentTarget.style.color='var(--lw-text-muted)'}}>
            <span style={{fontSize:'12px'}}>⚙️</span> Settings
          </a>
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
              {listingCredits > 0 ? `${listingCredits} credit${listingCredits > 1 ? 's' : ''} remaining` : '✅ 24 hours of Pro — unlimited listings'}
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
        <div style={{background: isDark ? 'rgba(10,13,20,0.98)' : 'rgba(255,255,255,0.98)',borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.08)',padding:'0.75rem 1.25rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100,backdropFilter:'blur(16px)'}}>
          <button onClick={() => setSidebarOpen(true)}
            style={{background:'none',border:'1px solid rgba(255,255,255,0.07)',color:'#5a5f72',fontSize:'15px',cursor:'pointer',padding:'5px 10px',borderRadius:'7px'}}>
            ☰
          </button>
          <div style={{fontSize:'14px',fontWeight:'700',color: isDark ? '#f0f0f0' : '#111318'}}>
            Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
            {planLoaded && plan === 'pro' && (
              <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <button onClick={toggleTheme}
              style={{background:'none',border:'1px solid rgba(255,255,255,0.07)',color:'#6b7280',fontSize:'14px',cursor:'pointer',padding:'5px 10px',borderRadius:'7px',transition:'all 0.2s'}}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <a href="/pricing" style={{fontSize:'11px',color: plan === 'pro' ? '#d4af37' : '#444',textDecoration:'none',fontWeight:'600'}}>
              {plan === 'pro' ? '✦ Pro' : 'Upgrade'}
            </a>
          </div>
        </div>

        <div style={{padding:'2.5rem 1.5rem 3rem',flex:1,maxWidth:'860px',width:'100%',margin:'0 auto'}}>

          {/* HOME PAGE */}
          {activePage === 'home' && (
            <div>
              <DashboardChecklist />
              {planLoaded && !nudgeDismissed && totalReminders !== null && (() => {
                const nudge = pastListings.length === 0
                  ? { msg: 'Ready to build your first listing? Try Quick Listing →', href: '/quick-listing' }
                  : workspaceLeads === 0
                  ? { msg: 'Start tracking your clients — add your first lead →', href: '/leads' }
                  : totalReminders === 0
                  ? { msg: 'Never miss a follow-up — set your first reminder →', href: '/reminders' }
                  : null
                if (!nudge) return null
                return (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',background:'rgba(29,158,117,0.07)',border:'1px solid rgba(29,158,117,0.18)',borderRadius:'12px',padding:'12px 16px',marginBottom:'1.5rem',flexWrap:'wrap'}}>
                    <a href={nudge.href} style={{fontSize:'14px',fontWeight:'600',color:'#1D9E75',textDecoration:'none',flex:1}}>{nudge.msg}</a>
                    <button onClick={() => { setNudgeDismissed(true); sessionStorage.setItem('lw_nudge_dismissed','1') }}
                      style={{background:'none',border:'none',color:'var(--lw-text-muted,#888)',fontSize:'18px',lineHeight:1,cursor:'pointer',padding:'0 4px',flexShrink:0}}>✕</button>
                  </div>
                )
              })()}
              <div style={{marginBottom:'3rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',marginBottom:'8px'}}>
                  <div>
                    <h1 style={{fontSize:'2rem',fontWeight:'700',color: isDark ? '#f0f0f0' : '#111318',margin:'0 0 8px',letterSpacing:'-0.5px'}}>
                      {greeting}{firstName ? `, ${firstName}` : ''} 👋
                    </h1>
                    <p style={{fontSize:'15px',color: isDark ? '#8b8fa8' : '#5a6172',margin:'0',fontWeight:'400'}}>
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
                          {listingCredits > 0 ? `${listingCredits} credit${listingCredits > 1 ? 's' : ''} left` : '✅ 24 hours unlimited'}
                        </div>
                        <div style={{fontSize:'10px',color:'#1D9E75',marginTop:'2px',fontWeight:'500'}}>Upgrade to Pro →</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* ACTION-FIRST SECTION */}
              <div style={{marginBottom:'3rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1.2px',margin:'0 0 16px'}}>WHAT DO YOU NEED TO DO RIGHT NOW?</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'14px'}}>
                  {[
                    { icon:'🏠', label:'Start a Listing', desc:'Create a full listing from photos and notes in minutes', color:'#1D9E75', action: () => { setActivePage('generate'); window.scrollTo({top:0,behavior:'smooth'}) } },
                    { icon:'📋', label:'Prep a Meeting', desc:'Walk into your next appointment fully prepared', color:'#8b5cf6', href:'/seller-prep', tooltip:'Use this before your next listing appointment' },
                    { icon:'✦', label:'Ask AI', desc:'Get instant answers to any real estate question', color:'#6366f1', action: () => { const btn = document.querySelector('[data-chat-toggle]') as HTMLElement; btn?.click() }, tooltip:'Ask about pricing, strategy, follow-ups, or anything real estate' },
                    { icon:'👥', label:'Follow Up a Lead', desc:'Turn conversations into signed clients', color:'#f59e0b', href:'/leads' },
                    { icon:'📁', label:'My Workspaces', desc:'All your listing assets in one place — copy, photos, follow-ups, and more', color:'#1D9E75', href:'/workspaces' },
                  ].map((item, i) => (
                    item.href ? (
                      <a key={i} href={item.href}
                        title={(item as any).tooltip || undefined}
                        style={{display:'block',background:'var(--lw-card)',borderRadius:'16px',border:'1px solid var(--lw-border)',padding:'1.5rem',textDecoration:'none',transition:'all 0.18s',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',cursor:'pointer'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor=item.color;e.currentTarget.style.boxShadow=`0 8px 32px ${item.color}22`;e.currentTarget.style.transform='translateY(-2px)'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateY(0)'}}>
                        <div style={{width:'46px',height:'46px',borderRadius:'13px',background:`${item.color}18`,border:`1px solid ${item.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',marginBottom:'14px'}}>{item.icon}</div>
                        <p style={{fontSize:'15px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 7px'}}>{item.label}</p>
                        <p style={{fontSize:'13px',color:'var(--lw-text-muted)',margin:'0',lineHeight:'1.6',fontWeight:'400'}}>{item.desc}</p>
                      </a>
                    ) : (
                      <div key={i}
                        onClick={item.action}
                        title={(item as any).tooltip || undefined}
                        style={{background:'var(--lw-card)',borderRadius:'16px',border:'1px solid var(--lw-border)',padding:'1.5rem',transition:'all 0.18s',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',cursor:'pointer'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor=item.color;e.currentTarget.style.boxShadow=`0 8px 32px ${item.color}22`;e.currentTarget.style.transform='translateY(-2px)'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateY(0)'}}>
                        <div style={{width:'46px',height:'46px',borderRadius:'13px',background:`${item.color}18`,border:`1px solid ${item.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',marginBottom:'14px'}}>{item.icon}</div>
                        <p style={{fontSize:'15px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 7px'}}>{item.label}</p>
                        <p style={{fontSize:'13px',color:'var(--lw-text-muted)',margin:'0',lineHeight:'1.6',fontWeight:'400'}}>{item.desc}</p>
                      </div>
                    )
                  ))}
                </div>

                <div style={{marginTop:'14px',display:'flex',flexWrap:'wrap',gap:'8px',alignItems:'center'}}>
                  <span style={{fontSize:'11px',color:'var(--lw-text-muted)',fontWeight:'600',flexShrink:0}}>Try asking:</span>
                  {[
                    'How should I price this listing?',
                    'What do I say to a hesitant seller?',
                    'Create a follow-up text after a showing',
                    'What should I do next with this lead?',
                  ].map(prompt => (
                    <button key={prompt}
                      onClick={() => window.dispatchEvent(new CustomEvent('lw-chat-prompt', { detail: prompt }))}
                      style={{padding:'5px 13px',borderRadius:'20px',border:'1px solid var(--lw-border)',background:'var(--lw-input)',color:'var(--lw-text-muted)',fontSize:'12px',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif',transition:'all 0.15s'}}
                      onMouseOver={e => {e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#6366f1';e.currentTarget.style.background='rgba(99,102,241,0.06)'}}
                      onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.color='var(--lw-text-muted)';e.currentTarget.style.background='var(--lw-input)'}}>
                      {prompt}
                    </button>
                  ))}
                </div>

                <div style={{textAlign:'center',marginTop:'22px'}}>
                  <button onClick={() => document.getElementById('all-tools')?.scrollIntoView({behavior:'smooth'})}
                    style={{padding:'10px 24px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'20px',color:'var(--lw-text-muted)',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>
                    Browse All Tools ↓
                  </button>
                </div>
              </div>

              {/* TODAY'S WORKSPACE */}
              <div style={{marginBottom:'2.5rem',background:'var(--lw-card)',borderRadius:'16px',border:'1px solid var(--lw-border)',padding:'1.5rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1.2px',margin:'0 0 16px',display:'flex',alignItems:'center',gap:'6px'}}>
                  <span>📋</span> TODAY'S WORKSPACE
                </p>
                {(workspaceListing || workspaceLeads > 0 || workspaceReminders > 0) ? (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px'}}>
                    <div style={{background:'var(--lw-input)',borderRadius:'12px',border:'1px solid var(--lw-border)',padding:'1rem'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'10px'}}>
                        <span style={{fontSize:'18px',flexShrink:0}}>🏠</span>
                        <p style={{margin:'0',fontSize:'13px',color:'var(--lw-text)',fontWeight:'600',lineHeight:'1.5'}}>
                          {workspaceListing ? `Continue: ${workspaceListing.name || 'Untitled Listing'}` : 'Start your first listing'}
                        </p>
                      </div>
                      {workspaceListing ? (
                        <button onClick={() => { setActivePage('generate'); window.scrollTo({top:0,behavior:'smooth'}) }}
                          style={{padding:'5px 12px',background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'#1D9E75',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>
                          → Open
                        </button>
                      ) : (
                        <a href="/quick-listing" style={{display:'inline-block',padding:'5px 12px',background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'#1D9E75',textDecoration:'none'}}>
                          → Quick Listing
                        </a>
                      )}
                    </div>
                    <div style={{background:'var(--lw-input)',borderRadius:'12px',border:'1px solid var(--lw-border)',padding:'1rem'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'10px'}}>
                        <span style={{fontSize:'18px',flexShrink:0}}>👥</span>
                        <p style={{margin:'0',fontSize:'13px',color:'var(--lw-text)',fontWeight:'600',lineHeight:'1.5'}}>
                          {workspaceLeads > 0 ? `You have ${workspaceLeads} lead${workspaceLeads > 1 ? 's' : ''} — follow up today` : 'No leads yet — add your first client'}
                        </p>
                      </div>
                      <a href="/leads" style={{display:'inline-block',padding:'5px 12px',background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'#1D9E75',textDecoration:'none'}}>
                        {workspaceLeads > 0 ? '→ View Leads' : '→ Add Lead'}
                      </a>
                    </div>
                    <div style={{background:'var(--lw-input)',borderRadius:'12px',border:'1px solid var(--lw-border)',padding:'1rem'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:'10px',marginBottom:'10px'}}>
                        <span style={{fontSize:'18px',flexShrink:0}}>⏰</span>
                        <p style={{margin:'0',fontSize:'13px',color:'var(--lw-text)',fontWeight:'600',lineHeight:'1.5'}}>
                          {workspaceReminders > 0 ? `${workspaceReminders} reminder${workspaceReminders > 1 ? 's' : ''} due today` : 'No reminders due'}
                        </p>
                      </div>
                      <a href="/reminders" style={{display:'inline-block',padding:'5px 12px',background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'#1D9E75',textDecoration:'none'}}>
                        {workspaceReminders > 0 ? '→ View' : '→ Set Reminder'}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{textAlign:'center',padding:'0.5rem 0 0.25rem'}}>
                    <p style={{fontSize:'14px',color:'var(--lw-text-muted)',margin:'0 0 16px',lineHeight:'1.6'}}>Your workspace is ready. Start a listing, ask AI, or add your first lead.</p>
                    <div style={{display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap'}}>
                      <button onClick={() => { setActivePage('generate'); window.scrollTo({top:0,behavior:'smooth'}) }}
                        style={{padding:'7px 16px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'var(--lw-text)',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>
                        Start Listing
                      </button>
                      <button onClick={() => window.dispatchEvent(new CustomEvent('lw-chat-prompt', { detail: '' }))}
                        style={{padding:'7px 16px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'var(--lw-text)',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>
                        Ask AI
                      </button>
                      <a href="/leads" style={{display:'inline-block',padding:'7px 16px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',fontWeight:'600',color:'var(--lw-text)',textDecoration:'none'}}>
                        Add Lead
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* RECENT WORKSPACES */}
              <div style={{marginBottom:'2.5rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <p style={{fontSize:'10px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1.2px',margin:0}}>RECENT WORKSPACES</p>
                  <a href="/workspaces" style={{fontSize:'11px',color:'#1D9E75',textDecoration:'none',fontWeight:'600'}}>View all →</a>
                </div>
                {recentWorkspaces.length === 0 ? (
                  <div style={{padding:'16px',background:'linear-gradient(135deg,rgba(29,158,117,0.05),rgba(29,158,117,0.02))',borderRadius:'12px',border:'1px solid rgba(29,158,117,0.15)'}}>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 5px'}}>Start your first Listing Workspace</p>
                    <p style={{fontSize:'12px',color:'var(--lw-text-muted)',margin:'0 0 12px',lineHeight:'1.5'}}>Keep all your listing assets — MLS copy, social posts, launch kit, and more — in one place.</p>
                    <a href="/workspaces" style={{display:'inline-block',padding:'8px 18px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'8px',fontSize:'12px',fontWeight:'700',textDecoration:'none'}}>Create Workspace →</a>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {recentWorkspaces.map((ws: any) => {
                      const wsStatusColor: Record<string,string> = { Active:'#1D9E75', Pending:'#f59e0b', Sold:'#6366f1', Cancelled:'#ef4444' }
                      const sc = wsStatusColor[ws.status] || '#6b7280'
                      const assets = ws.assets || {}
                      const ac = Object.values(assets).filter((v: any) => v && String(v).trim()).length
                      const nextAction = !assets.mls_description
                        ? { label: 'Create listing copy →', href: `/quick-listing?workspace=${ws.id}` }
                        : !assets.launch_kit
                        ? { label: 'Build launch kit →', href: `/launch-kit?workspace=${ws.id}` }
                        : !assets.seller_prep
                        ? { label: 'Prep for appointment →', href: `/seller-prep?workspace=${ws.id}` }
                        : null
                      return (
                        <div key={ws.id} style={{padding:'10px 14px',borderRadius:'10px',background:'var(--lw-card)',border:'1px solid var(--lw-border)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'7px'}}>
                            <span style={{fontSize:'15px',flexShrink:0}}>📁</span>
                            <span style={{fontSize:'13px',color:'var(--lw-text)',flex:1,fontWeight:'500',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{ws.address}</span>
                            <span style={{fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',background:`${sc}15`,color:sc,border:`1px solid ${sc}30`,flexShrink:0}}>{ws.status}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'7px'}}>
                            <div style={{flex:1,height:'4px',background:'var(--lw-border)',borderRadius:'2px',overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${(ac/8)*100}%`,background:'linear-gradient(90deg,#1D9E75,#085041)',borderRadius:'2px',transition:'width 0.3s'}}/>
                            </div>
                            <span style={{fontSize:'10px',color:'var(--lw-text-muted)',flexShrink:0}}>{ac}/8</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            {nextAction ? (
                              <a href={nextAction.href} style={{fontSize:'11px',color:'#f59e0b',textDecoration:'none',fontWeight:'600'}}>{nextAction.label}</a>
                            ) : (
                              <span style={{fontSize:'11px',color:'#1D9E75',fontWeight:'600'}}>✓ All assets ready</span>
                            )}
                            <a href={`/workspace/${ws.id}`} style={{fontSize:'11px',color:'#1D9E75',textDecoration:'none',fontWeight:'600',flexShrink:0}}>Open →</a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* RECENT ACTIVITY */}
              <div style={{marginBottom:'2.5rem'}}>
                <p style={{fontSize:'10px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1.2px',margin:'0 0 12px'}}>RECENT ACTIVITY</p>
                {recentActivity.length > 0 ? (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {recentActivity.map((item, i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'8px',background:'var(--lw-input)',border:'1px solid var(--lw-border)'}}>
                        <span style={{fontSize:'15px',flexShrink:0}}>{item.type === 'listing' ? '🏠' : item.type === 'lead' ? '👥' : '🎬'}</span>
                        <span style={{fontSize:'13px',color:'var(--lw-text)',flex:1,fontWeight:'400'}}>{item.text}</span>
                        <span style={{fontSize:'11px',color:'var(--lw-text-muted)',flexShrink:0,whiteSpace:'nowrap' as const}}>{getRelativeTime(item.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{fontSize:'13px',color:'var(--lw-text-muted)',margin:'0',fontStyle:'italic'}}>No recent activity yet. Your work will appear here as you use Listing Whisperer.</p>
                )}
              </div>

              {/* TOOL TIERS */}
              <div id="all-tools" style={{marginBottom:'3rem'}}>

                {/* TIER 1 — HERO TOOLS */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:'14px',marginBottom:'2.5rem'}}>
                  {[
                    { icon:'⚡', title:'Quick Listing', desc:'Generate a full listing from a few details in minutes', color:'#1D9E75', href:'/quick-listing', badge:'START HERE' },
                    { icon:'📋', title:'Seller Prep', desc:'Walk into your next appointment fully prepared', color:'#8b5cf6', href:'/seller-prep' },
                    { icon:'👥', title:'Leads & Clients', desc:'Track your pipeline and manage client relationships', color:'#10b981', href:'/leads' },
                    { icon:'📩', title:'Follow-Up Assistant', desc:'Turn showings and meetings into follow-up emails', color:'#6366f1', href:'/follow-up' },
                    { icon:'📁', title:'Listing Workspaces', desc:'All your listings in one place — copy, photos, follow-ups, and more', color:'#1D9E75', href:'/workspaces' },
                  ].map((item, i) => (
                    <a key={i} href={item.href}
                      style={{background:'var(--lw-card)',borderRadius:'16px',border:'1px solid var(--lw-border)',borderLeft:`3px solid ${item.color}`,padding:'1.75rem',textDecoration:'none',display:'block',transition:'all 0.18s',boxShadow:'0 2px 10px rgba(0,0,0,0.05)',position:'relative' as const}}
                      onMouseOver={e => {e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 36px ${item.color}25`}}
                      onMouseOut={e => {e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'}}>
                      {item.badge && (
                        <div style={{position:'absolute',top:'14px',right:'14px',background:'#1D9E75',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px'}}>
                          {item.badge}
                        </div>
                      )}
                      <div style={{width:'48px',height:'48px',borderRadius:'14px',background:`${item.color}18`,border:`1px solid ${item.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',marginBottom:'16px'}}>
                        {item.icon}
                      </div>
                      <p style={{fontSize:'15px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 8px'}}>{item.title}</p>
                      <p style={{fontSize:'13px',color:'var(--lw-text-muted)',margin:'0',lineHeight:'1.6'}}>{item.desc}</p>
                    </a>
                  ))}
                </div>

                {/* TIER 2 — CORE TOOLS */}
                <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1.2px',margin:'0 0 14px'}}>CORE TOOLS</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'12px',marginBottom:'1.75rem'}}>
                  {([
                    { icon:'✨', title:'New Listing', desc:'Create a full listing from scratch', color:'#1D9E75', action: () => { setActivePage('generate'); window.scrollTo({top:0,behavior:'smooth'}) } },
                    { icon:'🎯', title:'Listing Presentation', desc:'Build a winning listing presentation', color:'#8b5cf6', href:'/listing-presentation' },
                    { icon:'🚀', title:'Launch Plan', desc:'7-day marketing rollout strategy', color:'#f59e0b', href:'/launch-kit' },
                    { icon:'📅', title:'Social Planner', desc:'7-day social media content calendar', color:'#e1306c', href:'/social-planner' },
                    { icon:'🏡', title:'Open House Kit', desc:'Flyer, posts, and follow-up emails', color:'#10b981', href:'/open-house' },
                    { icon:'⏰', title:'Reminders', desc:'Never miss a follow-up or deadline', color:'#f59e0b', href:'/reminders' },
                    { icon:'💲', title:'Pricing Assistant', desc:'Sharpen your pricing strategy', color:'#8b5cf6', href:'/pricing-assistant' },
                    { icon:'📊', title:'Market Snapshot', desc:'Generate instant market reports', color:'#6366f1', href:'/market-snapshot' },
                    { icon:'🎬', title:'Video Studio', desc:'Turn one listing photo into a complete video ad kit', color:'#e1306c', href:'/video-studio', pro:true },
                    { icon:'🛋️', title:'Virtual Staging', desc:'Transform empty rooms into beautifully furnished spaces', color:'#8b5cf6', href:'/virtual-staging', pro:true },
                  ] as any[]).map((item, i) => (
                    item.href ? (
                      <a key={i} href={item.href}
                        style={{background:'var(--lw-card)',borderRadius:'13px',border:'1px solid var(--lw-border)',padding:'1.25rem',textDecoration:'none',display:'block',transition:'all 0.18s',boxShadow:isDark?'none':'0 2px 8px rgba(0,0,0,0.06)',position:'relative' as const}}
                        onMouseOver={e => {e.currentTarget.style.borderColor=`${item.color}50`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${item.color}20`}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=isDark?'none':'0 2px 8px rgba(0,0,0,0.06)'}}>
                        {item.pro && <div style={{position:'absolute',top:'10px',right:'10px',background:'linear-gradient(135deg,#d4af37,#a07c20)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',letterSpacing:'0.5px'}}>PRO</div>}
                        <div style={{width:'38px',height:'38px',borderRadius:'10px',background:`${item.color}12`,border:`1px solid ${item.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',marginBottom:'12px'}}>{item.icon}</div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:isDark?'#e0e0e0':'#111318',marginBottom:'4px'}}>{item.title}</div>
                        <div style={{fontSize:'11px',color:isDark?'#6b7280':'#5a6172',lineHeight:'1.55'}}>{item.desc}</div>
                      </a>
                    ) : (
                      <div key={i} onClick={item.action}
                        style={{background:`linear-gradient(135deg,${item.color}0e,${item.color}05)`,borderRadius:'13px',border:`1px solid ${item.color}22`,padding:'1.25rem',cursor:'pointer',transition:'all 0.18s'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor=`${item.color}50`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${item.color}20`}}
                        onMouseOut={e => {e.currentTarget.style.borderColor=`${item.color}22`;e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                        <div style={{width:'38px',height:'38px',borderRadius:'10px',background:`${item.color}15`,border:`1px solid ${item.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',marginBottom:'12px'}}>{item.icon}</div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:isDark?'#e0e0e0':'#111318',marginBottom:'4px'}}>{item.title}</div>
                        <div style={{fontSize:'11px',color:isDark?'#6b7280':'#5a6172',lineHeight:'1.55'}}>{item.desc}</div>
                        <div style={{marginTop:'8px',fontSize:'11px',fontWeight:'600',color:item.color}}>Start now →</div>
                      </div>
                    )
                  ))}
                </div>

                {/* TIER 3 — MORE TOOLS (collapsed) */}
                {showMoreTools && (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:'12px',marginBottom:'1.25rem'}}>
                    {[
                      { icon:'🏠', title:'Buyer Consultation', desc:'Prepare for any buyer meeting', color:'#8b5cf6', href:'/buyer-consultation' },
                      { icon:'🏆', title:'Agent Portfolio', desc:'Showcase your track record and wins', color:'#d4af37', href:'/agent-portfolio' },
                      { icon:'⭐', title:'Career Highlights', desc:'Your stats and success story', color:'#f59e0b', href:'/career-highlights' },
                      { icon:'🚨', title:'Listing Rescue', desc:'Revive a stale listing with fresh copy', color:'#ef4444', href:'/listing-rescue' },
                      { icon:'📸', title:'Snap & Start', desc:'Start a listing from a photo', color:'#1D9E75', href:'/snap-start' },
                      { icon:'✍️', title:'Rewrite Listing', desc:'Polish and improve existing copy', color:'#6366f1', href:'/rewrite' },
                      { icon:'🖼️', title:'Photo Library', desc:'Organize your listing photos', color:'#10b981', href:'/photos' },
                      { icon:'💰', title:'Price Drop Kit', desc:'Price improvement announcement suite', color:'#ef4444', href:'/price-drop' },
                      { icon:'📬', title:'Postcard Copy', desc:'Just Listed & Just Sold postcards', color:'#6366f1', href:'/postcard-copy' },
                      { icon:'🤝', title:'Referral Request', desc:'Turn every closing into your next listing', color:'#10b981', href:'/referral-request' },
                      { icon:'📋', title:'Open House Sign-In', desc:'Tablet-friendly visitor sign-in sheet', color:'#1D9E75', href:'/open-house-signin' },
                      { icon:'✅', title:'Transaction Checklist', desc:'Track every step from listing to closing', color:'#1D9E75', href:'/transaction-checklist' },
                      { icon:'💰', title:'Seller Net Sheet', desc:'Estimate seller proceeds before closing', color:'#1D9E75', href:'/seller-net-sheet' },
                      { icon:'🧮', title:'Commission Calculator', desc:'Calculate your real take-home', color:'#d4af37', href:'/commission-calculator' },
                      { icon:'🛡️', title:'Objection Handler', desc:'Turn any objection into a confident response', color:'#8b5cf6', href:'/objection-handler' },
                      { icon:'🏘️', title:'Neighborhood Bio', desc:'Compelling neighborhood descriptions', color:'#1D9E75', href:'/neighborhood-bio' },
                      { icon:'🔄', title:'Follow-Up Sequence', desc:'Complete follow-up sequence for any lead', color:'#6366f1', href:'/follow-up-sequence' },
                    ].map((item, i) => (
                      <a key={i} href={item.href}
                        style={{background:'var(--lw-card)',borderRadius:'13px',border:'1px solid var(--lw-border)',padding:'1.25rem',textDecoration:'none',display:'block',transition:'all 0.18s',boxShadow:isDark?'none':'0 2px 8px rgba(0,0,0,0.06)'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor=`${item.color}50`;e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${item.color}20`}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=isDark?'none':'0 2px 8px rgba(0,0,0,0.06)'}}>
                        <div style={{width:'38px',height:'38px',borderRadius:'10px',background:`${item.color}12`,border:`1px solid ${item.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'19px',marginBottom:'12px'}}>{item.icon}</div>
                        <div style={{fontSize:'13px',fontWeight:'700',color:isDark?'#e0e0e0':'#111318',marginBottom:'4px'}}>{item.title}</div>
                        <div style={{fontSize:'11px',color:isDark?'#6b7280':'#5a6172',lineHeight:'1.55'}}>{item.desc}</div>
                      </a>
                    ))}
                  </div>
                )}
                <div style={{textAlign:'center',marginBottom:'1rem'}}>
                  <button onClick={() => setShowMoreTools(v => !v)}
                    style={{padding:'9px 22px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'20px',color:'var(--lw-text-muted)',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif',transition:'all 0.15s'}}
                    onMouseOver={e => {e.currentTarget.style.borderColor='#1D9E75';e.currentTarget.style.color='#1D9E75'}}
                    onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.color='var(--lw-text-muted)'}}>
                    {showMoreTools ? 'Show less ↑' : 'Show more tools ↓'}
                  </button>
                </div>

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
                        onClick={() => { setOutputs(listing.outputs); setCurrentListingId(listing.id); setForm(prev => ({...prev, name: listing.name || '', neighborhood: listing.neighborhood || '', price: listing.price || '', beds: listing.beds_baths || '', sqft: listing.sqft || ''})); setListingNameInput(listing.name || listing.neighborhood || ''); setActivePage('results'); window.scrollTo({top:0,behavior:'smooth'}) }}
                        style={{background:'var(--lw-input)',borderRadius:'9px',border:'1px solid var(--lw-border)',padding:'0.8rem 1rem',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',transition:'all 0.15s'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor='rgba(29,158,117,0.3)';e.currentTarget.style.background='rgba(29,158,117,0.04)'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.background='var(--lw-input)'}}>
                        <div>
                          <p style={{margin:'0',fontSize:'13px',fontWeight:'600',color:'var(--lw-text)'}}>{listing.name || `${listing.property_type} — ${listing.neighborhood}`}</p>
                          <p style={{margin:'2px 0 0',fontSize:'11px',color:'var(--lw-text-muted)'}}>{listing.price} · {new Date(listing.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{fontSize:'11px',color:'#1D9E75',fontWeight:'500'}}>View →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LEADS & CLIENTS SECTION */}
              <div style={{marginTop:'2.5rem',paddingBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{width:'4px',height:'18px',background:'#10b981',borderRadius:'2px',display:'inline-block',boxShadow:'0 0 10px rgba(16,185,129,0.5)'}}/>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>Leads & Clients</p>
                  </div>
                  <a href="/leads" style={{fontSize:'11px',color:'#10b981',fontWeight:'600',textDecoration:'none'}}>View all →</a>
                </div>
                {leads.length === 0 ? (
                  <div style={{background:'var(--lw-card)',borderRadius:'16px',border:'1px solid var(--lw-border)',padding:'2.75rem',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,0.04)'}}>
                    <div style={{fontSize:'2.75rem',marginBottom:'12px'}}>👥</div>
                    <p style={{fontSize:'15px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 8px'}}>Your first lead starts here.</p>
                    <p style={{fontSize:'13px',color:'var(--lw-text-muted)',margin:'0 0 20px',lineHeight:'1.65',maxWidth:'320px',marginLeft:'auto',marginRight:'auto'}}>Add a buyer, seller, or past client — then let AI handle the follow-up.</p>
                    <a href="/leads" style={{display:'inline-block',padding:'11px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'700',boxShadow:'0 0 20px rgba(29,158,117,0.25)'}}>Add Lead</a>
                  </div>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                    {leads.slice(0,3).map((lead: any) => (
                      <a key={lead.id} href="/leads"
                        style={{background:'var(--lw-input)',borderRadius:'10px',border:'1px solid var(--lw-border)',padding:'0.875rem 1rem',display:'flex',justifyContent:'space-between',alignItems:'center',textDecoration:'none',transition:'all 0.15s'}}
                        onMouseOver={e => {e.currentTarget.style.borderColor='rgba(16,185,129,0.3)';e.currentTarget.style.background='rgba(16,185,129,0.04)'}}
                        onMouseOut={e => {e.currentTarget.style.borderColor='var(--lw-border)';e.currentTarget.style.background='var(--lw-input)'}}>
                        <div>
                          <p style={{margin:'0',fontSize:'13px',fontWeight:'600',color:'var(--lw-text)'}}>{lead.name}</p>
                          <p style={{margin:'2px 0 0',fontSize:'11px',color:'var(--lw-text-muted)'}}>{lead.status || 'Lead'}</p>
                        </div>
                        <span style={{fontSize:'11px',color:'#10b981',fontWeight:'500'}}>View →</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GENERATE PAGE */}
          {activePage === 'generate' && (
            <div style={{maxWidth:'680px'}}>
              <div style={{marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'12px'}}>
                <button onClick={() => setActivePage('home')} style={{background:'none',border:'none',color:'#444',fontSize:'13px',cursor:'pointer',padding:'0'}}>← Home</button>
                <h1 style={{fontSize:'1.25rem',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>New Listing</h1>
                <span style={{background:'rgba(29,158,117,0.15)',color:'#1D9E75',fontSize:'11px',fontWeight:'600',padding:'3px 10px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.3)'}}>11 formats</span>
              </div>

              <div style={{...styles.card, marginBottom:'1rem'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>PROPERTY DETAILS</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'12px',marginBottom:'12px'}}>
                  <div><label style={styles.label}>Listing name</label><input placeholder="123 Oak Street" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Type</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={styles.select}><option>Single family</option><option>Condo</option><option>Townhome</option><option>Luxury estate</option><option>Multi-family</option></select></div>
                  <div><label style={styles.label}>Beds</label><input placeholder="3" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} style={styles.input}/></div>
                  <div><label style={styles.label}>Baths</label><input placeholder="2" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})} style={styles.input}/></div>
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
                      <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>Marketing Suite Ready</h1>
                      <span style={{background:'rgba(29,158,117,0.2)',color:'#1D9E75',fontSize:'11px',fontWeight:'700',padding:'4px 12px',borderRadius:'20px',border:'1px solid rgba(29,158,117,0.4)'}}>✓ 11 FORMATS</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px',flexWrap:'wrap'}}>
                      <input
                        key={currentListingId || 'new'}
                        placeholder="Name this listing..."
                        value={listingNameInput}
                        onChange={e => setListingNameInput(e.target.value)}
                        style={{background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',color:'var(--lw-text)',fontSize:'13px',fontWeight:'600',outline:'none',width:'220px',padding:'6px 10px',fontFamily:'var(--font-plus-jakarta),sans-serif'}}
                      />
                      <button onClick={async () => {
                        const newName = listingNameInput.trim()
                        if (!newName) { alert('Please enter a name first!'); return }
                        if (userId && currentListingId) {
                          const { error } = await supabase.from('listings').update({ name: newName }).eq('id', currentListingId)
                          if (!error) {
                            setForm(prev => ({...prev, name: newName}))
                            setPastListings(prev => prev.map(l => l.id === currentListingId ? {...l, name: newName} : l))
                            alert('✅ Name saved!')
                          } else {
                            alert('Error saving: ' + error.message)
                          }
                        } else {
                          alert('Error: no listing ID found. Try generating a new listing.')
                        }
                      }}
                        style={{padding:'6px 14px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>
                        Save Name
                      </button>
                      {form.price && <span style={{fontSize:'13px',color:'var(--lw-text-muted)'}}>· {form.price}</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                    <button onClick={() => setActivePage('history')} style={{padding:'8px 16px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',color:'var(--lw-text-muted)',fontSize:'12px',cursor:'pointer',fontWeight:'600',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>← All Listings</button>
                    <button onClick={() => handleDownloadPdf('mls')} style={{padding:'8px 16px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#8b8fa8',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>📄 MLS PDF</button>
                    <button onClick={() => handleDownloadPdf('flyer')} style={{padding:'8px 16px',background:'rgba(0,0,0,0.3)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#8b8fa8',fontSize:'12px',cursor:'pointer',fontWeight:'500'}}>🏠 Flyer PDF</button>
                    <button onClick={() => { setActivePage('generate'); setOutputs(null); setCurrentListingId(null); setForm({type:'Single family',beds:'',baths:'',sqft:'',price:'',neighborhood:'',features:'',tone:'Professional',buyer:'Move-up families',notes:'',name:''}) }} style={{padding:'8px 16px',background:'rgba(29,158,117,0.15)',border:'1px solid rgba(29,158,117,0.3)',borderRadius:'8px',color:'#1D9E75',fontSize:'12px',cursor:'pointer',fontWeight:'600'}}>+ New Listing</button>
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
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                  <h1 style={{fontSize:'1.5rem',fontWeight:'700',color: isDark ? '#f0f0f0' : '#111318',margin:'0'}}>Listing History</h1>
                  <button onClick={() => setActivePage('home')} style={{padding:'8px 16px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',color:'var(--lw-text-muted)',fontSize:'12px',cursor:'pointer',fontWeight:'600',fontFamily:'var(--font-plus-jakarta),sans-serif'}}>← Back to Dashboard</button>
                </div>
                <p style={{fontSize:'14px',color:'#8b8fa8',margin:'0'}}>{pastListings.length} most recent listings</p>
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
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px',cursor:'pointer'}} onClick={() => { setOutputs(listing.outputs); setCurrentListingId(listing.id); setForm(prev => ({...prev, name: listing.name || '', neighborhood: listing.neighborhood || '', price: listing.price || '', beds: listing.beds_baths || '', sqft: listing.sqft || ''})); setListingNameInput(listing.name || listing.neighborhood || ''); setActivePage('results'); window.scrollTo({top:0,behavior:'smooth'}) }}>
                        <div>
                          <p style={{margin:'0',fontSize:'14px',fontWeight:'600',color: isDark ? '#f0f0f0' : '#111318'}}>{listing.name || `${listing.property_type} — ${listing.neighborhood}`}</p>
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
                        style={{width:'100%',padding:'8px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'12px',color:'var(--lw-text-muted)',minHeight:'60px',resize:'vertical',boxSizing:'border-box',fontFamily:'var(--font-plus-jakarta),sans-serif'}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEARNING CENTER BANNER */}
        <div style={{padding:'0 1.5rem 2rem'}}>
          <a href="/learn" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'14px 18px',background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'12px',textDecoration:'none',flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'18px',lineHeight:1}}>📚</span>
              <div>
                <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0 0 2px'}}>Free Agent Guides</p>
                <p style={{fontSize:'12px',color:'var(--lw-text-muted)',margin:'0'}}>Tips on listings, follow-up, branding, AI and more →</p>
              </div>
            </div>
            <span style={{fontSize:'12px',color:'var(--lw-text-muted)',fontWeight:'500',whiteSpace:'nowrap'}}>View all guides →</span>
          </a>
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
            <button onClick={() => { const ids = dueReminders.map(r => r.id); const existing = JSON.parse(sessionStorage.getItem('lw_dismissed_reminders') || '[]'); sessionStorage.setItem('lw_dismissed_reminders', JSON.stringify([...existing, ...ids])); setShowReminderPopup(false) }} style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#d4af37,#a08040)',color:'#000',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Dismiss All & Continue</button>
            <p style={{fontSize:'11px',color:'#444',textAlign:'center',margin:'10px 0 0'}}>Dismissed reminders are marked as done and won't show again</p>
          </div>
        </div>
      )}

      {/* CHAT WIDGET MOVED TO GLOBAL LAYOUT */}
      <div style={{display:'none'}}>
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
                <a href="/pricing" onClick={() => trackUpgradeClick('trial_ended_modal', plan)} style={{display:'block',textAlign:'center',padding:'12px',borderRadius:'8px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',textDecoration:'none',fontSize:'14px',fontWeight:'700',boxShadow:'0 0 20px rgba(29,158,117,0.3)'}}>Upgrade to Pro — $20/mo</a>
              </div>
            </div>
            <p style={{fontSize:'12px',color:'#444'}}>Use code <strong style={{color:'#d4af37'}}>WELCOME50</strong> for 50% off your first month</p>
          </div>
        </div>
      )}
    </div>
  )
}