'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

interface Preference {
  notif_type: string
  is_enabled: boolean
}

const prefConfig = [
  {
    type: 'new_book',
    icon: '📗',
    label: 'Buku Baru',
    desc: 'Notifikasi ketika admin menambahkan buku baru ke koleksi',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    type: 'announcement',
    icon: '📢',
    label: 'Pengumuman',
    desc: 'Pengumuman penting dari Administrator',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    type: 'reading_reminder',
    icon: '⏰',
    label: 'Pengingat Membaca',
    desc: 'Pengingat jika kamu belum membaca dalam beberapa hari',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
]

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Preference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((data) => {
        setPrefs(
          data.map((d: { notif_type: string; is_enabled: boolean }) => ({
            notif_type: d.notif_type,
            is_enabled: d.is_enabled,
          }))
        )
      })
      .catch(() => toast.error('Gagal memuat preferensi'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (type: string, current: boolean) => {
    setSaving(type)

    // Optimistic update
    setPrefs((prev) =>
      prev.map((p) => (p.notif_type === type ? { ...p, is_enabled: !current } : p))
    )

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifType: type, isEnabled: !current }),
      })

      if (!res.ok) throw new Error()
      toast.success(!current ? 'Notifikasi diaktifkan' : 'Notifikasi dinonaktifkan')
    } catch {
      // Rollback
      setPrefs((prev) =>
        prev.map((p) => (p.notif_type === type ? { ...p, is_enabled: current } : p))
      )
      toast.error('Gagal menyimpan preferensi')
    } finally {
      setSaving(null)
    }
  }

  const enabledCount = prefs.filter((p) => p.is_enabled).length

  return (
    <div className="max-w-lg">
      {/* Back */}
      <Link
        href="/dashboard/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-5"
      >
        ← Kembali ke Notifikasi
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pengaturan Notifikasi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih jenis notifikasi yang ingin kamu terima
        </p>
      </div>

      {/* Status bar */}
      {!loading && (
        <div className="mb-4 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{enabledCount}</span> dari{' '}
            {prefConfig.length} notifikasi aktif
          </span>
          {enabledCount > 0 && enabledCount < prefConfig.length && (
            <button
              onClick={() =>
                prefConfig.forEach((c) => {
                  const pref = prefs.find((p) => p.notif_type === c.type)
                  if (!pref?.is_enabled) handleToggle(c.type, false)
                })
              }
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              Aktifkan semua
            </button>
          )}
          {enabledCount === prefConfig.length && (
            <button
              onClick={() =>
                prefConfig.forEach((c) => {
                  const pref = prefs.find((p) => p.notif_type === c.type)
                  if (pref?.is_enabled) handleToggle(c.type, true)
                })
              }
              className="text-xs text-gray-400 font-medium hover:text-gray-600 hover:underline"
            >
              Nonaktifkan semua
            </button>
          )}
        </div>
      )}

      {/* Toggle list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prefConfig.map((config) => {
              const pref = prefs.find((p) => p.notif_type === config.type)
              const isEnabled = pref?.is_enabled ?? true
              const isSaving = saving === config.type

              return (
                <div
                  key={config.type}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition"
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-xl flex-shrink-0`}
                  >
                    {config.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{config.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{config.desc}</p>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(config.type, isEnabled)}
                    disabled={isSaving}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 focus:outline-none disabled:opacity-60 ${
                      isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={isEnabled}
                  >
                    {isSaving ? (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner
                          size="sm"
                          className={isEnabled ? 'border-white' : 'border-gray-400'}
                        />
                      </span>
                    ) : (
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-700 font-medium mb-1">ℹ️ Tentang Notifikasi</p>
        <p className="text-xs text-blue-600 leading-relaxed">
          Pengaturan ini hanya berlaku untuk notifikasi <strong>in-app</strong> (di dalam aplikasi).
          Notifikasi muncul di ikon lonceng di bagian atas halaman.
        </p>
      </div>

      {/* Link ke halaman notifikasi */}
      <div className="mt-4 text-center">
        <Link
          href="/dashboard/notifications"
          className="text-sm text-gray-500 hover:text-gray-700 transition"
        >
          Lihat semua notifikasi →
        </Link>
      </div>
    </div>
  )
}