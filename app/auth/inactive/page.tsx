import Link from 'next/link'

export default function InactivePage() {
  return (
    <div className="root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

        .root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: #0c0f1a;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem 1.5rem;
          position: relative; overflow: hidden;
        }

        .bg {
          position: fixed; inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(239,68,68,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px; pointer-events: none;
        }

        .panel {
          position: relative; z-index: 1;
          width: 100%; max-width: 420px;
          text-align: center;
        }

        .logo-link {
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none; margin-bottom: 2.5rem;
        }

        .logo-icon {
          width: 38px; height: 38px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .logo-text {
          font-family: 'Instrument Serif', serif;
          font-size: 1.0625rem; color: rgba(255,255,255,0.7);
        }

        .icon-wrap { margin-bottom: 1.5rem; display: flex; justify-content: center; }

        .title {
          font-family: 'Instrument Serif', serif;
          font-size: 2rem; color: white;
          letter-spacing: -0.02em; margin-bottom: 0.75rem;
        }

        .desc {
          font-size: 0.9375rem; color: rgba(255,255,255,0.4);
          line-height: 1.7; margin-bottom: 2rem;
        }

        .notice {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 16px 20px;
          font-size: 0.875rem; color: rgba(255,255,255,0.45);
          line-height: 1.65; margin-bottom: 2rem; text-align: left;
        }

        .notice strong { color: rgba(255,255,255,0.65); }

        .cta {
          display: flex; align-items: center; justify-content: center;
          width: 100%; background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.65);
          text-decoration: none; border-radius: 10px;
          padding: 14px; font-size: 0.9375rem; font-weight: 500;
          transition: background 0.2s, color 0.2s;
        }
        .cta:hover { background: rgba(255,255,255,0.1); color: white; }
      `}</style>

      <div className="bg" />
      <div className="grid" />

      <div className="panel">
        <Link href="/home" className="logo-link">
          <div className="logo-icon">📚</div>
          <span className="logo-text">E-Library Perusahaan</span>
        </Link>

        <div className="icon-wrap">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="23" stroke="#ef4444" strokeWidth="1.5" />
            <rect x="20" y="14" width="8" height="12" rx="2" stroke="#ef4444" strokeWidth="1.5" />
            <rect x="16" y="24" width="16" height="11" rx="2" stroke="#ef4444" strokeWidth="1.5" />
            <circle cx="24" cy="30" r="1.5" fill="#ef4444" />
          </svg>
        </div>

        <h1 className="title">Akun dinonaktifkan</h1>
        <p className="desc">
          Akun Anda saat ini tidak aktif dan tidak bisa digunakan untuk login.
        </p>

        <div className="notice">
          <strong>Apa yang perlu dilakukan?</strong>
          <br /><br />
          Hubungi Administrator IT perusahaan Anda untuk mengaktifkan kembali akun.
          Berikan nama dan email yang terdaftar saat mendaftar.
        </div>

        <Link href="/auth/login" className="cta">
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  )
}