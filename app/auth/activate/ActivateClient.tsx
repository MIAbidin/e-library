'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ActivateClientProps {
  status: 'valid' | 'invalid' | 'expired' | 'already_active'
  token?: string
  userId?: string
  name?: string
  email?: string
}

export default function ActivateClient({
  status,
  token,
  userId,
  name,
  email,
}: ActivateClientProps) {
  const router = useRouter()
  const [activating, setActivating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Auto-aktivasi saat komponen mount (status valid)
  useEffect(() => {
    if (status === 'valid' && token && userId) {
      handleActivate()
    }
  }, []) // eslint-disable-line

  const handleActivate = async () => {
    setActivating(true)
    setError('')
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)

      // Auto redirect ke login setelah 3 detik
      setTimeout(() => router.push('/auth/login?activated=1'), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal aktivasi')
    } finally {
      setActivating(false)
    }
  }

  // ===== SUDAH AKTIF =====
  if (status === 'already_active') {
    return (
      <ActivateLayout>
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold text-gray-900">Akun Sudah Aktif</h1>
          <p className="text-sm text-gray-500">
            Akun Anda sudah aktif. Silakan login langsung.
          </p>
          <Link href="/auth/login"
            className="block w-full text-center py-2.5 text-sm font-medium
              text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Login Sekarang
          </Link>
        </div>
      </ActivateLayout>
    )
  }

  // ===== TOKEN TIDAK VALID =====
  if (status === 'invalid') {
    return (
      <ActivateLayout>
        <div className="text-center space-y-4">
          <div className="text-5xl">❌</div>
          <h1 className="text-xl font-bold text-gray-900">Link Tidak Valid</h1>
          <p className="text-sm text-gray-500">
            Link aktivasi ini tidak valid atau sudah digunakan.
          </p>
          <Link href="/auth/register"
            className="block w-full text-center py-2.5 text-sm font-medium
              text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Daftar Ulang
          </Link>
          <Link href="/auth/login"
            className="block w-full text-center py-2.5 text-sm
              text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Sudah punya akun? Login
          </Link>
        </div>
      </ActivateLayout>
    )
  }

  // ===== TOKEN KADALUARSA =====
  if (status === 'expired') {
    return (
      <ActivateLayout>
        <div className="text-center space-y-4">
          <div className="text-5xl">⏰</div>
          <h1 className="text-xl font-bold text-gray-900">Link Kadaluarsa</h1>
          <p className="text-sm text-gray-500">
            Link aktivasi untuk <span className="font-medium text-blue-600">{email}</span> sudah
            kadaluarsa (berlaku 24 jam).
          </p>
          <ResendActivation email={email!} />
          <Link href="/auth/register"
            className="block w-full text-center py-2.5 text-sm
              text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
            Daftar dengan akun baru
          </Link>
        </div>
      </ActivateLayout>
    )
  }

  // ===== PROSES AKTIVASI (STATUS VALID) =====
  return (
    <ActivateLayout>
      {done ? (
        // Sukses
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🎉</div>
          <h1 className="text-xl font-bold text-gray-900">Akun Berhasil Diaktifkan!</h1>
          <p className="text-sm text-gray-500">
            Selamat, <strong>{name}</strong>! Akun Anda sudah aktif.
            Anda akan diarahkan ke halaman login dalam 3 detik...
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-700">
              ✅ Email <span className="font-medium">{email}</span> telah diverifikasi
            </p>
          </div>
          <Link href="/auth/login?activated=1"
            className="block w-full text-center py-2.5 text-sm font-medium
              text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition">
            Login Sekarang →
          </Link>
        </div>
      ) : error ? (
        // Error
        <div className="text-center space-y-4">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-bold text-gray-900">Gagal Aktivasi</h1>
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            {error}
          </p>
          <button
            onClick={handleActivate}
            className="block w-full text-center py-2.5 text-sm font-medium
              text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        // Loading / proses aktivasi
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent
              rounded-full animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Mengaktifkan Akun...</h1>
          <p className="text-sm text-gray-500">
            Mohon tunggu sebentar, kami sedang memverifikasi email{' '}
            <span className="font-medium text-blue-600">{email}</span>
          </p>
        </div>
      )}
    </ActivateLayout>
  )
}

// ===== Komponen resend aktivasi =====
function ResendActivation({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleResend = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim ulang')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
        <p className="text-sm text-green-700">
          ✅ Email aktivasi baru dikirim ke <strong>{email}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleResend}
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600
          rounded-lg hover:bg-blue-700 transition disabled:opacity-70
          flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent
            rounded-full animate-spin" />
        )}
        {loading ? 'Mengirim...' : '📧 Kirim Ulang Email Aktivasi'}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}

// ===== Wrapper layout =====
function ActivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
      flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14
            bg-blue-600 rounded-2xl mb-3 shadow-lg">
            <span className="text-2xl">📚</span>
          </div>
          <p className="font-bold text-gray-900">E-Library Perusahaan</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}