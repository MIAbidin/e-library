'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { ThemeToggleButton } from '@/components/providers/ThemeProvider'

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard Admin',
  '/admin/books': 'Kelola Buku',
  '/admin/books/new': 'Upload Buku Baru',
  '/admin/categories': 'Kategori',
  '/admin/users': 'Manajemen User',
  '/admin/stats': 'Statistik',
  '/admin/notifications': 'Notifikasi & Pengumuman',
}

export function AdminHeader() {
  const pathname = usePathname()
  const { toggle } = useSidebar()

  const title = Object.entries(pageTitles).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] ?? 'Admin Panel'

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
          <svg className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full hidden sm:inline-block"
            style={{
              background: 'rgba(239,68,68,0.12)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontSize: '0.6875rem',
            }}
          >
            Admin
          </span>
          <h2
            className="text-sm lg:text-base font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
          >
            {title}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggleButton />
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-all"
          style={{
            background: 'rgba(239,68,68,0.08)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
        >
          <span className="hidden sm:inline">🚪</span>
          <span className="hidden sm:inline">Keluar</span>
          <span className="sm:hidden">🚪</span>
        </button>
      </div>
    </header>
  )
}