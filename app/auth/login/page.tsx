import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import Link from 'next/link'
import { Suspense } from 'react'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect(session.user.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="auth-root">
      <style>{`
        .auth-root {
          min-height: 100vh;
          display: flex;
          background: #0c0f1a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .auth-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 60%, rgba(59,100,246,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 55%),
            radial-gradient(ellipse 30% 30% at 60% 85%, rgba(59,130,246,0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .auth-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .auth-left {
          flex: 1;
          display: none;
          flex-direction: column;
          justify-content: center;
          padding: 5rem;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .auth-left { display: flex; }
        }

        .brand-mark {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 4rem;
        }

        .brand-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }

        .brand-name {
          font-family: 'Instrument Serif', serif;
          font-size: 1.25rem;
          color: rgba(255,255,255,0.9);
          letter-spacing: -0.01em;
        }

        .auth-headline {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(2.5rem, 4vw, 3.5rem);
          color: white;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }

        .auth-headline em {
          font-style: italic;
          background: linear-gradient(90deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subtext {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 420px;
        }

        .feature-list {
          margin-top: 3.5rem;
          display: flex; flex-direction: column; gap: 16px;
          list-style: none; padding: 0;
        }

        .feature-item {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,0.55);
          font-size: 0.9375rem;
        }

        .feature-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
        }

        .auth-right {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .auth-right {
            width: 480px;
            flex-shrink: 0;
            border-left: 1px solid rgba(255,255,255,0.06);
            padding: 3rem;
          }
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
        }

        .auth-card-header {
          margin-bottom: 2.5rem;
        }

        .auth-card-title {
          font-family: 'Instrument Serif', serif;
          font-size: 2rem;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .auth-card-sub {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.4);
        }

        .auth-footer-links {
          margin-top: 2rem;
          text-align: center;
        }

        .auth-footer-links p {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.35);
        }

        .auth-footer-links a {
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .auth-footer-links a:hover {
          color: white;
        }

        .copyright {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.2);
          text-align: center;
        }
      `}</style>

      <div className="auth-bg" />
      <div className="auth-grid" />

      {/* Left panel */}
      <div className="auth-left">
        <div className="brand-mark">
          <div className="brand-icon">📚</div>
          <span className="brand-name">E-Library Perusahaan</span>
        </div>

        <h1 className="auth-headline">
          Ilmu tanpa batas,<br />
          <em>akses tanpa hambatan.</em>
        </h1>

        <p className="auth-subtext">
          Platform perpustakaan digital internal perusahaan. Ribuan koleksi e-book 
          tersedia kapan saja, di mana saja.
        </p>

        <ul className="feature-list">
          {[
            'Akses koleksi e-book perusahaan',
            'Lacak progres membaca Anda',
            'Notifikasi buku & pengumuman terbaru',
            'Sinkronisasi antar perangkat otomatis',
          ].map((f) => (
            <li key={f} className="feature-item">
              <span className="feature-dot" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Selamat datang</h2>
            <p className="auth-card-sub">Masuk ke akun perusahaan Anda</p>
          </div>

          <Suspense>
            <LoginForm />
          </Suspense>

          <div className="auth-footer-links">
            <p>
              Belum punya akun?{' '}
              <Link href="/auth/register">Daftar sekarang</Link>
            </p>
          </div>

          <p className="copyright">
            &copy; {new Date().getFullYear()} E-Library Perusahaan. Confidential.
          </p>
        </div>
      </div>
    </div>
  )
}