'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Beranda', icon: '🏠', exact: true },
  { href: '/dashboard/stats', label: 'Statistik Saya', icon: '📊' },
  { href: '/dashboard/notifications', label: 'Notifikasi', icon: '🔔' },
  { href: '/dashboard/settings/notifications', label: 'Pengaturan', icon: '⚙️' },
]

function SidebarContent() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { close } = useSidebar()

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={close}>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg shadow-sm">
            📚
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">E-Library</p>
            <p className="text-xs text-gray-400">Perusahaan</p>
          </div>
        </Link>
        <button
          onClick={close}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg
            text-gray-400 hover:bg-gray-100 transition"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(item.href, item.exact)
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center
            text-sm font-semibold text-blue-700 flex-shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name ?? 'Pengguna'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.department ?? 'Karyawan'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Desktop — rendered in layout as always-visible aside
export function DashboardSidebarDesktop() {
  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 h-full">
      <SidebarContent />
    </aside>
  )
}

// Mobile — rendered inside MobileDrawer
export function DashboardSidebarMobile() {
  return <SidebarContent />
}