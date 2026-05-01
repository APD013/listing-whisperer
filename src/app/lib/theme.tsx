'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {}
})

export const useTheme = () => useContext(ThemeContext)

export const themes = {
  dark: {
    bg: '#111318',
    card: '#1a1d2e',
    cardAlt: '#1e2235',
    border: 'rgba(255,255,255,0.07)',
    text: '#f0f0f0',
    textMuted: '#6b7280',
    accent: '#1D9E75',
    accentDark: '#085041',
    nav: 'rgba(26,29,46,0.8)',
    input: 'rgba(0,0,0,0.3)',
    inputBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    bg: '#f4f5f7',
    card: '#ffffff',
    cardAlt: '#f8f9fb',
    border: 'rgba(0,0,0,0.08)',
    text: '#111318',
    textMuted: '#5a6172',
    accent: '#1D9E75',
    accentDark: '#085041',
    nav: 'rgba(255,255,255,0.95)',
    input: 'rgba(0,0,0,0.04)',
    inputBorder: 'rgba(0,0,0,0.1)',
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('lw_theme') as Theme
    if (stored) setTheme(stored)

    const loadTheme = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single()
      if (profile?.theme) {
        setTheme(profile.theme as Theme)
        localStorage.setItem('lw_theme', profile.theme)
      }
    }
    loadTheme()
  }, [])

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('lw_theme', newTheme)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('id', user.id)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}