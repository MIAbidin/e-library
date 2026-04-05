'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
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

type FilterType = 'all' | 'unread' | 'new_book' | 'announcement'

const typeLabel: Record<string, string> = {
  new_book: '📗 Buku Baru',
  announcement: '📢 Pengumuman',
  reading_reminder: '⏰ Pengingat',
}

const typeIcon: Record<string, string> = {
  new_book: '📗',
  announcement: '📢',
  reading_reminder: '⏰',
}

const tabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'unread', label: 'Belum Dibaca' },
  { key: 'new_book', label: 'Buku Baru' },
  { key: 'announcement', label: 'Pengumuman' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterType>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      })

      if (activeTab === 'unread') params.set('filter', 'unread')

      const res = await fetch(`/api/notifications?${params}`)
      const data = await res.json()

      let items: NotifItem[] = data.notifications ?? []

      // Filter tipe di client side untuk new_book & announcement
      if (activeTab === 'new_book' || activeTab === 'announcement') {
        items = items.filter(
          (n) => n.notification.type === activeTab
        )
      }

      setNotifications(items)
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch (err) {
      console.error('Gagal memuat notifikasi:', err)
    } finally {
      setLoading(false)
    }
  }, [page, activeTab])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleTabChange = (tab: FilterType) => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' })
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      )
    } catch {
      // Silent fail
    } finally {
      setMarkingAll(false)
    }
  }

  const handleClickNotif = async (notif: NotifItem) => {
    if (!notif.is_read) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PUT' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
    }

    if (
      notif.notification.book_id &&
      notif.notification.type === 'new_book'
    ) {
      router.push(`/dashboard/books/${notif.notification.book_id}`)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Notifikasi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} notifikasi total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-blue-600
              hover:text-blue-700 font-medium disabled:opacity-60
              px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            {markingAll ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span>✓</span>
            )}
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex-1 min-w-max py-1.5 px-3 text-sm font-medium
              rounded-lg transition whitespace-nowrap
              ${activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-gray-500 text-sm">
              {activeTab === 'unread'
                ? 'Semua notifikasi sudah dibaca'
                : 'Belum ada notifikasi'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClickNotif(notif)}
                className={`flex gap-4 p-4 lg:p-5 cursor-pointer
                  hover:bg-gray-50 transition
                  ${!notif.is_read ? 'bg-blue-50/40' : ''}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center
                  justify-center text-lg flex-shrink-0
                  ${!notif.is_read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {typeIcon[notif.notification.type] ?? '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs text-gray-400">
                          {typeLabel[notif.notification.type] ?? 'Notifikasi'}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full
                            bg-blue-500 inline-block" />
                        )}
                      </div>
                      <p className={`text-sm leading-snug
                        ${!notif.is_read
                          ? 'font-semibold text-gray-900'
                          : 'font-medium text-gray-700'
                        }`}>
                        {notif.notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        {notif.notification.body}
                      </p>

                      {/* Link ke buku jika ada */}
                      {notif.notification.book_id &&
                        notif.notification.type === 'new_book' && (
                        <span className="inline-flex items-center gap-1 mt-2
                          text-xs text-blue-600 font-medium">
                          Lihat buku →
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatRelativeTime(notif.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100
            flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200
                  rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200
                  rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}