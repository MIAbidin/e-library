import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const [
    { count: totalBooks },
    { count: totalUsers },
    { count: totalCategories },
    { data: featuredBooks },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase
      .from('books')
      .select('id, title, author, cover_url, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const dashboardHref = session
    ? session.user.role === 'admin' ? '/admin' : '/dashboard'
    : null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0f1c2e;
          --navy-mid: #1a2d45;
          --blue: #2563eb;
          --blue-light: #3b82f6;
          --cream: #faf7f2;
          --warm: #f5f0e8;
          --gold: #d4a843;
          --text: #1e293b;
          --muted: #64748b;
        }

        body {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          color: var(--text);
          overflow-x: hidden;
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: sticky; top: 0; z-index: 50;
          background: rgba(250, 247, 242, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 0 2rem;
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
          max-width: 100%;
        }

        .navbar-inner {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; max-width: 1200px; margin: 0 auto;
        }

        .logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none;
        }
        .logo-icon {
          width: 36px; height: 36px;
          background: var(--navy);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .logo-text {
          font-family: 'Playfair Display', serif;
          font-size: 1rem; font-weight: 700;
          color: var(--navy);
        }

        .nav-links {
          display: flex; align-items: center; gap: 8px;
        }
        .nav-link {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 500;
          color: var(--muted);
          padding: 8px 16px; border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .nav-link:hover { color: var(--navy); background: rgba(0,0,0,0.04); }
        .nav-btn {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 600;
          color: white;
          background: var(--navy);
          padding: 9px 20px; border-radius: 8px;
          transition: background 0.2s, transform 0.1s;
        }
        .nav-btn:hover { background: var(--navy-mid); transform: translateY(-1px); }
        .nav-btn-outline {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 600;
          color: var(--navy);
          background: transparent;
          border: 1.5px solid var(--navy);
          padding: 8px 20px; border-radius: 8px;
          transition: background 0.2s, transform 0.1s;
        }
        .nav-btn-outline:hover { background: rgba(15,28,46,0.06); transform: translateY(-1px); }

        /* ===== HERO ===== */
        .hero {
          min-height: 88vh;
          background: var(--navy);
          position: relative;
          overflow: hidden;
          display: flex; align-items: center;
        }

        .hero-bg-pattern {
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(212, 168, 67, 0.08) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 40%);
          pointer-events: none;
        }

        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .hero-inner {
          position: relative; z-index: 1;
          max-width: 1200px; margin: 0 auto;
          padding: 6rem 2rem;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 4rem; align-items: center;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(212, 168, 67, 0.15);
          border: 1px solid rgba(212, 168, 67, 0.3);
          color: var(--gold);
          font-size: 0.75rem; font-weight: 600;
          padding: 6px 14px; border-radius: 100px;
          margin-bottom: 1.5rem;
          letter-spacing: 0.05em; text-transform: uppercase;
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.5rem, 5vw, 3.5rem);
          font-weight: 800;
          color: white;
          line-height: 1.15;
          margin-bottom: 1.25rem;
          letter-spacing: -0.02em;
        }

        .hero-title-accent {
          color: var(--gold);
          display: block;
        }

        .hero-desc {
          font-size: 1.0625rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.7;
          margin-bottom: 2rem;
          max-width: 480px;
        }

        .hero-actions {
          display: flex; gap: 12px; flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--blue);
          color: white;
          text-decoration: none;
          font-size: 0.9375rem; font-weight: 600;
          padding: 14px 28px; border-radius: 10px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }
        .btn-primary:hover {
          background: var(--blue-light);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
        }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-size: 0.9375rem; font-weight: 500;
          padding: 14px 24px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          transition: background 0.2s, color 0.2s;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          color: white;
        }

        .hero-stats {
          display: flex; gap: 2rem; margin-top: 3rem;
        }

        .hero-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2rem; font-weight: 700;
          color: white; line-height: 1;
        }
        .hero-stat-label {
          font-size: 0.8125rem;
          color: rgba(255,255,255,0.5);
          margin-top: 4px;
        }
        .hero-stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.1);
        }

        .hero-visual {
          display: flex; justify-content: center; align-items: center;
          position: relative;
        }

        .book-stack {
          position: relative;
          width: 280px; height: 360px;
        }

        .book-card {
          position: absolute;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        .book-card-1 { width: 160px; height: 220px; top: 20px; left: 20px; transform: rotate(-6deg); z-index: 1; }
        .book-card-2 { width: 160px; height: 220px; top: 40px; left: 80px; transform: rotate(2deg); z-index: 2; }
        .book-card-3 { width: 160px; height: 220px; top: 60px; left: 140px; transform: rotate(8deg); z-index: 3; }

        .book-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 3rem;
        }

        .floating-badge {
          position: absolute;
          background: white;
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.2);
          font-size: 0.8125rem;
          font-weight: 600;
          display: flex; align-items: center; gap: 8px;
          color: var(--text);
        }

        .floating-badge-1 { bottom: 30px; left: 0; animation: float1 4s ease-in-out infinite; }
        .floating-badge-2 { top: 10px; right: 0; animation: float2 5s ease-in-out infinite; }

        @keyframes float1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes float2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }

        /* ===== SECTION ===== */
        .section {
          padding: 5rem 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-label {
          font-size: 0.75rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--blue);
          margin-bottom: 0.75rem;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: var(--navy);
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        /* ===== FEATURES ===== */
        .features-section {
          background: var(--warm);
          border-top: 1px solid rgba(0,0,0,0.06);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          padding: 5rem 2rem;
        }

        .features-inner { max-width: 1200px; margin: 0 auto; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(0,0,0,0.06);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .feature-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.08); transform: translateY(-3px); }

        .feature-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: #eff6ff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .feature-title { font-size: 1rem; font-weight: 700; color: var(--navy); margin-bottom: 0.5rem; }
        .feature-desc { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }

        /* ===== BOOKS PREVIEW ===== */
        .books-preview-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .preview-book-card {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.06);
          transition: box-shadow 0.2s, transform 0.2s;
          text-decoration: none;
        }
        .preview-book-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-3px); }

        .preview-book-cover {
          aspect-ratio: 3/4;
          background: linear-gradient(135deg, #eff6ff, #e0e7ff);
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem;
          position: relative; overflow: hidden;
        }

        .preview-book-info { padding: 0.625rem; }
        .preview-book-title {
          font-size: 0.75rem; font-weight: 600;
          color: var(--text);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; line-height: 1.3;
        }
        .preview-book-author { font-size: 0.6875rem; color: var(--muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .see-all-link {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--blue);
          font-size: 0.9375rem; font-weight: 600;
          text-decoration: none;
          margin-top: 2rem;
          transition: gap 0.2s;
        }
        .see-all-link:hover { gap: 10px; }

        /* ===== CTA ===== */
        .cta-section {
          background: var(--navy);
          padding: 5rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 30% 50%, rgba(37, 99, 235, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 70% 50%, rgba(212, 168, 67, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; }

        .cta-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 800;
          color: white;
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        .cta-desc { font-size: 1.0625rem; color: rgba(255,255,255,0.65); line-height: 1.6; margin-bottom: 2.5rem; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        /* ===== FOOTER ===== */
        .footer { background: #080f1a; color: rgba(255,255,255,0.5); text-align: center; padding: 2rem; font-size: 0.8125rem; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 900px) {
          .hero-inner { grid-template-columns: 1fr; text-align: center; padding: 4rem 1.5rem; }
          .hero-visual { display: none; }
          .hero-desc { max-width: 100%; }
          .hero-actions { justify-content: center; }
          .hero-stats { justify-content: center; }
          .features-grid { grid-template-columns: 1fr; }
          .books-preview-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 600px) {
          .navbar { padding: 0 1rem; }
          .logo-text { display: none; }
          .books-preview-grid { grid-template-columns: repeat(2, 1fr); }
          .section { padding: 3rem 1rem; }
          .hero-stats { gap: 1rem; }
          .hero-stat-num { font-size: 1.5rem; }
        }
      `}</style>

      {/* ===== NAVBAR ===== */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/home" className="logo">
            <div className="logo-icon">📚</div>
            <span className="logo-text">E-Library Perusahaan</span>
          </a>
          <div className="nav-links">
            <a href="/books" className="nav-link">Katalog Buku</a>
            {session ? (
              <>
                <a href={dashboardHref!} className="nav-link">Dashboard</a>
                <a href={dashboardHref!} className="nav-btn">Masuk ke App →</a>
              </>
            ) : (
              <>
                <a href="/auth/login" className="nav-link">Masuk</a>
                <a href="/auth/register" className="nav-btn">Daftar Gratis</a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg-pattern" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div>
            <div className="hero-badge">✦ Platform Perpustakaan Digital Internal</div>
            <h1 className="hero-title">
              Pengetahuan Terbaik<br />
              <span className="hero-title-accent">Ada di Genggaman</span>
            </h1>
            <p className="hero-desc">
              Akses ribuan koleksi e-book perusahaan kapan saja, di mana saja.
              Tingkatkan kompetensi dan wawasan bersama rekan-rekan Anda.
            </p>
            <div className="hero-actions">
              {session ? (
                <>
                  <a href={dashboardHref!} className="btn-primary">
                    🏠 Buka Dashboard
                  </a>
                  <a href="/books" className="btn-ghost">
                    Jelajahi Katalog →
                  </a>
                </>
              ) : (
                <>
                  <a href="/books" className="btn-primary">📚 Jelajahi Koleksi</a>
                  <a href="/auth/register" className="btn-ghost">Daftar Sekarang →</a>
                </>
              )}
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-num">{totalBooks ?? 0}+</div>
                <div className="hero-stat-label">Koleksi E-Book</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-num">{totalUsers ?? 0}+</div>
                <div className="hero-stat-label">Pengguna Aktif</div>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <div className="hero-stat-num">{totalCategories ?? 0}+</div>
                <div className="hero-stat-label">Kategori</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="book-stack">
              <div className="book-card book-card-1">
                <div className="book-cover-placeholder" style={{ background: 'linear-gradient(135deg, #1e3a5f, #2563eb)' }}>📘</div>
              </div>
              <div className="book-card book-card-2">
                <div className="book-cover-placeholder" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>📗</div>
              </div>
              <div className="book-card book-card-3">
                <div className="book-cover-placeholder" style={{ background: 'linear-gradient(135deg, #2d1b69, #4c1d95)' }}>📙</div>
              </div>
              <div className="floating-badge floating-badge-1">✅ <span>Akses 24/7</span></div>
              <div className="floating-badge floating-badge-2">📊 <span>Track Progres</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURED BOOKS ===== */}
      {featuredBooks && featuredBooks.length > 0 && (
        <section className="section">
          <div className="section-label">Koleksi Terbaru</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h2 className="section-title">Buku Terbaru Ditambahkan</h2>
            <a href="/books" className="see-all-link">Lihat Semua →</a>
          </div>
          <div className="books-preview-grid">
            {featuredBooks.map((book) => (
              <a key={book.id} href={`/books/${book.id}`} className="preview-book-card">
                <div className="preview-book-cover">
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_url} alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                  ) : (
                    <span>📗</span>
                  )}
                </div>
                <div className="preview-book-info">
                  <div className="preview-book-title">{book.title}</div>
                  <div className="preview-book-author">{book.author}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ===== FEATURES ===== */}
      <section className="features-section">
        <div className="features-inner">
          <div className="section-label">Kenapa E-Library?</div>
          <h2 className="section-title">Semua yang Anda Butuhkan<br />dalam Satu Platform</h2>
          <div className="features-grid">
            {[
              { icon: '📖', title: 'Baca di Mana Saja', desc: 'PDF viewer bawaan yang nyaman di desktop maupun mobile. Bookmark otomatis di halaman terakhir.', bg: '#eff6ff' },
              { icon: '📊', title: 'Statistik Bacaan', desc: 'Pantau progres membaca Anda — halaman dibaca, buku selesai, streak harian, dan aktivitas mingguan.', bg: '#f0fdf4' },
              { icon: '🔔', title: 'Notifikasi Real-time', desc: 'Dapatkan notifikasi setiap ada buku baru atau pengumuman penting dari administrator.', bg: '#fef3c7' },
              { icon: '🏷️', title: 'Kategori Terorganisir', desc: 'Buku tersusun rapi dalam kategori yang relevan. Filter dan cari dengan mudah.', bg: '#fdf2f8' },
              { icon: '🔒', title: 'Akses Aman', desc: 'Sistem autentikasi berlapis memastikan hanya karyawan yang berhak dapat mengakses konten.', bg: '#f0f9ff' },
              { icon: '📥', title: 'Laporan & Export', desc: 'Admin dapat melihat statistik lengkap aktivitas membaca seluruh karyawan dan export CSV.', bg: '#f8fafc' },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">
            {session ? 'Selamat Datang Kembali!' : 'Siap Mulai Membaca?'}
          </h2>
          <p className="cta-desc">
            {session
              ? `Halo, ${session.user.name?.split(' ')[0]}! Lanjutkan aktivitas membaca Anda hari ini.`
              : 'Daftarkan akun Anda sekarang dan mulai jelajahi koleksi e-book perusahaan. Gratis untuk seluruh karyawan.'}
          </p>
          <div className="cta-actions">
            {session ? (
              <>
                <a href={dashboardHref!} className="btn-primary" style={{ fontSize: '1rem', padding: '15px 32px' }}>
                  Buka Dashboard →
                </a>
                <a href="/books" className="btn-ghost" style={{ fontSize: '1rem', padding: '15px 24px' }}>
                  Jelajahi Katalog
                </a>
              </>
            ) : (
              <>
                <a href="/auth/register" className="btn-primary" style={{ fontSize: '1rem', padding: '15px 32px' }}>
                  Daftar Sekarang — Gratis
                </a>
                <a href="/books" className="btn-ghost" style={{ fontSize: '1rem', padding: '15px 24px' }}>
                  Lihat Koleksi Dulu
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        © {new Date().getFullYear()} E-Library Perusahaan. Platform perpustakaan digital internal. Confidential.
      </footer>
    </>
  )
}