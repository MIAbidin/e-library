'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'ACCOUNT_INACTIVE') {
          router.push('/auth/inactive')
          return
        }
        setError('Email atau password tidak valid. Silakan coba lagi.')
        return
      }

      const res = await fetch('/api/auth/session')
      const session = await res.json()

      if (session?.user?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 13px 16px;
          color: white;
          font-size: 0.9375rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          box-sizing: border-box;
        }

        .form-input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        .form-input:focus {
          border-color: rgba(59,130,246,0.6);
          background: rgba(255,255,255,0.07);
        }

        .form-input-wrap {
          position: relative;
        }

        .eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          padding: 0;
          font-size: 1rem;
          transition: color 0.2s;
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px;
        }

        .eye-btn:hover { color: rgba(255,255,255,0.6); }

        .submit-btn {
          width: 100%;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 0.9375rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 0.875rem;
          color: #fca5a5;
          margin-bottom: 1.25rem;
          display: flex; align-items: flex-start; gap: 8px;
        }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 1.5rem 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        .divider-text {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.25);
        }

        .forgot-link {
          display: block;
          text-align: right;
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          margin-top: 8px;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: rgba(255,255,255,0.65); }
      `}</style>

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
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            disabled={loading}
            className="form-input"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="form-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              className="form-input"
              style={{ paddingRight: 48 }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="eye-btn"
            >
              {showPassword ? (
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
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <>
              <div className="spinner" />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </button>
      </form>
    </>
  )
}