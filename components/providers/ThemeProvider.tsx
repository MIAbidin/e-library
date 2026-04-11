'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('elib-theme') as Theme | null
    const resolved = stored === 'light' || stored === 'dark' ? stored : 'dark'
    setTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('elib-theme', theme)
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeToggleButton({ className = '' }: { className?: string }) {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
      className={`
        w-9 h-9 flex items-center justify-center rounded-xl
        border border-gray-200 transition-all duration-200
        hover:scale-105 text-base flex-shrink-0
        ${className}
      `}
      style={{
        background: 'var(--btn-ghost-bg)',
        borderColor: 'var(--border-base)',
        color: 'var(--text-secondary)',
      }}
    >
      <span style={{ transition: 'transform 0.3s ease' }}>
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  )
}