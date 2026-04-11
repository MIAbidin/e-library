'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { useState, useRef, useEffect } from 'react'
import { NotificationBell } from '@/components/NotificationBell'
import { ThemeToggleButton } from '@/components/providers/ThemeProvider'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Beranda',
  '/dashboard/stats': 'Statistik Saya',
  '/dashboard/notifications': 'Notifikasi',
  '/dashboard/settings/notifications': 'Pengaturan Notifikasi',
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { toggle } = useSidebar()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'E-Library'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header
      className="h-14 lg:h-16 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-40"
      style={{
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile */}
        <button
          onClick={toggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-all"
          style={{ background: 'var(--btn-ghost-bg)', border: '1px solid var(--border-base)' }}
          aria-label="Buka menu"
        >
          <svg className="w-4.5 h-4.5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)' }}
          >📚</div>
          <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>E-Library</span>
        </div>

        {/* Page title — desktop */}
        <h2
          className="hidden lg:block text-sm font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <ThemeToggleButton />
        <NotificationBell />

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all"
            style={{
              background: dropdownOpen ? 'var(--btn-ghost-hover)' : 'var(--btn-ghost-bg)',
              border: '1px solid var(--border-base)',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', color: '#fff' }}
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <span
              className="text-sm font-medium hidden sm:block"
              style={{ color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {session?.user?.name?.split(' ')[0] ?? 'User'}
            </span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--text-tertiary)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-1.5 z-50 overflow-hidden"
              style={{
                background: 'var(--dropdown-bg)',
                border: '1px solid var(--dropdown-border)',
                boxShadow: 'var(--shadow-xl)',
                animation: 'dropdownIn 0.18s ease',
              }}
            >
              <style>{`@keyframes dropdownIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }`}</style>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-base)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {session?.user?.name}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {session?.user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/settings/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--dropdown-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span>⚙️</span> Pengaturan
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left"
                  style={{ color: '#f87171' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <span>🚪</span> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}