'use client'

import { useState } from 'react'
import Link from 'next/link'

type Step = 'form' | 'success'

export default function RegisterForm() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError('Password minimal 8 karakter'); return }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok'); return }

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

  if (step === 'success') {
    return (
      <>
        <style>{FORM_STYLES}</style>
        <div className="success-card">
          <div className="success-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="#22c55e" strokeWidth="1.5" />
              <path d="M10 16l4.5 4.5L22 11" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="success-title">Cek email Anda!</h3>
          <p className="success-desc">
            Link aktivasi dikirim ke{' '}
            <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
              {registeredEmail}
            </span>.
            Klik link tersebut untuk mengaktifkan akun.
          </p>

          <div className="steps-list">
            {[
              'Buka inbox email Anda',
              'Temukan email dari E-Library',
              'Klik tombol aktivasi',
              'Akun langsung aktif, login sekarang',
            ].map((s, i) => (
              <div key={i} className="step-item">
                <span className="step-num">{i + 1}</span>
                <span className="step-text">{s}</span>
              </div>
            ))}
          </div>

          <p className="success-note">
            Link berlaku 24 jam. Tidak menerima?{' '}
            <button onClick={() => setStep('form')} className="text-link">
              Coba daftar ulang
            </button>
          </p>

          <Link href="/auth/login" className="submit-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Ke halaman login
          </Link>
        </div>
      </>
    )
  }

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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="Nama sesuai data perusahaan"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Departemen</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
              placeholder="IT, Finance, HR..."
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Perusahaan *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="nama@perusahaan.com"
            className="form-input"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Minimal 8 karakter"
              className="form-input"
              style={{ paddingRight: 48 }}
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
                Kekuatan: {strength.label}
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Konfirmasi Password *</label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading}
            placeholder="Ulangi password"
            className="form-input"
          />
          {confirm && (
            <span style={{ fontSize: '0.75rem', marginTop: 4, display: 'block', color: password === confirm ? '#4ade80' : '#f87171' }}>
              {password === confirm ? '✓ Password cocok' : '✗ Password tidak cocok'}
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
              Mendaftarkan...
            </>
          ) : (
            'Daftar & Kirim Verifikasi'
          )}
        </button>
      </form>
    </>
  )
}

const FORM_STYLES = `
  .form-group { margin-bottom: 1.125rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

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
    padding: 12px 16px;
    color: white;
    font-size: 0.9375rem;
    font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
    box-sizing: border-box;
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
  .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .error-box {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px; padding: 12px 16px;
    font-size: 0.875rem; color: #fca5a5;
    margin-bottom: 1.25rem;
    display: flex; align-items: flex-start; gap: 8px;
  }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; flex-shrink: 0;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .success-card { text-align: center; }
  .success-icon { margin-bottom: 1rem; display: flex; justify-content: center; }
  .success-title {
    font-family: 'Instrument Serif', serif;
    font-size: 1.75rem; color: white;
    letter-spacing: -0.02em; margin-bottom: 0.75rem;
  }
  .success-desc {
    font-size: 0.9375rem; color: rgba(255,255,255,0.45);
    line-height: 1.65; margin-bottom: 2rem;
  }
  .steps-list {
    text-align: left; margin-bottom: 1.5rem;
    display: flex; flex-direction: column; gap: 10px;
  }
  .step-item {
    display: flex; align-items: center; gap: 12px;
    font-size: 0.875rem; color: rgba(255,255,255,0.5);
  }
  .step-num {
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3);
    color: #60a5fa; font-size: 0.75rem; font-weight: 600;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .success-note {
    font-size: 0.8125rem; color: rgba(255,255,255,0.3);
    margin-bottom: 1.5rem; line-height: 1.6;
  }
  .text-link {
    background: none; border: none; color: rgba(255,255,255,0.55);
    cursor: pointer; font-size: inherit; font-family: inherit;
    text-decoration: underline; text-decoration-color: rgba(255,255,255,0.25);
    transition: color 0.2s; padding: 0;
  }
  .text-link:hover { color: white; }
`