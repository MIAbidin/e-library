'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'

interface NotifRecord {
  id: string
  type: string
  title: string
  body: string
  created_at: string
  recipientCount: number
  book: { id: string; title: string } | null
  creator: { name: string } | null
}

const typeLabel: Record<string, string> = {
  new_book: '📗 Buku Baru',
  announcement: '📢 Pengumuman',
  reading_reminder: '⏰ Pengingat',
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotifRecord[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [deleteNotif, setDeleteNotif] = useState<NotifRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetDept, setTargetDept] = useState('')
  const [departments, setDepartments] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notifications?page=${page}&limit=10`)
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Gagal memuat data notifikasi')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  useEffect(() => {
    fetch('/api/admin/users?limit=100')
      .then((r) => r.json())
      .then((data) => {
        const depts = [
          ...new Set(
            (data.users ?? [])
              .map((u: { department: string | null }) => u.department)
              .filter(Boolean)
          ),
        ] as string[]
        setDepartments(depts)
      })
      .catch(() => {})
  }, [])

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Judul dan isi pengumuman wajib diisi')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetDepartment: targetDept || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(`Pengumuman terkirim ke ${data.sentTo} pengguna`)
      setShowForm(false)
      setTitle('')
      setBody('')
      setTargetDept('')
      setPreview(false)
      fetchNotifications()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim pengumuman')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteNotif) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/notifications/${deleteNotif.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Notifikasi berhasil dihapus')
      setDeleteNotif(null)
      fetchNotifications()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus notifikasi')
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setTitle('')
    setBody('')
    setTargetDept('')
    setPreview(false)
  }

  return (
    <div>
      <PageHeader
        title="Notifikasi & Pengumuman"
        description={`${total} notifikasi dikirim`}
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
              text-white text-sm font-medium px-3 py-2 lg:px-4 lg:py-2.5
              rounded-xl transition shadow-sm"
          >
            <span>📢</span>
            <span className="hidden sm:inline">Buat Pengumuman</span>
            <span className="sm:hidden">Kirim</span>
          </button>
        }
      />

      {/* Riwayat */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-gray-500 text-sm">Belum ada notifikasi dikirim</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Notifikasi', 'Tipe', 'Penerima', 'Dikirim oleh', 'Tanggal', ''].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-semibold
                          text-gray-500 uppercase tracking-wider last:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <tr key={notif.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{notif.body}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {typeLabel[notif.type] ?? notif.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">
                        {notif.recipientCount} orang
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(notif.creator as { name: string } | null)?.name ?? 'System'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(notif.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteNotif(notif)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                            rounded-lg transition"
                          title="Hapus notifikasi"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900 flex-1">{notif.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {typeLabel[notif.type] ?? notif.type}
                      </span>
                      <button
                        onClick={() => setDeleteNotif(notif)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{notif.body}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>👥 {notif.recipientCount} penerima</span>
                    <span>·</span>
                    <span>{formatDate(notif.created_at, { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">{page} / {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                      hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg
                      hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== MODAL FORM KIRIM PENGUMUMAN ===== */}
      <Modal isOpen={showForm} onClose={handleCloseForm} title="Buat Pengumuman" size="md">
        {preview ? (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              Preview Pengumuman
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg flex-shrink-0">
                  📢
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Target:</span>{' '}
                {targetDept ? `Departemen ${targetDept}` : 'Semua pengguna aktif'}
              </p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setPreview(false)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600
                  border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                ← Edit Lagi
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600
                  rounded-lg hover:bg-blue-700 transition disabled:opacity-70
                  flex items-center justify-center gap-2"
              >
                {sending && <LoadingSpinner size="sm" className="border-white" />}
                {sending ? 'Mengirim...' : '📢 Kirim Sekarang'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Judul Pengumuman <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Koleksi Buku Baru Tersedia!"
                maxLength={100}
                className="w-full px-3 py-2.5 text-sm border border-gray-200
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Isi Pengumuman <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tulis isi pengumuman di sini..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2.5 text-sm border border-gray-200
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/500</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Penerima
              </label>
              <select
                value={targetDept}
                onChange={(e) => setTargetDept(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200
                  rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Semua Pengguna Aktif</option>
                {departments.map((d) => (
                  <option key={d} value={d}>Departemen: {d}</option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700">
                💡 Pengumuman akan muncul di notifikasi in-app semua pengguna yang dipilih.
              </p>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button
                onClick={handleCloseForm}
                className="flex-1 px-4 py-2.5 text-sm text-gray-600
                  border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => setPreview(true)}
                disabled={!title.trim() || !body.trim()}
                className="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600
                  rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Preview →
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== CONFIRM DELETE NOTIFIKASI ===== */}
      <ConfirmDialog
        isOpen={!!deleteNotif}
        onClose={() => setDeleteNotif(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Hapus Notifikasi"
        message={`Yakin ingin menghapus notifikasi "${deleteNotif?.title}"? Notifikasi ini akan dihapus dari inbox semua penerima (${deleteNotif?.recipientCount} orang). Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        danger
      />
    </div>
  )
}