import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import RegisterForm from './RegisterForm'
import Link from 'next/link'

export default async function RegisterPage() {
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
          align-items: center;
          justify-content: center;
          background: #0c0f1a;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 2rem 1.5rem;
        }

        .auth-bg {
          position: fixed; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 40%, rgba(139,92,246,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 20% 70%, rgba(59,130,246,0.08) 0%, transparent 55%);
          pointer-events: none; z-index: 0;
        }

        .auth-grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none; z-index: 0;
        }

        .auth-panel {
          position: relative; z-index: 1;
          width: 100%; max-width: 460px;
        }

        .auth-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 2rem;
          text-decoration: none;
        }

        .auth-logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }

        .auth-logo-text {
          font-family: 'Instrument Serif', serif;
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.8);
        }

        .auth-title {
          font-family: 'Instrument Serif', serif;
          font-size: 2rem;
          color: white;
          letter-spacing: -0.02em;
          margin-bottom: 0.375rem;
        }

        .auth-subtitle {
          font-size: 0.9375rem;
          color: rgba(255,255,255,0.4);
          margin-bottom: 2rem;
        }

        .auth-links {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.3);
        }

        .auth-links a {
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .auth-links a:hover { color: white; }

        .copyright {
          margin-top: 1.5rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.18);
          text-align: center;
        }
      `}</style>

      <div className="auth-bg" />
      <div className="auth-grid" />

      <div className="auth-panel">
        <Link href="/home" className="auth-logo">
          <div className="auth-logo-icon">📚</div>
          <span className="auth-logo-text">E-Library Perusahaan</span>
        </Link>

        <h1 className="auth-title">Buat akun baru</h1>
        <p className="auth-subtitle">Daftarkan diri dengan email perusahaan Anda</p>

        <RegisterForm />

        <div className="auth-links">
          <p>
            Sudah punya akun?{' '}
            <Link href="/auth/login">Masuk di sini</Link>
          </p>
        </div>

        <p className="copyright">
          &copy; {new Date().getFullYear()} E-Library Perusahaan. Confidential.
        </p>
      </div>
    </div>
  )
}