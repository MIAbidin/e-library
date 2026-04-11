'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  token: string
  userId: string
}

export default function ResetPasswordForm({ token, userId }: Props) {
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
      setError(err instanceof Error ? err.message : 'Gagal mengatur password')
    } finally {
      setLoading(false)
    }
  }

  const getStrength = () => {
    if (!password) return null
    if (password.length < 6) return { label: 'Lemah', pct: 20, color: '#ef4444' }
    if (password.length < 8) return { label: 'Cukup', pct: 45, color: '#f59e0b' }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { label: 'Baik', pct: 70, color: '#3b82f6' }
    }
    return { label: 'Kuat', pct: 100, color: '#22c55e' }
  }

  const strength = getStrength()

  return (
    <>
      <style>{FORM_STYLES}</style>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="error-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="8" cy="8" r="7" stroke="#f87171" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 10.5v.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Password Baru</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              disabled={loading}
              className="form-input"
              style={{ paddingRight: 48 }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="eye-btn">
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {strength && (
            <div style={{ marginTop: 8 }}>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: strength.color, marginTop: 4, display: 'block' }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Konfirmasi Password</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ulangi password baru"
            required
            disabled={loading}
            className="form-input"
            autoComplete="new-password"
          />
          {confirm && (
            <span style={{ fontSize: '0.75rem', marginTop: 4, display: 'block', color: password === confirm ? '#4ade80' : '#f87171' }}>
              {password === confirm ? '✓ Password cocok' : '✗ Tidak cocok'}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || password !== confirm || password.length < 8}
          className="submit-btn"
        >
          {loading ? (
            <>
              <div className="spinner" />
              Menyimpan...
            </>
          ) : (
            'Simpan Password Baru'
          )}
        </button>

        <Link href="/auth/login" className="back-link">
          Kembali ke login
        </Link>
      </form>
    </>
  )
}

const FORM_STYLES = `
  .form-group { margin-bottom: 1.25rem; }

  .form-label {
    display: block;
    font-size: 0.8125rem; font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-bottom: 0.5rem;
    letter-spacing: 0.02em; text-transform: uppercase;
  }

  .form-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; padding: 13px 16px;
    color: white; font-size: 0.9375rem;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s;
    outline: none; box-sizing: border-box;
  }
  .form-input::placeholder { color: rgba(255,255,255,0.2); }
  .form-input:focus {
    border-color: rgba(59,130,246,0.6);
    background: rgba(255,255,255,0.07);
  }

  .eye-btn {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: rgba(255,255,255,0.3);
    cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; transition: color 0.2s;
  }
  .eye-btn:hover { color: rgba(255,255,255,0.6); }

  .submit-btn {
    width: 100%; background: #3b82f6; color: white;
    border: none; border-radius: 10px; padding: 14px;
    font-size: 0.9375rem; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: background 0.2s, transform 0.1s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin-top: 0.5rem;
  }
  .submit-btn:hover:not(:disabled) { background: #2563eb; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .error-box {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px; padding: 12px 16px;
    font-size: 0.875rem; color: #fca5a5;
    margin-bottom: 1.25rem;
    display: flex; align-items: flex-start; gap: 8px;
  }

  .back-link {
    display: block; text-align: center;
    margin-top: 1.25rem; font-size: 0.875rem;
    color: rgba(255,255,255,0.3); text-decoration: none;
    transition: color 0.2s;
  }
  .back-link:hover { color: rgba(255,255,255,0.6); }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`