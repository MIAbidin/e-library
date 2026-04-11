'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSidebar } from '@/hooks/useSidebar'

const navGroups = [
  {
    label: 'Konten',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
      { href: '/admin/books', label: 'Kelola Buku', icon: '📗' },
      { href: '/admin/categories', label: 'Kategori', icon: '🏷️' },
    ],
  },
  {
    label: 'Pengguna',
    items: [
      { href: '/admin/users', label: 'Manajemen User', icon: '👥' },
      { href: '/admin/stats', label: 'Statistik', icon: '📊' },
      { href: '/admin/notifications', label: 'Notifikasi', icon: '📢' },
    ],
  },
]

function AdminSidebarContent() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { close } = useSidebar()

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div
      className="w-64 flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
          >
            📚
          </div>
          <div>
            <p
              className="font-bold text-sm leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              E-Library Admin
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Panel Administrator</p>
          </div>
        </div>
        <button
          onClick={close}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '')}
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p
              className="text-xs font-semibold uppercase px-3 mb-2"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{
                      background: active ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: active ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
                      fontWeight: active ? 600 : 500,
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <Link
          href="/dashboard"
          onClick={close}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <span>↩️</span>
          Lihat sebagai Karyawan
        </Link>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--bg-muted)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #6366f1)', color: '#fff' }}
          >
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {session?.user?.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return <AdminSidebarContent />
}