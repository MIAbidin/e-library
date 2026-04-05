'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'form' | 'success'

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')

  // Password strength
  const strength = (() => {
    if (!password) return null
    if (password.length < 6) return { label: 'Lemah', color: 'bg-red-400', pct: 25 }
    if (password.length < 8) return { label: 'Cukup', color: 'bg-yellow-400', pct: 50 }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { label: 'Baik', color: 'bg-blue-400', pct: 75 }
    }
    return { label: 'Kuat', color: 'bg-green-500', pct: 100 }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          department: department.trim() || null,
          password,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setRegisteredEmail(email.toLowerCase().trim())
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  // ===== STEP: SUCCESS =====
  if (step === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">📧</div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Cek Email Anda!
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Kami mengirimkan link aktivasi ke{' '}
            <span className="font-semibold text-blue-600">{registeredEmail}</span>.
            Klik link tersebut untuk mengaktifkan akun Anda.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-blue-800">Yang perlu dilakukan:</p>
          {[
            'Buka email Anda',
            'Cari email dari E-Library Perusahaan',
            'Klik tombol "Aktivasi Akun"',
            'Login dengan email dan password Anda',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs
                flex items-center justify-center font-bold flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-xs text-blue-700">{step}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400">
          Link berlaku selama 24 jam. Tidak menerima email?{' '}
          <button
            onClick={() => setStep('form')}
            className="text-blue-600 hover:underline"
          >
            Coba daftar ulang
          </button>
        </p>

        <Link
          href="/auth/login"
          className="block w-full text-center py-2.5 text-sm font-medium
            text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Ke Halaman Login
        </Link>
      </div>
    )
  }

  // ===== STEP: FORM =====
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm
          rounded-lg px-4 py-3 flex items-start gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Nama */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama sesuai data perusahaan"
          required
          disabled={loading}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Email Perusahaan <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@perusahaan.com"
          required
          disabled={loading}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Departemen */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Departemen
          <span className="text-gray-400 font-normal ml-1">(opsional)</span>
        </label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Contoh: IT, Finance, HR, Marketing"
          disabled={loading}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            disabled={loading}
            className="w-full px-3 py-2.5 pr-11 text-sm border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
              hover:text-gray-600"
          >
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>

        {/* Strength bar */}
        {strength && (
          <div className="mt-2">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Kekuatan password: <span className="font-medium">{strength.label}</span>
            </p>
          </div>
        )}
      </div>

      {/* Konfirmasi Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Konfirmasi Password <span className="text-red-500">*</span>
        </label>
        <input
          type={showPass ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi password"
          required
          disabled={loading}
          className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
        />
        {confirm && (
          <p className={`text-xs mt-1 ${password === confirm ? 'text-green-600' : 'text-red-500'}`}>
            {password === confirm ? '✓ Password cocok' : '✗ Password tidak cocok'}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || password !== confirm || password.length < 8}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white font-medium py-2.5 rounded-lg text-sm transition
          flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent
              rounded-full animate-spin inline-block" />
            Mendaftarkan...
          </>
        ) : (
          'Daftar & Kirim Verifikasi'
        )}
      </button>
    </form>
  )
}