'use client'

import { useTheme } from '@/components/providers/ThemeProvider'
import { useEffect, useState } from 'react'

export function HomeThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 38,
        height: 38,
        borderRadius: 10,
        border: '1px solid var(--hp-border)',
        background: 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s, border-color 0.2s, transform 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--hp-border)'
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
      }}
    >
      {/* Sun (light mode icon) */}
      <span
        style={{
          position: 'absolute',
          fontSize: '1.0625rem',
          lineHeight: 1,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-90deg) scale(0.6)' : 'rotate(0deg) scale(1)',
        }}
      >
        ☀️
      </span>
      {/* Moon (dark mode icon) */}
      <span
        style={{
          position: 'absolute',
          fontSize: '1.0625rem',
          lineHeight: 1,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.6)',
        }}
      >
        🌙
      </span>
    </button>
  )
}