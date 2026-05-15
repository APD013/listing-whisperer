// Listing Whisperer - GA4 Analytics Utility
// Fires custom events to Google Analytics 4
// GA4 Measurement ID: G-50NE5KHLE3 (initialized in src/app/layout.tsx)

// Canonical funnel event names
export type EventName =
  | 'signup_started'
  | 'signup_completed'
  | 'listing_created'
  | 'virtual_stage_started'
  | 'virtual_stage_completed'
  | 'ai_chat_opened'
  | 'ai_chat_message_sent'
  | 'launch_kit_created'
  | 'pricing_viewed'
  | 'upgrade_click'
  | 'checkout_started'
  | 'purchase'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

// Get UTM params from URL and preserve them
export function getUTMParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    source: params.get('utm_source') || document.referrer || 'direct',
    medium: params.get('utm_medium') || 'none',
    campaign: params.get('utm_campaign') || 'none',
    content: params.get('utm_content') || 'none',
  }
}

// Store UTMs in sessionStorage so they persist across pages
export function preserveUTMs() {
  if (typeof window === 'undefined') return
  const utms = getUTMParams()
  if (utms.source !== 'direct') {
    sessionStorage.setItem('utm_data', JSON.stringify(utms))
  }
}

// Get stored UTMs
export function getStoredUTMs() {
  if (typeof window === 'undefined') return {}
  try {
    const stored = sessionStorage.getItem('utm_data')
    return stored ? JSON.parse(stored) : getUTMParams()
  } catch {
    return {}
  }
}

// Core event firing function
export function trackEvent(
  eventName: string,
  params: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return
  if (!window.gtag) return

  const utms = getStoredUTMs()

  window.gtag('event', eventName, {
    page_path: window.location.pathname,
    page_title: document.title,
    ...utms,
    ...params,
  })

  // Debug in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 GA4 Event:', eventName, params)
  }
}

// Track page views for SPA navigation
export function trackPageView(path: string) {
  if (typeof window === 'undefined') return
  if (!window.gtag) return

  window.gtag('config', 'G-50NE5KHLE3', {
    page_path: path,
    page_title: document.title,
  })
}

// ─── SPECIFIC EVENT FUNCTIONS ───────────────────────────────

// 1. Signup Events
export function trackSignupStarted() {
  trackEvent('signup_started', {
    method: 'email',
  })
}

export function trackSignupCompleted(userId: string) {
  trackEvent('signup_completed', {
    user_id: userId,
    method: 'email',
  })
}

// 2. Login
export function trackLoginCompleted(userId: string) {
  trackEvent('login_completed', {
    user_id: userId,
  })
}

// 3. Dashboard
export function trackDashboardView(plan: string) {
  trackEvent('dashboard_view', {
    user_status: plan,
  })
}

// 4. Listing Created
export function trackListingCreated(plan: string, neighborhood: string) {
  trackEvent('listing_created', {
    user_status: plan,
    neighborhood: neighborhood,
  })
}

// 5. Rewrite Used
export function trackRewriteUsed(plan: string) {
  trackEvent('rewrite_used', {
    user_status: plan,
  })
}

// 6. Output Copied
export function trackOutputCopied(outputType: string, plan: string) {
  trackEvent('output_copied', {
    output_type: outputType,
    user_status: plan,
  })
}

// 7. Upgrade Click
export function trackUpgradeClick(location: string, plan: string) {
  trackEvent('upgrade_click', {
    click_location: location,
    user_status: plan,
  })
}

// 8. Checkout
export function trackCheckoutStarted(plan: string) {
  trackEvent('checkout_started', {
    user_status: plan,
    value: 29,
    currency: 'USD',
  })
}

// 9. Launch Kit Used
export function trackLaunchKitUsed(plan: string) {
  trackEvent('launch_kit_used', {
    user_status: plan,
  })
}

// 10. CTA Clicks
export function trackCTAClick(ctaName: string, location: string) {
  trackEvent('cta_click', {
    cta_name: ctaName,
    click_location: location,
  })
}

// 11. Virtual Staging
export function trackVirtualStageStarted(roomType: string, designStyle: string) {
  trackEvent('virtual_stage_started', {
    room_type: roomType,
    design_style: designStyle,
  })
}

export function trackVirtualStageCompleted(roomType: string, designStyle: string) {
  trackEvent('virtual_stage_completed', {
    room_type: roomType,
    design_style: designStyle,
  })
}

// 12. AI Chat
export function trackAiChatOpened(page: string) {
  trackEvent('ai_chat_opened', { page })
}

export function trackAiChatMessageSent(page: string) {
  trackEvent('ai_chat_message_sent', { page })
}

// 13. Launch Kit Created
export function trackLaunchKitCreated(plan: string, neighborhood: string) {
  trackEvent('launch_kit_created', {
    user_status: plan,
    neighborhood,
  })
}

// 14. Purchase (fires on Stripe success redirect)
export function trackPurchase(plan: string) {
  trackEvent('purchase', {
    user_status: plan,
    value: 20,
    currency: 'USD',
  })
}