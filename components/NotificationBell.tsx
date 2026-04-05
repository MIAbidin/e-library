'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'

interface NotifItem {
  id: string
  is_read: boolean
  created_at: string
  notification: {
    id: string
    type: string
    title: string
    body: string
    book_id: string | null
    book?: { id: string; title: string; cover_url: string | null } | null
  }
}

const typeIcon: Record<string, string> = {
  new_book: '📗',
  announcement: '📢',
  reading_reminder: '⏰',
}

export function NotificationBell() {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      const data = await res.json()
      setUnreadCount(data.count ?? 0)
    } catch {
      // Silent fail
    }
  }, [])

  // Fetch notifikasi terbaru untuk dropdown
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=5&page=1')
      const data = await res.json()
      setNotifications(data.notifications ?? [])
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll unread count setiap 30 detik
  useEffect(() => {
    fetchUnreadCount()
    pollRef.current = setInterval(fetchUnreadCount, 30_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchUnreadCount])

  // Tutup dropdown saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true)
      await fetchNotifications()
    } else {
      setIsOpen(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' })
      setUnreadCount(0)
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
    } catch {
      // Silent fail
    }
  }

  const handleClickNotif = async (notif: NotifItem) => {
    // Tandai dibaca
    if (!notif.is_read) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' })
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notif.id ? { ...n, is_read: true } : n
        )
      )
    }

    setIsOpen(false)

    // Navigate ke buku jika ada
    if (
      notif.notification.book_id &&
      notif.notification.type === 'new_book'
    ) {
      router.push(`/dashboard/books/${notif.notification.book_id}`)
    } else {
      router.push('/dashboard/notifications')
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center
          rounded-lg hover:bg-gray-100 transition text-gray-500"
        aria-label="Notifikasi"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002
               6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6
               8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6
               0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px]
            bg-red-500 text-white text-xs font-bold rounded-full
            flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96
          bg-white rounded-2xl shadow-xl border border-gray-200 z-50
          overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3
            border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 text-sm">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600
                  font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500
                  border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm text-gray-400">
                  Belum ada notifikasi
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClickNotif(notif)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50
                    transition border-b border-gray-50 last:border-0
                    ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center
                      justify-center text-base flex-shrink-0 mt-0.5
                      ${!notif.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {typeIcon[notif.notification.type] ?? '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug line-clamp-1
                          ${!notif.is_read
                            ? 'font-semibold text-gray-900'
                            : 'font-medium text-gray-700'
                          }`}>
                          {notif.notification.title}
                        </p>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500
                            flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                        {notif.notification.body}
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-sm text-blue-600
                hover:text-blue-700 font-medium"
            >
              Lihat Semua Notifikasi →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}