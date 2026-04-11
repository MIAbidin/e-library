'use client'

import { useState, useEffect, useCallback } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/components/ui/Toast'

interface AccessRow {
  id: string
  department: string | null
  user_id: string | null
  user: {
    id: string
    name: string
    email: string
    department: string | null
  } | null
}

interface UserOption {
  id: string
  name: string
  email: string
  department: string | null
}

interface BookAccessManagerProps {
  bookId: string
  bookTitle: string
  initialAccessType: 'public' | 'restricted'
  onClose?: () => void
}

export function BookAccessManager({
  bookId,
  bookTitle,
  initialAccessType,
  onClose,
}: BookAccessManagerProps) {
  const [accessType, setAccessType] = useState<'public' | 'restricted'>(initialAccessType)
  const [accesses, setAccesses] = useState<AccessRow[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Add form state
  const [addType, setAddType] = useState<'department' | 'user'>('department')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [adding, setAdding] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [accessRes, usersRes] = await Promise.all([
        fetch(`/api/admin/books/${bookId}/access`),
        fetch('/api/admin/users?limit=200'),
      ])
      const accessData = await accessRes.json()
      const usersData = await usersRes.json()

      setAccesses(accessData.accesses ?? [])
      setAccessType(accessData.book?.access_type ?? 'public')

      const allUsers: UserOption[] = usersData.users ?? []
      setUsers(allUsers)

      // Departemen unik
      const depts = [...new Set(
        allUsers.map((u: UserOption) => u.department).filter(Boolean)
      )] as string[]
      setDepartments(depts.sort())
    } catch {
      toast.error('Gagal memuat data akses')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => { fetchData() }, [fetchData])

  // Toggle access type
  const handleAccessTypeChange = async (newType: 'public' | 'restricted') => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/books/${bookId}/access`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessType: newType }),
      })
      if (!res.ok) throw new Error()
      setAccessType(newType)
      toast.success(newType === 'public' ? 'Buku kini bisa dibaca semua orang' : 'Buku kini terbatas')
    } catch {
      toast.error('Gagal mengubah tipe akses')
    } finally {
      setSaving(false)
    }
  }

  // Add access
  const handleAdd = async () => {
    const department = addType === 'department' ? selectedDept : null
    const userId = addType === 'user' ? selectedUser : null

    if (!department && !userId) {
      toast.error('Pilih departemen atau pengguna terlebih dahulu')
      return
    }

    setAdding(true)
    try {
      const res = await fetch(`/api/admin/books/${bookId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setAccesses(prev => [...prev, data])
      setSelectedDept('')
      setSelectedUser('')
      setUserSearch('')
      toast.success('Akses berhasil ditambahkan')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambah akses')
    } finally {
      setAdding(false)
    }
  }

  // Delete access
  const handleDelete = async (accessId: string) => {
    setDeleting(accessId)
    try {
      const res = await fetch(`/api/admin/books/${bookId}/access/${accessId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setAccesses(prev => prev.filter(a => a.id !== accessId))
      toast.success('Akses dihapus')
    } catch {
      toast.error('Gagal menghapus akses')
    } finally {
      setDeleting(null)
    }
  }

  // Filtered users for search
  const filteredUsers = users.filter(u =>
    userSearch.trim() === '' ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.department ?? '').toLowerCase().includes(userSearch.toLowerCase())
  ).slice(0, 20)

  // Group accesses
  const deptAccesses  = accesses.filter(a => a.department && !a.user_id)
  const userAccesses  = accesses.filter(a => a.user_id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900 text-base leading-snug">
          Kontrol Akses
        </h3>
        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs" title={bookTitle}>
          {bookTitle}
        </p>
      </div>

      {/* ── Access type toggle ── */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tipe Akses
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => handleAccessTypeChange('public')}
            disabled={saving}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-2
              text-sm font-medium transition
              ${accessType === 'public'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span className="text-lg">🌐</span>
            <div className="text-left">
              <div className="font-semibold text-sm">Publik</div>
              <div className="text-xs opacity-70">Semua orang bisa baca</div>
            </div>
            {accessType === 'public' && (
              <span className="ml-auto text-green-600">✓</span>
            )}
          </button>

          <button
            onClick={() => handleAccessTypeChange('restricted')}
            disabled={saving}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-lg border-2
              text-sm font-medium transition
              ${accessType === 'restricted'
                ? 'border-amber-500 bg-amber-50 text-amber-700'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
          >
            <span className="text-lg">🔒</span>
            <div className="text-left">
              <div className="font-semibold text-sm">Terbatas</div>
              <div className="text-xs opacity-70">Hanya yang diizinkan</div>
            </div>
            {accessType === 'restricted' && (
              <span className="ml-auto text-amber-600">✓</span>
            )}
          </button>
        </div>

        {saving && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <LoadingSpinner size="sm" /> Menyimpan...
          </div>
        )}
      </div>

      {/* ── Restricted controls ── */}
      {accessType === 'restricted' && (
        <>
          {/* Add access form */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600">Tambah Akses</p>
            </div>
            <div className="p-4 space-y-3">
              {/* Tab: dept vs user */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setAddType('department')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition
                    ${addType === 'department'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🏢 Per Departemen
                </button>
                <button
                  onClick={() => setAddType('user')}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition
                    ${addType === 'user'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'}`}
                >
                  👤 Per Pengguna
                </button>
              </div>

              {addType === 'department' ? (
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Pilih Departemen --</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau departemen..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {userSearch && (
                    <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-50">
                      {filteredUsers.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Tidak ditemukan</p>
                      ) : (
                        filteredUsers.map(u => (
                          <button
                            key={u.id}
                            onClick={() => { setSelectedUser(u.id); setUserSearch(`${u.name} — ${u.email}`) }}
                            className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 transition text-sm
                              ${selectedUser === u.id ? 'bg-blue-50' : ''}`}
                          >
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-400">
                              {u.email}{u.department ? ` · ${u.department}` : ''}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {selectedUser && !userSearch.includes('@') && (
                    <p className="text-xs text-green-600">✓ Pengguna dipilih</p>
                  )}
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={adding || (addType === 'department' ? !selectedDept : !selectedUser)}
                className="w-full py-2 text-sm font-medium text-white bg-blue-600
                  rounded-lg hover:bg-blue-700 transition disabled:opacity-50
                  flex items-center justify-center gap-2"
              >
                {adding && <LoadingSpinner size="sm" className="border-white" />}
                {adding ? 'Menambahkan...' : '+ Tambah Akses'}
              </button>
            </div>
          </div>

          {/* Current access list */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Daftar Akses ({accesses.length})
            </p>

            {loading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="md" />
              </div>
            ) : accesses.length === 0 ? (
              <div className="text-center py-6 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-amber-700 mt-2 font-medium">Belum ada akses ditambahkan</p>
                <p className="text-xs text-amber-600 mt-1">
                  Buku restricted tanpa akses → tidak bisa dibaca siapapun
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Dept access */}
                {deptAccesses.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium">Per Departemen</p>
                    <div className="space-y-1.5">
                      {deptAccesses.map(a => (
                        <div key={a.id}
                          className="flex items-center justify-between px-3 py-2.5
                            bg-blue-50 border border-blue-100 rounded-lg">
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">🏢</span>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{a.department}</p>
                              <p className="text-xs text-gray-400">
                                Seluruh karyawan departemen ini
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            className="text-xs text-red-500 hover:text-red-700 transition
                              p-1 rounded hover:bg-red-50 flex-shrink-0"
                            title="Hapus akses"
                          >
                            {deleting === a.id ? <LoadingSpinner size="sm" /> : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User access */}
                {userAccesses.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium mt-3">Per Pengguna</p>
                    <div className="space-y-1.5">
                      {userAccesses.map(a => (
                        <div key={a.id}
                          className="flex items-center justify-between px-3 py-2.5
                            bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center
                              justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                              {a.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {a.user?.name ?? 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {a.user?.email}
                                {a.user?.department ? ` · ${a.user.department}` : ''}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            className="text-xs text-red-500 hover:text-red-700 transition
                              p-1 rounded hover:bg-red-50 flex-shrink-0"
                            title="Hapus akses"
                          >
                            {deleting === a.id ? <LoadingSpinner size="sm" /> : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info publik */}
      {accessType === 'public' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3">
          <span className="text-xl">🌐</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Akses Terbuka</p>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              Buku ini dapat dibaca oleh siapa saja — termasuk pengunjung yang belum login.
              Tidak ada pembatasan akses.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}