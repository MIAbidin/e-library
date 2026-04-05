'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate, formatRelativeTime } from '@/lib/utils'

interface UserStats {
  booksRead: number
  totalPagesRead: number
  booksCompleted: number
}

interface UserDetailModalProps {
  user: User | null
  onClose: () => void
}

export function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setStats(null); return }
    setLoading(true)
    fetch(`/api/admin/users/${user.id}`)
      .then((r) => r.json())
      .then((data) => setStats(data.stats ?? null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title="Detail Pengguna"
      size="md"
    >
      {user && (
        <div className="space-y-5">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center
              justify-center text-xl font-bold text-blue-700 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={user.role === 'admin' ? 'blue' : 'gray'}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 Karyawan'}
                </Badge>
                <Badge variant={user.is_active ? 'green' : 'red'}>
                  {user.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Detail Info */}
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Departemen', value: user.department ?? '—' },
              { label: 'Bergabung', value: formatDate(user.created_at) },
              { label: 'Login Terakhir', value: formatRelativeTime(user.last_login_at) },
              { label: 'Status Akun', value: user.is_active ? 'Aktif' : 'Nonaktif' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-sm font-medium text-gray-700 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Statistik Aktivitas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Aktivitas Membaca
            </p>
            {loading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Buku Dibuka', value: stats?.booksRead ?? 0, icon: '📖' },
                  { label: 'Buku Selesai', value: stats?.booksCompleted ?? 0, icon: '✅' },
                  { label: 'Total Halaman', value: stats?.totalPagesRead ?? 0, icon: '📄' },
                ].map((stat) => (
                  <div key={stat.label}
                    className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                    <p className="text-lg mb-1">{stat.icon}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-600 border border-gray-200
              rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Tutup
          </button>
        </div>
      )}
    </Modal>
  )
}