import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

/**
 * Aktivasi langsung di server — tidak perlu klik tombol lagi.
 * Begitu user membuka link dari email, akun langsung diaktifkan.
 */
export default async function ActivatePage({ searchParams }: PageProps) {
  const { token } = await searchParams

  if (!token) redirect('/auth/login')

  const supabase = createAdminClient()

  // Cari user berdasarkan token
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, is_active, activation_token_expires')
    .eq('activation_token', token)
    .maybeSingle()

  // Token tidak valid
  if (!user) {
    return <ActivateLayout status="invalid" />
  }

  // Sudah aktif sebelumnya
  if (user.is_active) {
    return <ActivateLayout status="already_active" name={user.name} />
  }

  // Cek kadaluarsa
  const isExpired = user.activation_token_expires
    ? new Date(user.activation_token_expires) < new Date()
    : true

  if (isExpired) {
    return <ActivateLayout status="expired" email={user.email} />
  }

  // ✅ Aktifkan akun langsung (server-side, satu klik dari email)
  const { error } = await supabase
    .from('users')
    .update({
      is_active: true,
      activation_token: null,
      activation_token_expires: null,
    })
    .eq('id', user.id)

  if (error) {
    return <ActivateLayout status="error" />
  }

  return <ActivateLayout status="success" name={user.name} email={user.email} />
}

// ─── UI Components ─────────────────────────────────────────────────────────

type Status = 'success' | 'invalid' | 'expired' | 'already_active' | 'error'

function ActivateLayout({
  status,
  name,
  email,
}: {
  status: Status
  name?: string
  email?: string
}) {
  const config = {
    success: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M15 24l7 7 11-14" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: `Akun aktif, ${name}!`,
      desc: (
        <>
          Email <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{email}</strong> berhasil 
          diverifikasi. Anda sudah bisa login dan mulai membaca.
        </>
      ),
      cta: { href: '/auth/login', label: 'Masuk sekarang →' },
      ctaStyle: { background: '#22c55e' },
    },
    already_active: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M15 24l7 7 11-14" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: 'Akun sudah aktif',
      desc: <>Akun {name ? <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{name}</strong> : 'Anda'} sudah aktif sebelumnya. Silakan login langsung.</>,
      cta: { href: '/auth/login', label: 'Login sekarang →' },
      ctaStyle: {},
    },
    invalid: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M16 16l16 16M32 16L16 32" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Link tidak valid',
      desc: <>Link aktivasi ini tidak valid atau sudah pernah digunakan. Coba daftar ulang untuk mendapatkan link baru.</>,
      cta: { href: '/auth/register', label: 'Daftar ulang →' },
      ctaStyle: { background: '#6b7280' },
    },
    expired: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M24 14v11l7 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Link kadaluarsa',
      desc: (
        <>
          Link aktivasi untuk{' '}
          <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{email}</strong>{' '}
          sudah kadaluarsa (berlaku 24 jam). Daftar ulang untuk mendapatkan link baru.
        </>
      ),
      cta: { href: '/auth/register', label: 'Daftar ulang →' },
      ctaStyle: { background: '#f59e0b' },
    },
    error: {
      icon: (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="23" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M24 16v12M24 32v1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Terjadi kesalahan',
      desc: <>Gagal mengaktifkan akun. Silakan coba lagi atau hubungi administrator.</>,
      cta: { href: '/auth/register', label: 'Coba lagi →' },
      ctaStyle: { background: '#6b7280' },
    },
  }

  const c = config[status]

  return (
    <div className="root">
      <style>{`
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
          background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .grid {
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .panel {
          position: relative; z-index: 1;
          width: 100%; max-width: 440px;
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
          letter-spacing: -0.02em; margin-bottom: 0.75rem; line-height: 1.2;
        }

        .desc {
          font-size: 0.9375rem; color: rgba(255,255,255,0.4);
          line-height: 1.7; margin-bottom: 2rem;
        }

        .cta {
          display: inline-flex; align-items: center; justify-content: center;
          width: 100%; max-width: 280px;
          background: #3b82f6; color: white;
          text-decoration: none; border-radius: 10px;
          padding: 14px 24px;
          font-size: 0.9375rem; font-weight: 600;
          transition: filter 0.2s, transform 0.15s;
        }

        .cta:hover { filter: brightness(1.1); transform: translateY(-1px); }

        .secondary-link {
          display: block; margin-top: 1.25rem;
          font-size: 0.875rem; color: rgba(255,255,255,0.3);
          text-decoration: none; transition: color 0.2s;
        }
        .secondary-link:hover { color: rgba(255,255,255,0.6); }
      `}</style>

      <div className="bg" />
      <div className="grid" />

      <div className="panel">
        <Link href="/home" className="logo-link">
          <div className="logo-icon">📚</div>
          <span className="logo-text">E-Library Perusahaan</span>
        </Link>

        <div className="icon-wrap">{c.icon}</div>
        <h1 className="title">{c.title}</h1>
        <p className="desc">{c.desc}</p>

        <Link href={c.cta.href} className="cta" style={c.ctaStyle as React.CSSProperties}>
          {c.cta.label}
        </Link>

        {status !== 'success' && (
          <Link href="/auth/login" className="secondary-link">
            Kembali ke login
          </Link>
        )}
      </div>
    </div>
  )
}