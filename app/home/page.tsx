// app/home/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { HomeThemeToggle } from './HomeThemeToggle'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const supabase = createAdminClient()

  const [
    { count: totalBooks },
    { count: totalUsers },
    { count: totalCategories },
    { data: featuredBooks },
    { data: categories },
  ] = await Promise.all([
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase
      .from('books')
      .select('id, title, author, cover_url, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('categories')
      .select('id, name')
      .limit(6),
  ])

  const dashboardHref = session
    ? session.user.role === 'admin' ? '/admin' : '/dashboard'
    : null

  // Font Awesome category icons (fa classes)
  const categoryFaIcons = [
    'fa-briefcase',
    'fa-chart-line',
    'fa-lightbulb',
    'fa-bullseye',
    'fa-rocket',
    'fa-leaf',
  ]

  const categoryColors = [
    { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
    { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
    { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
    { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf' },
  ]

  return (
    <>
      {/* Font Awesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }
        
        .hp-root {
          --hp-bg:          #f8f6f2;
          --hp-surface:     #ffffff;
          --hp-surface2:    #f0ede8;
          --hp-border:      rgba(0,0,0,0.08);
          --hp-text:        #1a1410;
          --hp-text-2:      #5c5650;
          --hp-text-3:      #9c988f;
          --hp-accent:      #1e4bd8;
          --hp-accent-hover:#1539b0;
          --hp-accent-glow: rgba(30,75,216,0.2);
          --hp-hero-bg:     #13111a;
          --hp-hero-text:   #f4f0ff;
          --hp-hero-text-2: rgba(244,240,255,0.55);
          --hp-nav-bg:      rgba(248,246,242,0.94);
          --hp-strip-bg:    #13111a;
        }

        [data-theme="dark"] .hp-root {
          --hp-bg:          #0a0d14;
          --hp-surface:     #111520;
          --hp-surface2:    #161b28;
          --hp-border:      rgba(255,255,255,0.08);
          --hp-text:        #e8e4f0;
          --hp-text-2:      rgba(232,228,240,0.6);
          --hp-text-3:      rgba(232,228,240,0.35);
          --hp-accent:      #5b8def;
          --hp-accent-hover:#7aa5f5;
          --hp-accent-glow: rgba(91,141,239,0.25);
          --hp-hero-bg:     #07090f;
          --hp-hero-text:   #ece8ff;
          --hp-hero-text-2: rgba(236,232,255,0.5);
          --hp-nav-bg:      rgba(10,13,20,0.94);
          --hp-strip-bg:    #07090f;
        }

        .hp-root {
          background: var(--hp-bg);
          color: var(--hp-text);
          overflow-x: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.3s ease, color 0.3s ease;
          min-height: 100vh;
        }

        /* ── NAVBAR ── */
        .hp-nav {
          position: sticky; top: 0; z-index: 100;
          background: var(--hp-nav-bg);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border-bottom: 1px solid var(--hp-border);
          height: 60px;
        }

        .hp-nav-inner {
          max-width: 1280px; margin: 0 auto;
          height: 100%;
          padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
        }

        .hp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }

        .hp-logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #1e4bd8 0%, #7c3aed 100%);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 10px rgba(30,75,216,0.3);
          flex-shrink: 0;
          color: white; font-size: 15px;
        }

        .hp-logo-text {
          font-family: 'Fraunces', serif;
          font-size: 1.0625rem; font-weight: 600;
          color: var(--hp-text); letter-spacing: -0.01em;
        }

        .hp-nav-links {
          display: flex; align-items: center; gap: 2px; flex: 1;
        }

        .hp-nav-link {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 500;
          color: var(--hp-text-2);
          padding: 7px 13px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .hp-nav-link:hover { color: var(--hp-text); background: var(--hp-border); }
        .hp-nav-link.active {
          color: var(--hp-accent);
          background: rgba(30,75,216,0.08);
          font-weight: 600;
        }

        .hp-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .hp-btn-ghost {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 600;
          color: var(--hp-text-2);
          padding: 8px 16px; border-radius: 9px;
          border: 1px solid var(--hp-border);
          transition: all 0.15s; white-space: nowrap;
          display: flex; align-items: center; gap: 6px;
          background: transparent;
          cursor: pointer;
        }
        .hp-btn-ghost:hover { color: var(--hp-text); border-color: var(--hp-text-3); background: var(--hp-border); }

        .hp-btn-primary {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 700;
          color: #fff; background: var(--hp-accent);
          padding: 9px 18px; border-radius: 9px;
          transition: all 0.15s; white-space: nowrap;
          box-shadow: 0 2px 10px var(--hp-accent-glow);
          letter-spacing: -0.01em;
          display: flex; align-items: center; gap: 6px;
          border: none; cursor: pointer;
        }
        .hp-btn-primary:hover { background: var(--hp-accent-hover); transform: translateY(-1px); }

        /* ── HERO ── */
        .hp-hero {
          background: var(--hp-hero-bg);
          min-height: 88vh;
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: center;
        }

        .hp-hero-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 20% 50%, rgba(30,75,216,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(124,58,237,0.12) 0%, transparent 50%);
        }

        .hp-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .hp-hero-inner {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          padding: 5rem 20px 4rem;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 4rem; align-items: center;
        }

        .hp-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(30,75,216,0.15);
          border: 1px solid rgba(30,75,216,0.3);
          color: #93b4f8;
          font-size: 0.6875rem; font-weight: 700;
          padding: 5px 12px 5px 10px; border-radius: 100px;
          margin-bottom: 1.5rem;
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .hp-hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #5b8def;
          animation: pulse-live 2s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .hp-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 700; color: var(--hp-hero-text);
          line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 1.25rem;
        }

        .hp-hero-title-italic {
          font-style: italic; color: transparent; display: block;
          background: linear-gradient(90deg, #93b4f8, #c084fc);
          -webkit-background-clip: text; background-clip: text;
        }

        .hp-hero-desc {
          font-size: 1.0625rem; color: var(--hp-hero-text-2);
          line-height: 1.75; margin-bottom: 2.25rem; max-width: 440px;
        }

        .hp-hero-actions {
          display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
          margin-bottom: 3rem;
        }

        .hp-cta-big {
          display: inline-flex; align-items: center; gap: 8px;
          background: #1e4bd8; color: white; text-decoration: none;
          font-size: 0.9375rem; font-weight: 700;
          padding: 13px 24px; border-radius: 11px; transition: all 0.2s;
          box-shadow: 0 4px 18px rgba(30,75,216,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .hp-cta-big:hover { background: #1539b0; transform: translateY(-2px); }

        .hp-cta-outline {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(244,240,255,0.7); text-decoration: none;
          font-size: 0.9375rem; font-weight: 500;
          padding: 12px 20px; border-radius: 11px;
          border: 1px solid rgba(255,255,255,0.12); transition: all 0.15s;
        }
        .hp-cta-outline:hover {
          color: rgba(244,240,255,0.95);
          border-color: rgba(255,255,255,0.25); background: rgba(255,255,255,0.05);
        }

        .hp-hero-stats {
          display: flex; gap: 0;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 1.75rem;
        }

        .hp-stat { flex: 1; padding-right: 1.75rem; }
        .hp-stat + .hp-stat {
          padding-left: 1.75rem; padding-right: 1.75rem;
          border-left: 1px solid rgba(255,255,255,0.08);
        }
        .hp-stat:last-child { padding-right: 0; }
        .hp-stat-icon {
          font-size: 1rem; margin-bottom: 6px; display: block;
          color: #93b4f8;
        }
        .hp-stat-num {
          font-family: 'Fraunces', serif;
          font-size: 2rem; font-weight: 700;
          color: var(--hp-hero-text); line-height: 1; letter-spacing: -0.03em;
        }
        .hp-stat-label { font-size: 0.8125rem; color: var(--hp-hero-text-2); margin-top: 4px; }

        /* ── HERO VISUAL ── */
        .hp-hero-visual { position: relative; }
        .hp-book-showcase { position: relative; height: 460px; }

        .hp-book-float {
          position: absolute; border-radius: 12px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3);
          transition: transform 0.3s ease;
        }
        .hp-book-float:hover { transform: translateY(-8px) rotate(0deg) !important; z-index: 10 !important; }
        .hp-book-1 { width: 130px; height: 185px; top: 20px; left: 10px; transform: rotate(-7deg); z-index: 1; }
        .hp-book-2 { width: 145px; height: 200px; top: 55px; left: 95px; transform: rotate(-2deg); z-index: 3; }
        .hp-book-3 { width: 130px; height: 182px; top: 25px; left: 190px; transform: rotate(5deg); z-index: 2; }
        .hp-book-4 { width: 138px; height: 192px; top: 175px; left: 45px; transform: rotate(3deg); z-index: 4; }
        .hp-book-5 { width: 125px; height: 178px; top: 200px; left: 188px; transform: rotate(-5deg); z-index: 2; }

        .hp-book-cover {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.5rem;
          color: rgba(255,255,255,0.85);
        }

        .hp-float-badge {
          position: absolute;
          background: var(--hp-surface);
          border: 1px solid var(--hp-border);
          border-radius: 12px; padding: 10px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: flex; align-items: center; gap: 10px;
          font-size: 0.8125rem; font-weight: 600;
          color: var(--hp-text); white-space: nowrap;
        }
        .hp-badge-1 { bottom: 20px; left: -20px; animation: floatA 5s ease-in-out infinite; }
        .hp-badge-2 { top: 0; right: -30px; animation: floatB 6s ease-in-out infinite; }
        .hp-badge-3 { bottom: 100px; right: -40px; animation: floatC 4.5s ease-in-out infinite; }

        @keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

        .hp-badge-icon {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .hp-badge-label { color: var(--hp-text-3); font-size: 0.6875rem; font-weight: 400; }

        /* ── MARQUEE ── */
        .hp-marquee-strip {
          background: var(--hp-strip-bg);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 12px 0; overflow: hidden;
        }
        .hp-marquee-track {
          display: flex; gap: 44px; align-items: center;
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .hp-marquee-item {
          display: flex; align-items: center; gap: 8px;
          color: rgba(255,255,255,0.3); font-size: 0.8125rem;
          font-weight: 500; white-space: nowrap;
        }
        .hp-marquee-dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.2); }

        /* ── SECTIONS ── */
        .hp-section { padding: 5rem 20px; max-width: 1280px; margin: 0 auto; }

        .hp-section-label {
          font-size: 0.6875rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--hp-accent); margin-bottom: 0.75rem;
        }

        .hp-section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.875rem, 3vw, 2.5rem);
          font-weight: 700; font-style: italic;
          color: var(--hp-text); line-height: 1.15;
          letter-spacing: -0.025em; margin-bottom: 1rem;
        }

        .hp-section-desc {
          font-size: 1rem; color: var(--hp-text-2); line-height: 1.7; max-width: 500px;
        }

        /* ── FEATURES ── */
        .hp-features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1.5px; background: var(--hp-border);
          border: 1px solid var(--hp-border);
          border-radius: 18px; overflow: hidden;
          margin-top: 3rem;
        }
        .hp-feature {
          background: var(--hp-surface); padding: 2.25rem 1.875rem;
          transition: background 0.2s; position: relative;
        }
        .hp-feature:hover { background: var(--hp-surface2); }
        .hp-feature-num {
          font-family: 'Fraunces', serif;
          font-size: 0.75rem; font-weight: 700; font-style: italic;
          color: var(--hp-text-3); letter-spacing: 0.05em; margin-bottom: 1.125rem;
        }
        .hp-feature-icon {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1.125rem;
          background: var(--hp-surface2); border: 1px solid var(--hp-border);
          transition: transform 0.2s;
          color: var(--hp-accent); font-size: 1.1rem;
        }
        .hp-feature:hover .hp-feature-icon { transform: scale(1.1) rotate(-3deg); }
        .hp-feature-title { font-size: 0.9375rem; font-weight: 700; color: var(--hp-text); margin-bottom: 0.5rem; }
        .hp-feature-desc { font-size: 0.875rem; color: var(--hp-text-2); line-height: 1.65; }

        /* ── BOOKS GRID ── */
        .hp-books-wrap {
          background: var(--hp-surface2);
          border-top: 1px solid var(--hp-border);
          border-bottom: 1px solid var(--hp-border);
          padding: 4.5rem 0;
        }
        .hp-books-inner { max-width: 1280px; margin: 0 auto; padding: 0 20px; }
        .hp-books-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
        }
        .hp-see-all {
          text-decoration: none; color: var(--hp-accent);
          font-size: 0.875rem; font-weight: 600;
          display: flex; align-items: center; gap: 6px;
        }
        .hp-books-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.125rem;
        }
        .hp-book-card {
          background: var(--hp-surface); border-radius: 14px; overflow: hidden;
          border: 1px solid var(--hp-border);
          transition: all 0.25s cubic-bezier(0.25,0.46,0.45,0.94);
          text-decoration: none; display: block;
        }
        .hp-book-card:hover { transform: translateY(-5px); box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
        .hp-book-card-cover { aspect-ratio: 3/4; position: relative; overflow: hidden; }
        .hp-book-card-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.7); font-size: 2rem;
        }
        .hp-book-card-body { padding: 12px 12px 14px; }
        .hp-book-card-cat {
          font-size: 0.625rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--hp-accent); margin-bottom: 5px;
        }
        .hp-book-card-title {
          font-size: 0.8125rem; font-weight: 700; color: var(--hp-text);
          line-height: 1.35; margin-bottom: 3px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .hp-book-card-author { font-size: 0.6875rem; color: var(--hp-text-3); }

        /* ── CATEGORIES ── */
        .hp-categories-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1rem; margin-top: 2.25rem;
        }
        .hp-cat-card {
          padding: 1.5rem; border-radius: 14px;
          border: 1px solid var(--hp-border);
          background: var(--hp-surface);
          text-decoration: none; display: flex; align-items: center; gap: 14px;
          transition: all 0.2s; cursor: pointer;
        }
        .hp-cat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border-color: var(--hp-accent);
        }
        .hp-cat-icon {
          width: 46px; height: 46px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.125rem; flex-shrink: 0;
          transition: transform 0.2s;
        }
        .hp-cat-card:hover .hp-cat-icon { transform: scale(1.1); }
        .hp-cat-name { font-size: 0.9375rem; font-weight: 700; color: var(--hp-text); }
        .hp-cat-sub {
          font-size: 0.75rem; color: var(--hp-text-3); margin-top: 2px;
          display: flex; align-items: center; gap: 4px;
        }

        /* ── HOW IT WORKS ── */
        .hp-steps-wrap { background: var(--hp-hero-bg); padding: 5rem 20px; }
        .hp-steps-inner { max-width: 1280px; margin: 0 auto; }
        .hp-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 2rem; margin-top: 3rem;
        }
        .hp-step { text-align: center; }
        .hp-step-num {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.125rem; font-size: 1.125rem;
          color: #93b4f8;
        }
        .hp-step-title { font-size: 0.9375rem; font-weight: 700; color: #e8e4f0; margin-bottom: 0.5rem; }
        .hp-step-desc { font-size: 0.8125rem; color: rgba(232,228,240,0.4); line-height: 1.65; }

        /* ── CTA ── */
        .hp-cta-wrap {
          background: var(--hp-hero-bg); padding: 6rem 20px;
          position: relative; overflow: hidden;
        }
        .hp-cta-glow {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 80% at 50% 100%, rgba(30,75,216,0.2) 0%, transparent 60%);
        }
        .hp-cta-inner { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; text-align: center; }
        .hp-cta-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2rem, 4vw, 3.25rem);
          font-weight: 700; font-style: italic; color: #ece8ff;
          line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 1rem;
        }
        .hp-cta-desc { font-size: 1rem; color: rgba(236,232,255,0.5); line-height: 1.7; margin-bottom: 2.25rem; }
        .hp-cta-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

        /* ── FOOTER ── */
        .hp-footer {
          background: #07090f;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 1.75rem 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }
        .hp-footer-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .hp-footer-mark {
          width: 28px; height: 28px; border-radius: 7px;
          background: linear-gradient(135deg, #1e4bd8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: white;
        }
        .hp-footer-text { font-family: 'Fraunces', serif; font-size: 0.9375rem; font-weight: 600; font-style: italic; color: rgba(255,255,255,0.4); }
        .hp-footer-copy { font-size: 0.75rem; color: rgba(255,255,255,0.2); }
        .hp-footer-links { display: flex; gap: 18px; align-items: center; }
        .hp-footer-link { font-size: 0.8125rem; color: rgba(255,255,255,0.3); text-decoration: none; transition: color 0.2s; }
        .hp-footer-link:hover { color: rgba(255,255,255,0.65); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hp-hero-inner { grid-template-columns: 1fr; gap: 2.5rem; text-align: center; }
          .hp-hero-actions { justify-content: center; }
          .hp-hero-stats { justify-content: center; }
          .hp-hero-visual { display: none; }
          .hp-hero-desc { max-width: 100%; margin-left: auto; margin-right: auto; }
          .hp-features-grid { grid-template-columns: 1fr 1fr; }
          .hp-books-grid { grid-template-columns: repeat(2, 1fr); }
          .hp-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .hp-categories-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 640px) {
          .hp-nav-links { display: none; }
          .hp-features-grid { grid-template-columns: 1fr; }
          .hp-books-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .hp-steps-grid { grid-template-columns: 1fr 1fr; }
          .hp-categories-grid { grid-template-columns: 1fr; }
          .hp-hero-stats {
            flex-direction: column; gap: 1.25rem;
            border-top: none; padding-top: 1rem;
          }
          .hp-stat { padding: 0 !important; border: none !important; }
          .hp-hero-inner { padding: 3.5rem 20px 2.5rem; }
          .hp-section { padding: 3.5rem 20px; }
          .hp-footer {
            flex-direction: column; align-items: center;
            text-align: center; gap: 0.75rem;
          }
          .hp-footer-links { justify-content: center; }
          .hp-btn-ghost { display: none; }
        }
      `}</style>

      <div className="hp-root">

        {/* ── NAVBAR ── */}
        <nav className="hp-nav">
          <div className="hp-nav-inner">
            <a href="/home" className="hp-logo">
              <div className="hp-logo-mark">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <span className="hp-logo-text">E-Library</span>
            </a>

            <div className="hp-nav-links">
              <a href="/home" className="hp-nav-link active">Beranda</a>
              <a href="/books" className="hp-nav-link">Katalog Buku</a>
              <a href="#fitur" className="hp-nav-link">Fitur</a>
              <a href="#cara-kerja" className="hp-nav-link">Cara Kerja</a>
            </div>

            <div className="hp-nav-actions">
              <HomeThemeToggle />
              {session ? (
                <>
                  <a href={dashboardHref!} className="hp-btn-ghost">Dashboard</a>
                  <a href={dashboardHref!} className="hp-btn-primary">
                    Buka Aplikasi <i className="fa-solid fa-arrow-right"></i>
                  </a>
                </>
              ) : (
                <>
                  <a href="/auth/login" className="hp-btn-ghost">Masuk</a>
                  <a href="/auth/register" className="hp-btn-primary">Daftar Gratis</a>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hp-hero">
          <div className="hp-hero-glow" />
          <div className="hp-hero-grid" />
          <div className="hp-hero-inner">
            <div>
              <div className="hp-hero-eyebrow">
                <div className="hp-hero-eyebrow-dot" />
                Platform Digital Internal Perusahaan
              </div>
              <h1 className="hp-hero-title">
                Satu tempat untuk<br />
                <span className="hp-hero-title-italic">semua ilmu yang kamu butuhkan</span>
              </h1>
              <p className="hp-hero-desc">
                Perpustakaan digital perusahaan dengan koleksi e-book terseleksi.
                Baca kapan saja, lacak progres, dan terus berkembang bersama.
              </p>
              <div className="hp-hero-actions">
                {session ? (
                  <>
                    <a href={dashboardHref!} className="hp-cta-big">
                      <i className="fa-solid fa-house"></i> Buka Dashboard
                    </a>
                    <a href="/books" className="hp-cta-outline">
                      Jelajahi Koleksi <i className="fa-solid fa-arrow-right"></i>
                    </a>
                  </>
                ) : (
                  <>
                    <a href="/auth/register" className="hp-cta-big">
                      <i className="fa-solid fa-sparkles"></i> Mulai Gratis
                    </a>
                    <a href="/books" className="hp-cta-outline">
                      Lihat Koleksi <i className="fa-solid fa-arrow-right"></i>
                    </a>
                  </>
                )}
              </div>
              <div className="hp-hero-stats">
                <div className="hp-stat">
                  <i className="fa-solid fa-books hp-stat-icon"></i>
                  <div className="hp-stat-num">{totalBooks ?? 0}+</div>
                  <div className="hp-stat-label">Koleksi E-Book</div>
                </div>
                <div className="hp-stat">
                  <i className="fa-solid fa-users hp-stat-icon"></i>
                  <div className="hp-stat-num">{totalUsers ?? 0}</div>
                  <div className="hp-stat-label">Pembaca Aktif</div>
                </div>
                <div className="hp-stat">
                  <i className="fa-solid fa-tags hp-stat-icon"></i>
                  <div className="hp-stat-num">{totalCategories ?? 0}</div>
                  <div className="hp-stat-label">Kategori Topik</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hp-hero-visual">
              <div className="hp-book-showcase">
                {[
                  { cls: 'hp-book-1', bg: 'linear-gradient(135deg, #1e3a6e, #2563eb)', icon: 'fa-book' },
                  { cls: 'hp-book-2', bg: 'linear-gradient(135deg, #134e3a, #16a34a)', icon: 'fa-book-open' },
                  { cls: 'hp-book-3', bg: 'linear-gradient(135deg, #4c1d95, #7c3aed)', icon: 'fa-bookmark' },
                  { cls: 'hp-book-4', bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)', icon: 'fa-graduation-cap' },
                  { cls: 'hp-book-5', bg: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)', icon: 'fa-file-lines' },
                ].map((b, i) => (
                  <div key={i} className={`hp-book-float ${b.cls}`}>
                    <div className="hp-book-cover" style={{ background: b.bg }}>
                      <i className={`fa-solid ${b.icon}`} style={{ fontSize: '2.5rem' }}></i>
                    </div>
                  </div>
                ))}
                <div className="hp-float-badge hp-badge-1">
                  <div className="hp-badge-icon" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <div>Buku Selesai</div>
                    <div className="hp-badge-label">+3 minggu ini</div>
                  </div>
                </div>
                <div className="hp-float-badge hp-badge-2">
                  <div className="hp-badge-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#f59e0b' }}>
                    <i className="fa-solid fa-fire"></i>
                  </div>
                  <div>
                    <div>7 Hari Streak</div>
                    <div className="hp-badge-label">Pertahankan!</div>
                  </div>
                </div>
                <div className="hp-float-badge hp-badge-3">
                  <div className="hp-badge-icon" style={{ background: 'rgba(91,141,239,0.15)', color: '#5b8def' }}>
                    <i className="fa-solid fa-chart-bar"></i>
                  </div>
                  <div>
                    <div>142 Halaman</div>
                    <div className="hp-badge-label">dibaca hari ini</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="hp-marquee-strip">
          <div className="hp-marquee-track">
            {Array(2).fill([
              { icon: 'fa-books', text: 'Koleksi Lengkap' },
              { icon: 'fa-chart-line', text: 'Lacak Progres' },
              { icon: 'fa-bell', text: 'Notifikasi Real-time' },
              { icon: 'fa-lock', text: 'Akses Terkontrol' },
              { icon: 'fa-mobile-screen', text: 'Responsif Mobile' },
              { icon: 'fa-fire', text: 'Streak Harian' },
              { icon: 'fa-bolt', text: 'PDF Viewer Cepat' },
              { icon: 'fa-file-export', text: 'Export CSV' },
              { icon: 'fa-users', text: 'Manajemen Tim' },
              { icon: 'fa-globe', text: 'Akses 24/7' },
            ]).flat().map((item, i) => (
              <span key={i} className="hp-marquee-item">
                {i > 0 && <span className="hp-marquee-dot" />}
                <i className={`fa-solid ${item.icon}`} style={{ fontSize: '0.75rem' }}></i>
                {item.text}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="fitur" className="hp-section">
          <div className="hp-section-label">✦ Kenapa E-Library?</div>
          <h2 className="hp-section-title">
            Semuanya ada di satu tempat,<br />
            siap kapan pun dibutuhkan
          </h2>
          <p className="hp-section-desc">
            Dirancang khusus untuk mendukung pertumbuhan profesional karyawan.
          </p>
          <div className="hp-features-grid">
            {[
              { num: '01', icon: 'fa-file-pdf', title: 'Baca Langsung di Browser', desc: 'PDF viewer built-in yang mulus dan responsif. Tidak perlu download, langsung baca.' },
              { num: '02', icon: 'fa-bookmark', title: 'Simpan Posisi Otomatis', desc: 'Tinggalkan di halaman berapa pun, sistem akan mengingat. Lanjutkan kapan saja.' },
              { num: '03', icon: 'fa-chart-bar', title: 'Dashboard Statistik Personal', desc: 'Lihat buku yang sudah dibaca, halaman, streak harian, dan grafik aktivitas mingguan.' },
              { num: '04', icon: 'fa-bell', title: 'Notifikasi Real-time', desc: 'Dapat notifikasi saat ada buku baru atau pengumuman penting dari admin.' },
              { num: '05', icon: 'fa-shield-halved', title: 'Kontrol Akses Granular', desc: 'Admin bisa mengatur buku mana yang publik dan restricted per departemen.' },
              { num: '06', icon: 'fa-file-export', title: 'Laporan & Analitik', desc: 'Dashboard aktivitas seluruh karyawan, buku terpopuler, dan export CSV kapan saja.' },
            ].map((f) => (
              <div key={f.num} className="hp-feature">
                <div className="hp-feature-num">— {f.num}</div>
                <div className="hp-feature-icon">
                  <i className={`fa-solid ${f.icon}`}></i>
                </div>
                <div className="hp-feature-title">{f.title}</div>
                <div className="hp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOOKS SHOWCASE ── */}
        {(featuredBooks ?? []).length > 0 && (
          <div className="hp-books-wrap">
            <div className="hp-books-inner">
              <div className="hp-books-header">
                <div>
                  <div className="hp-section-label">✦ Koleksi Terbaru</div>
                  <h2 className="hp-section-title" style={{ marginBottom: 0 }}>
                    Baru ditambahkan<br />
                    <em>ke perpustakaan</em>
                  </h2>
                </div>
                <a href="/books" className="hp-see-all">
                  Lihat semua koleksi <i className="fa-solid fa-arrow-right"></i>
                </a>
              </div>

              <div className="hp-books-grid">
                {(featuredBooks ?? []).slice(0, 8).map((book, idx) => {
                  const gradients = [
                    'linear-gradient(135deg,#1e3a6e,#2563eb)',
                    'linear-gradient(135deg,#134e3a,#16a34a)',
                    'linear-gradient(135deg,#4c1d95,#7c3aed)',
                    'linear-gradient(135deg,#7f1d1d,#dc2626)',
                    'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
                    'linear-gradient(135deg,#451a03,#d97706)',
                    'linear-gradient(135deg,#0c1a2e,#1d4ed8)',
                    'linear-gradient(135deg,#1a0533,#9333ea)',
                  ]
                  const faIcons = ['fa-book','fa-book-open','fa-bookmark','fa-graduation-cap','fa-file-lines','fa-scroll','fa-newspaper','fa-feather-pointed']
                  return (
                    <a key={book.id} href={`/books/${book.id}`} className="hp-book-card">
                      <div className="hp-book-card-cover">
                        {book.cover_url ? (
                          <Image
                            src={book.cover_url} alt={book.title} fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 640px) 45vw, 22vw"
                          />
                        ) : (
                          <div className="hp-book-card-placeholder" style={{ background: gradients[idx % gradients.length] }}>
                            <i className={`fa-solid ${faIcons[idx % faIcons.length]}`}></i>
                          </div>
                        )}
                      </div>
                      <div className="hp-book-card-body">
                        {(book.category as any)?.name && (
                          <div className="hp-book-card-cat">{(book.category as any).name}</div>
                        )}
                        <div className="hp-book-card-title">{book.title}</div>
                        <div className="hp-book-card-author">{book.author}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {(categories ?? []).length > 0 && (
          <section className="hp-section">
            <div className="hp-section-label">✦ Jelajahi Topik</div>
            <h2 className="hp-section-title">
              Temukan buku yang<br />
              <em>relevan dengan karier kamu</em>
            </h2>
            <p className="hp-section-desc">
              Klik kategori untuk langsung melihat koleksi buku yang tersedia.
            </p>
            <div className="hp-categories-grid">
              {(categories ?? []).slice(0, 6).map((cat, i) => {
                const c = categoryColors[i % categoryColors.length]
                const faIcon = categoryFaIcons[i % categoryFaIcons.length]
                return (
                  // ✅ FIXED: Link langsung ke /books?category={cat.id}
                  <a
                    key={cat.id}
                    href={`/books?category=${cat.id}`}
                    className="hp-cat-card"
                  >
                    <div className="hp-cat-icon" style={{ background: c.bg, color: c.color }}>
                      <i className={`fa-solid ${faIcon}`}></i>
                    </div>
                    <div>
                      <div className="hp-cat-name">{cat.name}</div>
                      <div className="hp-cat-sub" style={{ color: c.color }}>
                        Jelajahi koleksi
                        <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.6875rem' }}></i>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ── */}
        <div className="hp-steps-wrap" id="cara-kerja">
          <div className="hp-steps-inner">
            <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
              <div className="hp-section-label" style={{ color: '#93b4f8', justifyContent: 'center', display: 'flex' }}>
                ✦ Cara Kerja
              </div>
              <h2 className="hp-section-title" style={{ color: '#ece8ff', margin: '0 auto', textAlign: 'center' }}>
                Mulai membaca<br />
                <em style={{ color: 'transparent', background: 'linear-gradient(90deg,#93b4f8,#c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
                  hanya dalam 4 langkah
                </em>
              </h2>
            </div>
            <div className="hp-steps-grid">
              {[
                { icon: 'fa-user-plus', title: 'Buat Akun', desc: 'Daftar dengan email perusahaan. Verifikasi email, lalu akun langsung aktif.' },
                { icon: 'fa-magnifying-glass', title: 'Jelajahi Katalog', desc: 'Cari buku berdasarkan judul, penulis, atau kategori sesuai kebutuhan.' },
                { icon: 'fa-book-open-reader', title: 'Mulai Membaca', desc: 'Buka buku langsung di browser. Progress tersimpan otomatis.' },
                { icon: 'fa-chart-line', title: 'Lacak Kemajuan', desc: 'Pantau statistik membaca, streak harian, dan buku yang selesai.' },
              ].map((s) => (
                <div key={s.title} className="hp-step">
                  <div className="hp-step-num">
                    <i className={`fa-solid ${s.icon}`}></i>
                  </div>
                  <div className="hp-step-title">{s.title}</div>
                  <div className="hp-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA BANNER ── */}
        <div className="hp-cta-wrap">
          <div className="hp-cta-glow" />
          <div className="hp-cta-inner">
            <h2 className="hp-cta-title">
              {session ? `Selamat datang kembali!` : 'Siap memulai perjalanan belajarmu?'}
            </h2>
            <p className="hp-cta-desc">
              {session
                ? 'Lanjutkan membaca dan capai target buku bulan ini.'
                : 'Bergabunglah dengan karyawan yang sudah aktif membaca. Gratis dan langsung aktif setelah verifikasi email.'}
            </p>
            <div className="hp-cta-actions">
              {session ? (
                <>
                  <a href={dashboardHref!} className="hp-cta-big">
                    <i className="fa-solid fa-house"></i> Buka Dashboard
                  </a>
                  <a href="/books" className="hp-cta-outline">
                    <i className="fa-solid fa-books"></i> Jelajahi Katalog
                  </a>
                </>
              ) : (
                <>
                  <a href="/auth/register" className="hp-cta-big">
                    <i className="fa-solid fa-rocket"></i> Daftar Gratis Sekarang
                  </a>
                  <a href="/books" className="hp-cta-outline">
                    <i className="fa-solid fa-eye"></i> Lihat Koleksi Dulu
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="hp-footer">
          <a href="/home" className="hp-footer-logo">
            <div className="hp-footer-mark">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <span className="hp-footer-text">E-Library Perusahaan</span>
          </a>
          <div className="hp-footer-links">
            <a href="/books" className="hp-footer-link">Katalog</a>
            <a href="/auth/register" className="hp-footer-link">Daftar</a>
            <a href="/auth/login" className="hp-footer-link">Login</a>
          </div>
          <span className="hp-footer-copy">
            © {new Date().getFullYear()} E-Library Perusahaan. Confidential.
          </span>
        </footer>
      </div>
    </>
  )
}