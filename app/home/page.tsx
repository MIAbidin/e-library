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

  const categoryColors = [
    { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)', icon: '💼' },
    { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.25)', icon: '📈' },
    { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.25)', icon: '💡' },
    { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.25)', icon: '🎯' },
    { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.25)', icon: '🚀' },
    { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.25)', icon: '🌿' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,300;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        /* ── CSS VARS: light defaults, dark override ── */
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
          --hp-hero-border: rgba(255,255,255,0.1);
          --hp-card-shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
          --hp-card-hover:  0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
          --hp-nav-bg:      rgba(248,246,242,0.92);
          --hp-gold:        #c8832a;
          --hp-green:       #15803d;
          --hp-strip-bg:    #13111a;
        }

        /* ── DARK MODE ── */
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
          --hp-hero-border: rgba(255,255,255,0.09);
          --hp-card-shadow: 0 2px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2);
          --hp-card-hover:  0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3);
          --hp-nav-bg:      rgba(10,13,20,0.92);
          --hp-gold:        #f0a832;
          --hp-green:       #4ade80;
          --hp-strip-bg:    #07090f;
        }

        .hp-root {
          background: var(--hp-bg);
          color: var(--hp-text);
          overflow-x: hidden;
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* ── NAVBAR ── */
        .hp-nav {
          position: sticky; top: 0; z-index: 100;
          background: var(--hp-nav-bg);
          backdrop-filter: blur(24px) saturate(1.5);
          -webkit-backdrop-filter: blur(24px) saturate(1.5);
          border-bottom: 1px solid var(--hp-border);
          height: 64px;
          display: flex; align-items: center;
          padding: 0 5%;
          transition: background 0.3s ease;
        }

        .hp-nav-inner {
          width: 100%; max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px;
        }

        .hp-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }

        .hp-logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #1e4bd8 0%, #7c3aed 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 12px rgba(30,75,216,0.35);
        }

        .hp-logo-text {
          font-family: 'Fraunces', serif;
          font-size: 1.0625rem;
          font-weight: 600;
          color: var(--hp-text);
          letter-spacing: -0.01em;
        }

        .hp-nav-links {
          display: flex; align-items: center; gap: 4px;
          flex: 1;
        }

        .hp-nav-link {
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--hp-text-2);
          padding: 7px 14px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .hp-nav-link:hover {
          color: var(--hp-text);
          background: var(--hp-border);
        }

        .hp-nav-actions {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }

        .hp-btn-ghost {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 600;
          color: var(--hp-text-2);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--hp-border);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .hp-btn-ghost:hover {
          color: var(--hp-text);
          border-color: var(--hp-text-3);
        }

        .hp-btn-primary {
          text-decoration: none;
          font-size: 0.875rem; font-weight: 700;
          color: #fff;
          background: var(--hp-accent);
          padding: 9px 20px;
          border-radius: 9px;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 2px 12px var(--hp-accent-glow);
          letter-spacing: -0.01em;
        }
        .hp-btn-primary:hover {
          background: var(--hp-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px var(--hp-accent-glow);
        }

        /* ── HERO ── */
        .hp-hero {
          background: var(--hp-hero-bg);
          min-height: 92vh;
          position: relative;
          overflow: hidden;
          display: flex; flex-direction: column; justify-content: center;
        }

        .hp-hero-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 60% at 20% 50%, rgba(30,75,216,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(124,58,237,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 60% 90%, rgba(30,75,216,0.08) 0%, transparent 50%);
        }

        .hp-hero-noise {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px;
        }

        .hp-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 64px 64px;
        }

        .hp-hero-inner {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
          padding: 6rem 5% 5rem;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 5rem; align-items: center;
        }

        .hp-hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(30,75,216,0.15);
          border: 1px solid rgba(30,75,216,0.3);
          color: #93b4f8;
          font-size: 0.6875rem; font-weight: 700;
          padding: 5px 12px 5px 8px; border-radius: 100px;
          margin-bottom: 1.75rem;
          letter-spacing: 0.08em; text-transform: uppercase;
        }

        .hp-hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #5b8def;
          animation: pulse-live 2s ease-in-out infinite;
        }
        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        .hp-hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.75rem, 4.5vw, 4.25rem);
          font-weight: 700;
          color: var(--hp-hero-text);
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }

        .hp-hero-title-italic {
          font-style: italic;
          color: transparent;
          background: linear-gradient(90deg, #93b4f8, #c084fc);
          -webkit-background-clip: text;
          background-clip: text;
          display: block;
        }

        .hp-hero-desc {
          font-size: 1.0625rem;
          color: var(--hp-hero-text-2);
          line-height: 1.75;
          margin-bottom: 2.5rem;
          max-width: 460px;
        }

        .hp-hero-actions {
          display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
          margin-bottom: 3.5rem;
        }

        .hp-cta-big {
          display: inline-flex; align-items: center; gap: 10px;
          background: #1e4bd8;
          color: white;
          text-decoration: none;
          font-size: 0.9375rem; font-weight: 700;
          padding: 14px 28px; border-radius: 12px;
          transition: all 0.2s;
          letter-spacing: -0.01em;
          box-shadow: 0 4px 20px rgba(30,75,216,0.4), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .hp-cta-big:hover {
          background: #1539b0;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(30,75,216,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
        }

        .hp-cta-outline {
          display: inline-flex; align-items: center; gap: 8px;
          color: rgba(244,240,255,0.7);
          text-decoration: none;
          font-size: 0.9375rem; font-weight: 500;
          padding: 13px 24px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          transition: all 0.2s;
        }
        .hp-cta-outline:hover {
          color: rgba(244,240,255,0.95);
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.05);
        }

        .hp-hero-stats {
          display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 2rem;
        }

        .hp-stat {
          flex: 1; padding-right: 2rem;
        }
        .hp-stat + .hp-stat {
          padding-left: 2rem; padding-right: 2rem;
          border-left: 1px solid rgba(255,255,255,0.08);
        }
        .hp-stat:last-child { padding-right: 0; }

        .hp-stat-num {
          font-family: 'Fraunces', serif;
          font-size: 2.25rem; font-weight: 700;
          color: var(--hp-hero-text);
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .hp-stat-label {
          font-size: 0.8125rem;
          color: var(--hp-hero-text-2);
          margin-top: 5px;
        }

        /* ── HERO VISUAL PANEL ── */
        .hp-hero-visual {
          position: relative;
        }

        .hp-book-showcase {
          position: relative;
          height: 480px;
        }

        .hp-book-float {
          position: absolute;
          background: var(--hp-surface);
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hp-book-float:hover {
          transform: translateY(-8px) rotate(0deg) !important;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.35);
          z-index: 10 !important;
        }

        .hp-book-1 { width: 145px; height: 200px; top: 20px; left: 10px; transform: rotate(-8deg); z-index: 1; }
        .hp-book-2 { width: 155px; height: 210px; top: 60px; left: 100px; transform: rotate(-2deg); z-index: 3; }
        .hp-book-3 { width: 140px; height: 195px; top: 30px; left: 200px; transform: rotate(5deg); z-index: 2; }
        .hp-book-4 { width: 150px; height: 205px; top: 180px; left: 50px; transform: rotate(3deg); z-index: 4; }
        .hp-book-5 { width: 135px; height: 190px; top: 210px; left: 195px; transform: rotate(-6deg); z-index: 2; }

        .hp-book-cover {
          width: 100%; height: 100%;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          padding: 12px;
          font-size: 2.5rem;
        }

        .hp-book-info {
          text-align: center;
        }

        .hp-book-title {
          font-size: 0.65rem; font-weight: 700;
          color: rgba(255,255,255,0.9);
          line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
        }

        .hp-float-badge {
          position: absolute;
          background: var(--hp-surface);
          border: 1px solid var(--hp-border);
          border-radius: 14px;
          padding: 12px 18px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.25);
          display: flex; align-items: center; gap: 10px;
          font-size: 0.8125rem; font-weight: 600;
          color: var(--hp-text);
          white-space: nowrap;
        }

        .hp-badge-1 { bottom: 20px; left: -20px; animation: floatA 5s ease-in-out infinite; }
        .hp-badge-2 { top: 0; right: -30px; animation: floatB 6s ease-in-out infinite; }
        .hp-badge-3 { bottom: 100px; right: -40px; animation: floatC 4.5s ease-in-out infinite; }

        @keyframes floatA { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes floatB { 0%,100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes floatC { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }

        .hp-badge-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        .hp-badge-label { color: var(--hp-text-3); font-size: 0.6875rem; font-weight: 400; }

        /* ── MARQUEE STRIP ── */
        .hp-marquee-strip {
          background: var(--hp-strip-bg);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 14px 0;
          overflow: hidden;
        }

        .hp-marquee-track {
          display: flex; gap: 48px; align-items: center;
          animation: marquee 25s linear infinite;
          width: max-content;
        }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .hp-marquee-item {
          display: flex; align-items: center; gap: 10px;
          color: rgba(255,255,255,0.35);
          font-size: 0.8125rem; font-weight: 500;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }

        .hp-marquee-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        /* ── FEATURES SECTION ── */
        .hp-section {
          padding: 6rem 5%;
          max-width: 1280px; margin: 0 auto;
        }

        .hp-section-label {
          font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--hp-accent);
          margin-bottom: 0.875rem;
        }

        .hp-section-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2rem, 3vw, 2.75rem);
          font-weight: 700; font-style: italic;
          color: var(--hp-text);
          line-height: 1.15; letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }

        .hp-section-desc {
          font-size: 1rem; color: var(--hp-text-2);
          line-height: 1.7; max-width: 520px;
        }

        .hp-features-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1.5px;
          background: var(--hp-border);
          border: 1px solid var(--hp-border);
          border-radius: 20px;
          overflow: hidden;
          margin-top: 3.5rem;
        }

        .hp-feature {
          background: var(--hp-surface);
          padding: 2.5rem 2rem;
          transition: background 0.2s;
          position: relative;
          overflow: hidden;
        }

        .hp-feature::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--hp-accent-glow), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .hp-feature:hover { background: var(--hp-surface2); }
        .hp-feature:hover::before { opacity: 1; }

        .hp-feature-num {
          font-family: 'Fraunces', serif;
          font-size: 0.75rem; font-weight: 700; font-style: italic;
          color: var(--hp-text-3); letter-spacing: 0.05em;
          margin-bottom: 1.25rem;
        }

        .hp-feature-icon {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.375rem; margin-bottom: 1.25rem;
          background: var(--hp-surface2);
          border: 1px solid var(--hp-border);
          transition: transform 0.2s;
        }
        .hp-feature:hover .hp-feature-icon { transform: scale(1.1) rotate(-3deg); }

        .hp-feature-title {
          font-size: 1rem; font-weight: 700;
          color: var(--hp-text);
          margin-bottom: 0.625rem; letter-spacing: -0.01em;
        }

        .hp-feature-desc {
          font-size: 0.875rem; color: var(--hp-text-2); line-height: 1.65;
        }

        /* ── BOOKS SHOWCASE ── */
        .hp-books-wrap {
          background: var(--hp-surface2);
          border-top: 1px solid var(--hp-border);
          border-bottom: 1px solid var(--hp-border);
          padding: 5rem 0;
        }

        .hp-books-inner {
          max-width: 1280px; margin: 0 auto;
          padding: 0 5%;
        }

        .hp-books-header {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem;
        }

        .hp-see-all {
          text-decoration: none; color: var(--hp-accent);
          font-size: 0.875rem; font-weight: 600;
          display: flex; align-items: center; gap: 6px;
          transition: gap 0.2s;
        }
        .hp-see-all:hover { gap: 10px; }

        .hp-books-scroll {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        .hp-book-card {
          background: var(--hp-surface);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid var(--hp-border);
          transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          text-decoration: none;
          display: block;
        }
        .hp-book-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--hp-card-hover);
          border-color: var(--hp-accent-glow);
        }

        .hp-book-card-cover {
          aspect-ratio: 3/4;
          position: relative;
          overflow: hidden;
        }

        .hp-book-card-placeholder {
          width: 100%; height: 100%;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 8px;
          font-size: 2.5rem;
        }

        .hp-book-card-body {
          padding: 14px 14px 16px;
        }

        .hp-book-card-cat {
          font-size: 0.6875rem; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--hp-accent); margin-bottom: 6px;
        }

        .hp-book-card-title {
          font-size: 0.875rem; font-weight: 700;
          color: var(--hp-text);
          line-height: 1.35; letter-spacing: -0.01em;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; margin-bottom: 4px;
        }

        .hp-book-card-author {
          font-size: 0.75rem; color: var(--hp-text-3);
        }

        /* ── CATEGORIES ── */
        .hp-categories-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1rem; margin-top: 2.5rem;
        }

        .hp-cat-card {
          padding: 1.75rem 1.5rem;
          border-radius: 16px;
          border: 1px solid;
          text-decoration: none;
          display: flex; align-items: center; gap: 14px;
          transition: all 0.2s;
        }
        .hp-cat-card:hover { transform: translateY(-3px); filter: brightness(1.05); }

        .hp-cat-icon {
          font-size: 1.75rem; flex-shrink: 0;
        }

        .hp-cat-name {
          font-size: 0.9375rem; font-weight: 700;
          color: var(--hp-text); letter-spacing: -0.01em;
        }

        .hp-cat-sub {
          font-size: 0.75rem; color: var(--hp-text-3); margin-top: 3px;
        }

        /* ── HOW IT WORKS ── */
        .hp-steps-wrap {
          background: var(--hp-hero-bg);
          padding: 6rem 5%;
        }

        .hp-steps-inner {
          max-width: 1280px; margin: 0 auto;
        }

        .hp-steps-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 2rem; margin-top: 3.5rem;
          position: relative;
        }

        .hp-steps-grid::before {
          content: '';
          position: absolute; top: 28px; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          z-index: 0;
        }

        .hp-step {
          position: relative; z-index: 1; text-align: center;
        }

        .hp-step-num {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--hp-surface);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.25rem;
          font-family: 'Fraunces', serif;
          font-size: 1.125rem; font-weight: 700; font-style: italic;
          color: #93b4f8;
          box-shadow: 0 0 0 4px rgba(91,141,239,0.1);
        }

        .hp-step-title {
          font-size: 0.9375rem; font-weight: 700;
          color: #e8e4f0; margin-bottom: 0.5rem;
        }

        .hp-step-desc {
          font-size: 0.8125rem; color: rgba(232,228,240,0.4);
          line-height: 1.65;
        }

        /* ── TESTIMONIAL / QUOTE ── */
        .hp-quote-wrap {
          padding: 6rem 5%;
          border-top: 1px solid var(--hp-border);
        }

        .hp-quote-inner {
          max-width: 900px; margin: 0 auto; text-align: center;
        }

        .hp-quote-mark {
          font-family: 'Fraunces', serif;
          font-size: 5rem; line-height: 0.6;
          color: var(--hp-accent); opacity: 0.35;
          display: block; margin-bottom: 1.5rem;
        }

        .hp-quote-text {
          font-family: 'Fraunces', serif;
          font-size: clamp(1.5rem, 2.5vw, 2.25rem);
          font-style: italic;
          color: var(--hp-text);
          line-height: 1.45; letter-spacing: -0.02em;
          margin-bottom: 2rem;
        }

        .hp-quote-author {
          display: flex; align-items: center; justify-content: center; gap: 12px;
        }

        .hp-quote-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, #1e4bd8, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; color: white; font-size: 0.875rem;
        }

        .hp-quote-name { font-weight: 600; color: var(--hp-text); font-size: 0.875rem; }
        .hp-quote-role { font-size: 0.8125rem; color: var(--hp-text-3); }

        /* ── CTA BANNER ── */
        .hp-cta-wrap {
          background: var(--hp-hero-bg);
          padding: 7rem 5%;
          position: relative; overflow: hidden;
        }

        .hp-cta-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 80% at 50% 100%, rgba(30,75,216,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 30% 20%, rgba(124,58,237,0.1) 0%, transparent 50%);
        }

        .hp-cta-inner {
          position: relative; z-index: 1;
          max-width: 680px; margin: 0 auto; text-align: center;
        }

        .hp-cta-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.25rem, 4vw, 3.5rem);
          font-weight: 700; font-style: italic;
          color: #ece8ff; line-height: 1.15;
          letter-spacing: -0.03em; margin-bottom: 1rem;
        }

        .hp-cta-desc {
          font-size: 1.0625rem; color: rgba(236,232,255,0.5);
          line-height: 1.7; margin-bottom: 2.5rem;
        }

        .hp-cta-actions {
          display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        .hp-footer {
          background: #07090f;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 2rem 5%;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
        }

        .hp-footer-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none;
        }

        .hp-footer-text {
          font-family: 'Fraunces', serif;
          font-size: 0.9375rem; font-weight: 600; font-style: italic;
          color: rgba(255,255,255,0.4);
        }

        .hp-footer-copy {
          font-size: 0.75rem; color: rgba(255,255,255,0.2);
        }

        .hp-footer-links {
          display: flex; gap: 20px; align-items: center;
        }

        .hp-footer-link {
          font-size: 0.8125rem; color: rgba(255,255,255,0.3);
          text-decoration: none; transition: color 0.2s;
        }
        .hp-footer-link:hover { color: rgba(255,255,255,0.65); }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hp-hero-inner { grid-template-columns: 1fr; gap: 3rem; text-align: center; }
          .hp-hero-actions { justify-content: center; }
          .hp-hero-stats { justify-content: center; }
          .hp-hero-visual { display: none; }
          .hp-hero-desc { max-width: 100%; margin-left: auto; margin-right: auto; }
          .hp-features-grid { grid-template-columns: 1fr 1fr; }
          .hp-books-scroll { grid-template-columns: repeat(2, 1fr); }
          .hp-steps-grid { grid-template-columns: repeat(2, 1fr); }
          .hp-steps-grid::before { display: none; }
          .hp-categories-grid { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 640px) {
          .hp-nav-links { display: none; }
          .hp-features-grid { grid-template-columns: 1fr; }
          .hp-books-scroll { grid-template-columns: repeat(2, 1fr); }
          .hp-steps-grid { grid-template-columns: 1fr 1fr; }
          .hp-categories-grid { grid-template-columns: 1fr; }
          .hp-hero-stats { flex-direction: column; gap: 1.5rem; border-top: none; padding-top: 1rem; }
          .hp-stat { padding: 0 !important; border: none !important; }
          .hp-hero-inner { padding: 4rem 5% 3rem; }
          .hp-section { padding: 4rem 5%; }
        }
      `}</style>

      <div className="hp-root">
        {/* ── NAVBAR ── */}
        <nav className="hp-nav">
          <div className="hp-nav-inner">
            <a href="/home" className="hp-logo">
              <div className="hp-logo-mark">📚</div>
              <span className="hp-logo-text">E-Library</span>
            </a>

            <div className="hp-nav-links">
              <a href="/books" className="hp-nav-link">Katalog Buku</a>
              <a href="#fitur" className="hp-nav-link">Fitur</a>
              <a href="#cara-kerja" className="hp-nav-link">Cara Kerja</a>
            </div>

            <div className="hp-nav-actions">
              <HomeThemeToggle />
              {session ? (
                <>
                  <a href={dashboardHref!} className="hp-btn-ghost">Dashboard</a>
                  <a href={dashboardHref!} className="hp-btn-primary">Buka Aplikasi →</a>
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
          <div className="hp-hero-noise" />
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
                Perpustakaan digital perusahaan dengan ribuan koleksi e-book terseleksi. 
                Baca kapan saja, lacak progres, dan terus berkembang bersama.
              </p>

              <div className="hp-hero-actions">
                {session ? (
                  <>
                    <a href={dashboardHref!} className="hp-cta-big">
                      <span>🏠</span> Buka Dashboard
                    </a>
                    <a href="/books" className="hp-cta-outline">
                      Jelajahi Koleksi →
                    </a>
                  </>
                ) : (
                  <>
                    <a href="/auth/register" className="hp-cta-big">
                      <span>✨</span> Mulai Gratis
                    </a>
                    <a href="/books" className="hp-cta-outline">
                      Lihat Koleksi →
                    </a>
                  </>
                )}
              </div>

              <div className="hp-hero-stats">
                <div className="hp-stat">
                  <div className="hp-stat-num">{totalBooks ?? 0}+</div>
                  <div className="hp-stat-label">Koleksi E-Book</div>
                </div>
                <div className="hp-stat">
                  <div className="hp-stat-num">{totalUsers ?? 0}</div>
                  <div className="hp-stat-label">Pembaca Aktif</div>
                </div>
                <div className="hp-stat">
                  <div className="hp-stat-num">{totalCategories ?? 0}</div>
                  <div className="hp-stat-label">Kategori Topik</div>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="hp-hero-visual">
              <div className="hp-book-showcase">
                {/* Books */}
                {[
                  { cls: 'hp-book-1', bg: 'linear-gradient(135deg, #1e3a6e, #2563eb)', emoji: '📘' },
                  { cls: 'hp-book-2', bg: 'linear-gradient(135deg, #134e3a, #16a34a)', emoji: '📗' },
                  { cls: 'hp-book-3', bg: 'linear-gradient(135deg, #4c1d95, #7c3aed)', emoji: '📙' },
                  { cls: 'hp-book-4', bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)', emoji: '📕' },
                  { cls: 'hp-book-5', bg: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)', emoji: '📒' },
                ].map((b, i) => (
                  <div key={i} className={`hp-book-float ${b.cls}`}>
                    <div
                      className="hp-book-cover"
                      style={{ background: b.bg }}
                    >
                      <span style={{ fontSize: '3rem', marginBottom: 8 }}>{b.emoji}</span>
                    </div>
                  </div>
                ))}

                {/* Floating badges */}
                <div className="hp-float-badge hp-badge-1">
                  <div className="hp-badge-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>✅</div>
                  <div>
                    <div>Buku Selesai</div>
                    <div className="hp-badge-label">+3 minggu ini</div>
                  </div>
                </div>

                <div className="hp-float-badge hp-badge-2">
                  <div className="hp-badge-icon" style={{ background: 'rgba(251,191,36,0.15)' }}>🔥</div>
                  <div>
                    <div>7 Hari Streak</div>
                    <div className="hp-badge-label">Pertahankan!</div>
                  </div>
                </div>

                <div className="hp-float-badge hp-badge-3">
                  <div className="hp-badge-icon" style={{ background: 'rgba(91,141,239,0.15)' }}>📊</div>
                  <div>
                    <div>142 Halaman</div>
                    <div className="hp-badge-label">dibaca hari ini</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE STRIP ── */}
        <div className="hp-marquee-strip">
          <div className="hp-marquee-track">
            {Array(2).fill([
              '📚 Koleksi Lengkap', '📊 Lacak Progres', '🔔 Notifikasi Buku Baru',
              '🔒 Akses Aman', '📱 Responsif di Semua Perangkat', '🎯 Selesaikan Lebih Banyak Buku',
              '⚡ PDF Viewer Cepat', '📥 Export Laporan CSV', '🏆 Streak Membaca Harian',
              '🔍 Cari & Filter Mudah', '👥 Manajemen Tim', '🌐 Akses 24/7',
            ].map((item, i) => (
              <span key={i} className="hp-marquee-item">
                {i > 0 && <span className="hp-marquee-dot" />}
                {item}
              </span>
            ))).flat().map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="fitur" className="hp-section">
          <div className="hp-section-label">Kenapa E-Library?</div>
          <h2 className="hp-section-title">
            Semuanya ada di satu tempat,<br />siap kapan pun kamu butuhkan
          </h2>
          <p className="hp-section-desc">
            Dirancang khusus untuk mendukung pertumbuhan profesional karyawan, 
            bukan sekadar tempat menyimpan file PDF.
          </p>

          <div className="hp-features-grid">
            {[
              {
                num: '01', icon: '📖', title: 'Baca Langsung di Browser',
                desc: 'PDF viewer built-in yang mulus dan responsif. Tidak perlu download, tidak perlu aplikasi tambahan. Buka dan langsung baca.',
              },
              {
                num: '02', icon: '🔖', title: 'Simpan Posisi Otomatis',
                desc: 'Tinggalkan di halaman berapa pun, sistem akan mengingat. Lanjutkan kapan saja dari perangkat apa pun tanpa kehilangan halaman.',
              },
              {
                num: '03', icon: '📊', title: 'Dashboard Statistik Personal',
                desc: 'Lihat berapa buku yang sudah kamu baca, berapa halaman, streak membaca harian, dan grafik aktivitas mingguan.',
              },
              {
                num: '04', icon: '🔔', title: 'Notifikasi Real-time',
                desc: 'Dapat notifikasi langsung saat ada buku baru atau pengumuman penting dari admin. Badge lonceng yang selalu update.',
              },
              {
                num: '05', icon: '🔒', title: 'Kontrol Akses Granular',
                desc: 'Admin bisa mengatur buku mana yang publik dan mana yang restricted per departemen atau per karyawan tertentu.',
              },
              {
                num: '06', icon: '📥', title: 'Laporan & Analitik',
                desc: 'Admin mendapat dashboard lengkap aktivitas seluruh karyawan, buku terpopuler, dan bisa export CSV kapan saja.',
              },
            ].map((f) => (
              <div key={f.num} className="hp-feature">
                <div className="hp-feature-num">— {f.num}</div>
                <div className="hp-feature-icon">{f.icon}</div>
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
                  <div className="hp-section-label">Koleksi Terbaru</div>
                  <h2 className="hp-section-title" style={{ marginBottom: 0 }}>
                    Baru ditambahkan<br />
                    <em style={{ fontStyle: 'italic', color: 'var(--hp-accent)' }}>ke perpustakaan</em>
                  </h2>
                </div>
                <a href="/books" className="hp-see-all">
                  Lihat semua koleksi <span>→</span>
                </a>
              </div>

              <div className="hp-books-scroll">
                {(featuredBooks ?? []).slice(0, 8).map((book, idx) => {
                  const gradients = [
                    'linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)',
                    'linear-gradient(135deg, #134e3a 0%, #16a34a 100%)',
                    'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                    'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
                    'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
                    'linear-gradient(135deg, #451a03 0%, #d97706 100%)',
                    'linear-gradient(135deg, #0c1a2e 0%, #1d4ed8 100%)',
                    'linear-gradient(135deg, #1a0533 0%, #9333ea 100%)',
                  ]
                  const emojis = ['📘', '📗', '📙', '📕', '📒', '📓', '📔', '📖']
                  return (
                    <a key={book.id} href={`/books/${book.id}`} className="hp-book-card">
                      <div className="hp-book-card-cover">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                          />
                        ) : (
                          <div
                            className="hp-book-card-placeholder"
                            style={{ background: gradients[idx % gradients.length] }}
                          >
                            <span>{emojis[idx % emojis.length]}</span>
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
            <div className="hp-section-label">Jelajahi Topik</div>
            <h2 className="hp-section-title">
              Temukan buku yang<br />
              <em style={{ fontStyle: 'italic' }}>relevan dengan karier kamu</em>
            </h2>

            <div className="hp-categories-grid">
              {(categories ?? []).slice(0, 6).map((cat, i) => {
                const c = categoryColors[i % categoryColors.length]
                return (
                  <a
                    key={cat.id}
                    href={`/books?category=${cat.id}`}
                    className="hp-cat-card"
                    style={{ background: c.bg, borderColor: c.border }}
                  >
                    <div className="hp-cat-icon">{c.icon}</div>
                    <div>
                      <div className="hp-cat-name">{cat.name}</div>
                      <div className="hp-cat-sub">Jelajahi koleksi →</div>
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
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div className="hp-section-label" style={{ color: '#93b4f8' }}>
                Cara Kerja
              </div>
              <h2 className="hp-section-title" style={{ color: '#ece8ff', margin: '0 auto' }}>
                Mulai membaca<br />
                <em style={{ fontStyle: 'italic', color: 'transparent', background: 'linear-gradient(90deg, #93b4f8, #c084fc)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
                  hanya dalam 4 langkah
                </em>
              </h2>
            </div>

            <div className="hp-steps-grid">
              {[
                { num: '1', title: 'Buat Akun', desc: 'Daftar dengan email perusahaan. Verifikasi lewat email, lalu akun langsung aktif.' },
                { num: '2', title: 'Jelajahi Katalog', desc: 'Cari buku berdasarkan judul, penulis, atau kategori. Filter sesuai topik yang dibutuhkan.' },
                { num: '3', title: 'Mulai Membaca', desc: 'Buka buku langsung di browser. Progress tersimpan otomatis sehingga bisa lanjut kapan saja.' },
                { num: '4', title: 'Lacak Kemajuan', desc: 'Pantau statistik membaca, streak harian, dan buku yang sudah selesai di dashboard pribadimu.' },
              ].map((s) => (
                <div key={s.num} className="hp-step">
                  <div className="hp-step-num">{s.num}</div>
                  <div className="hp-step-title">{s.title}</div>
                  <div className="hp-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── QUOTE ── */}
        <div className="hp-quote-wrap">
          <div className="hp-quote-inner">
            <span className="hp-quote-mark">"</span>
            <p className="hp-quote-text">
              Investasi terbaik yang bisa kamu buat adalah investasi pada dirimu sendiri. 
              Semakin banyak yang kamu pelajari, semakin banyak yang bisa kamu raih.
            </p>
            <div className="hp-quote-author">
              <div className="hp-quote-avatar">WB</div>
              <div>
                <div className="hp-quote-name">Warren Buffett</div>
                <div className="hp-quote-role">Investor & Pebisnis</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA BANNER ── */}
        <div className="hp-cta-wrap">
          <div className="hp-cta-glow" />
          <div className="hp-cta-inner">
            <h2 className="hp-cta-title">
              {session
                ? `Selamat datang kembali,\n${session.user.name?.split(' ')[0]}!`
                : 'Siap memulai perjalanan\nbelajarmu hari ini?'}
            </h2>
            <p className="hp-cta-desc">
              {session
                ? 'Lanjutkan membaca dan capai target buku bulan ini. Koleksi baru terus bertambah setiap minggu.'
                : 'Bergabunglah dengan karyawan yang sudah aktif membaca. Gratis, cepat, dan langsung aktif setelah verifikasi email.'}
            </p>

            <div className="hp-cta-actions">
              {session ? (
                <>
                  <a href={dashboardHref!} className="hp-cta-big" style={{ fontSize: '1rem', padding: '15px 32px' }}>
                    Buka Dashboard →
                  </a>
                  <a href="/books" className="hp-cta-outline" style={{ fontSize: '1rem', padding: '15px 24px' }}>
                    Jelajahi Katalog
                  </a>
                </>
              ) : (
                <>
                  <a href="/auth/register" className="hp-cta-big" style={{ fontSize: '1rem', padding: '15px 32px' }}>
                    ✨ Daftar Gratis Sekarang
                  </a>
                  <a href="/books" className="hp-cta-outline" style={{ fontSize: '1rem', padding: '15px 24px' }}>
                    Lihat Koleksi Dulu
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="hp-footer">
          <a href="/home" className="hp-footer-logo">
            <span style={{ fontSize: '1.125rem' }}>📚</span>
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