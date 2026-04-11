import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ResetPasswordForm from './ResetPasswordForm'

interface PageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  if (!token) redirect('/auth/login')

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('reset_token', token)
    .gt('reset_token_expires', new Date().toISOString())
    .single()

  if (!user) {
    return (
      <div className="root">
        <style>{PAGE_STYLES}</style>
        <div className="bg" /><div className="grid" />

        <div className="panel">
          <Link href="/home" className="logo-link">
            <div className="logo-icon">📚</div>
            <span className="logo-text">E-Library Perusahaan</span>
          </Link>

          <div className="icon-wrap">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="23" stroke="#f59e0b" strokeWidth="1.5" />
              <path d="M24 14v12M24 30v2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>

          <h1 className="title">Link kadaluarsa</h1>
          <p className="desc">
            Link reset password ini sudah tidak valid atau sudah kadaluarsa.
            Minta Administrator untuk mengirim ulang.
          </p>

          <Link href="/auth/login" className="cta">
            Kembali ke login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="root">
      <style>{PAGE_STYLES}</style>
      <div className="bg" /><div className="grid" />

      <div className="panel">
        <Link href="/home" className="logo-link">
          <div className="logo-icon">📚</div>
          <span className="logo-text">E-Library Perusahaan</span>
        </Link>

        <div className="form-header">
          <h1 className="title">Buat password baru</h1>
          <p className="desc">
            Untuk akun{' '}
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {user.email}
            </span>
          </p>
        </div>

        <ResetPasswordForm token={token} userId={user.id} />
      </div>
    </div>
  )
}

const PAGE_STYLES = `
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
    background: radial-gradient(ellipse 60% 50% at 30% 60%, rgba(139,92,246,0.1) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 70% 30%, rgba(59,130,246,0.08) 0%, transparent 55%);
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
    letter-spacing: -0.02em; margin-bottom: 0.5rem;
  }

  .form-header { margin-bottom: 2rem; }

  .desc {
    font-size: 0.9375rem; color: rgba(255,255,255,0.4);
    line-height: 1.65; margin-bottom: 2rem;
  }

  .cta {
    display: flex; align-items: center; justify-content: center;
    width: 100%; background: #3b82f6; color: white;
    text-decoration: none; border-radius: 10px;
    padding: 14px; font-size: 0.9375rem; font-weight: 600;
    transition: background 0.2s, transform 0.1s;
  }
  .cta:hover { background: #2563eb; transform: translateY(-1px); }
`