import type { User } from '@supabase/supabase-js'

const DEMO_EMAIL = 'demo@listingwhisperer.com'
const DEMO_USED_KEY = 'lw_demo_generation_used'
const DEMO_TOOL_KEY = 'lw_demo_generation_tool'

export function isDemoUser(user: User | null | undefined): boolean {
  return user?.email === DEMO_EMAIL
}
export function hasUsedDemoGeneration(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DEMO_USED_KEY) === 'true'
}
export function getDemoGenerationTool(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(DEMO_TOOL_KEY)
}
export function markDemoGenerationUsed(toolSlug: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DEMO_USED_KEY, 'true')
  localStorage.setItem(DEMO_TOOL_KEY, toolSlug)
}
export function resetDemoGeneration(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(DEMO_USED_KEY)
  localStorage.removeItem(DEMO_TOOL_KEY)
}
