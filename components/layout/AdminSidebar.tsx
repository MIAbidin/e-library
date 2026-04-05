'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'

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
    <div className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-lg shadow-sm">
            📚
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">E-Library Admin</p>
            <p className="text-xs text-gray-400">Panel Administrator</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={close}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-700 hover:text-white transition"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href, item.exact)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-2">
        <Link
          href="/dashboard"
          onClick={close}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400
            hover:bg-gray-800 hover:text-white transition"
        >
          <span>↩️</span>
          Lihat sebagai Karyawan
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return <AdminSidebarContent />
}