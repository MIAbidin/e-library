'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ResetPasswordFormProps {
  token: string
  userId: string
}

export default function ResetPasswordForm({ token, userId }: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password minimal 8 karakter'); return }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/auth/login?reset=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm
          rounded-lg px-4 py-3">
          ⚠️ {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password Baru
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            disabled={loading}
            className="w-full px-4 py-2.5 pr-11 text-sm border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Konfirmasi Password
        </label>
        <input
          type={showPass ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi password baru"
          required
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>
      <button
        type="submit"
        disabled={loading || password !== confirm || password.length < 8}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white font-medium py-2.5 rounded-lg text-sm transition
          flex items-center justify-center gap-2"
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-white
            border-t-transparent rounded-full animate-spin" />
        )}
        Simpan Password Baru
      </button>
    </form>
  )
}