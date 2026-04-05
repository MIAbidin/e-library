'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { useState, useRef, useEffect } from 'react'
import { NotificationBell } from '@/components/NotificationBell'

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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-14 lg:h-16 bg-white border-b border-gray-200
      flex items-center justify-between px-4 lg:px-6 flex-shrink-0">

      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <button
          onClick={toggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center
            rounded-lg text-gray-500 hover:bg-gray-100 transition"
          aria-label="Buka menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="text-lg">📚</span>
          <span className="font-bold text-gray-900 text-sm">E-Library</span>
        </div>

        {/* Page title desktop */}
        <h2 className="hidden lg:block text-base font-semibold text-gray-800">
          {title}
        </h2>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* ✅ NotificationBell dengan badge real */}
        <NotificationBell />

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5
              rounded-lg hover:bg-gray-100 transition"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center
              justify-center text-xs font-semibold text-blue-700">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <span className="text-sm text-gray-700 font-medium hidden sm:block">
              {session?.user?.name?.split(' ')[0] ?? 'User'}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform
                ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white
              rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/dashboard/settings/notifications"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm
                    text-gray-600 hover:bg-gray-50 transition"
                >
                  <span>⚙️</span> Pengaturan
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm
                    text-red-600 hover:bg-red-50 transition"
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