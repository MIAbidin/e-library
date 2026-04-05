'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'

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
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200 flex items-center
      justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg
            text-gray-500 hover:bg-gray-100 transition"
          aria-label="Buka menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5
            rounded-full uppercase tracking-wide hidden sm:inline">
            Admin
          </span>
          <h2 className="text-sm lg:text-base font-semibold text-gray-800">{title}</h2>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/auth/login' })}
        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700
          font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
      >
        <span className="hidden sm:inline">🚪</span>
        <span className="hidden sm:inline">Keluar</span>
        <span className="sm:hidden">🚪</span>
      </button>
    </header>
  )
}