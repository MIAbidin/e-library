'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

interface Book {
  id: string
  title: string
  author: string
  description: string | null
  year: number | null
  total_pages: number
  cover_url: string | null
  access_type?: string
  category?: { id: string; name: string } | null
}

interface Category {
  id: string
  name: string
}

const GRADIENTS = [
  'linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)',
  'linear-gradient(135deg, #134e3a 0%, #16a34a 100%)',
  'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
  'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #451a03 0%, #d97706 100%)',
  'linear-gradient(135deg, #0c1a2e 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #1a0533 0%, #9333ea 100%)',
]

export default function PublicBooksPage() {
  const { data: session } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/public/categories')
      .then(r => r.json())
      .then(data => setCategories(data ?? []))
      .catch(() => {})
  }, [])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
        ...(search && { search }),
        ...(category && { category }),
      })
      const res = await fetch(`/api/public/books?${params}`)
      const data = await res.json()
      setBooks(data.books ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [page, search, category, sort])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setPage(1), 400)
  }

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    setPage(1)
  }

  const dashboardHref = session
    ? session.user.role === 'admin' ? '/admin' : '/dashboard'
    : null

  const hasFilter = search || category || sort !== 'newest'
  const activeFilterCount = [search, category, sort !== 'newest' ? '1' : ''].filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--nav-border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 16px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Logo */}
          <Link href="/home" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none', flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📚</div>
            <span style={{
              fontWeight: 700, fontSize: '0.9375rem',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              display: 'none',
            }} className="nav-logo-text">E-Library</span>
          </Link>

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }} className="desktop-nav">
            <Link href="/home" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8,
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--nav-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
            >Beranda</Link>
            <Link href="/books" style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--brand-blue-light)',
              textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--badge-blue-bg)',
            }}>Katalog Buku</Link>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {session ? (
              <Link href={dashboardHref!} style={{
                background: '#2563eb', color: '#fff',
                textDecoration: 'none', borderRadius: 9,
                padding: '8px 16px', fontSize: '0.875rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}>
                <span>Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" style={{
                  fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid var(--border-base)',
                  display: 'none',
                }} className="desktop-only">Masuk</Link>
                <Link href="/auth/register" style={{
                  background: '#2563eb', color: '#fff',
                  textDecoration: 'none', borderRadius: 9,
                  padding: '8px 16px', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'background 0.15s',
                }}>Daftar</Link>
                <Link href="/auth/login" style={{
                  fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  padding: '7px 10px', borderRadius: 8,
                  border: '1px solid var(--border-base)',
                }} className="mobile-only">Masuk</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── PAGE HEADER ── */}
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '24px 16px 0',
      }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>Katalog Buku</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            {total > 0 ? `${total} koleksi e-book tersedia` : 'Temukan e-book yang kamu cari'}
          </p>
        </div>

        {/* ── SEARCH + FILTER BAR ── */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          borderRadius: 14,
          padding: '12px',
          marginBottom: 20,
        }}>
          {/* Search row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute', left: 11, top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 14, opacity: 0.5,
              }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Cari judul atau penulis..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 34, paddingRight: search ? 32 : 12,
                  paddingTop: 9, paddingBottom: 9,
                  fontSize: '0.875rem',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 9, color: 'var(--input-text)',
                  outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--input-border)'; e.currentTarget.style.boxShadow = '' }}
              />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1) }}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text-tertiary)', padding: 2,
                  }}>✕</button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '9px 14px', borderRadius: 9,
                border: `1px solid ${showFilters || hasFilter ? '#2563eb' : 'var(--border-base)'}`,
                background: showFilters || hasFilter ? 'var(--badge-blue-bg)' : 'var(--input-bg)',
                color: showFilters || hasFilter ? 'var(--brand-blue-light)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
                flexShrink: 0,
              }}
              className="mobile-filter-btn"
            >
              Filter
              {activeFilterCount > 0 && (
                <span style={{
                  background: '#2563eb', color: '#fff',
                  borderRadius: '50%', width: 18, height: 18,
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{activeFilterCount}</span>
              )}
            </button>

            {/* Desktop filters inline */}
            <div style={{ display: 'flex', gap: 8 }} className="desktop-filters">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1) }}
                style={{
                  padding: '9px 12px', borderRadius: 9, fontSize: '0.8125rem',
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  color: 'var(--input-text)', cursor: 'pointer', minWidth: 140,
                }}
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1) }}
                style={{
                  padding: '9px 12px', borderRadius: 9, fontSize: '0.8125rem',
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  color: 'var(--input-text)', cursor: 'pointer',
                }}
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="title_asc">Judul A-Z</option>
                <option value="title_desc">Judul Z-A</option>
              </select>
              {hasFilter && (
                <button onClick={handleReset} style={{
                  padding: '9px 14px', borderRadius: 9, fontSize: '0.8125rem',
                  background: 'none', border: '1px solid var(--border-base)',
                  color: 'var(--text-tertiary)', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>Reset</button>
              )}
            </div>
          </div>

          {/* Mobile expanded filters */}
          {showFilters && (
            <div style={{
              marginTop: 10, paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex', flexDirection: 'column', gap: 8,
            }} className="mobile-filter-panel">
              <select
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1) }}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9, fontSize: '0.875rem',
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  color: 'var(--input-text)', cursor: 'pointer',
                }}
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); setPage(1) }}
                  style={{
                    flex: 1, padding: '10px 12px', borderRadius: 9, fontSize: '0.875rem',
                    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                    color: 'var(--input-text)', cursor: 'pointer',
                  }}
                >
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="title_asc">Judul A-Z</option>
                  <option value="title_desc">Judul Z-A</option>
                </select>
                {hasFilter && (
                  <button onClick={handleReset} style={{
                    padding: '10px 16px', borderRadius: 9, fontSize: '0.875rem',
                    background: 'none', border: '1px solid var(--border-base)',
                    color: 'var(--text-tertiary)', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>Reset</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RESULTS INFO ── */}
        {!loading && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, flexWrap: 'wrap', gap: 8,
          }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              {books.length > 0 ? (
                <>Menampilkan <strong style={{ color: 'var(--text-secondary)' }}>{books.length}</strong> dari <strong style={{ color: 'var(--text-secondary)' }}>{total}</strong> buku</>
              ) : 'Tidak ada hasil'}
            </p>
            {!session && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                <Link href="/auth/login" style={{ color: 'var(--brand-blue-light)', textDecoration: 'none', fontWeight: 600 }}>Login</Link> untuk simpan progres membaca
              </p>
            )}
          </div>
        )}

        {/* ── BOOK GRID ── */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12, marginBottom: 32,
          }}>
            {Array(12).fill(0).map((_, i) => (
              <div key={i} style={{
                borderRadius: 12, overflow: 'hidden',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
              }}>
                <div style={{
                  aspectRatio: '3/4',
                  background: 'var(--bg-muted)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <div style={{ padding: 10 }}>
                  <div style={{ height: 12, borderRadius: 4, background: 'var(--bg-muted)', marginBottom: 6 }} />
                  <div style={{ height: 10, borderRadius: 4, background: 'var(--bg-subtle)', width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem', marginBottom: 16 }}>
              {hasFilter ? 'Tidak ada buku yang cocok dengan filter.' : 'Belum ada buku tersedia.'}
            </p>
            {hasFilter && (
              <button onClick={handleReset} style={{
                padding: '10px 20px', borderRadius: 10,
                background: '#2563eb', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
              }}>Reset Filter</button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12, marginBottom: 24,
            }}>
              {books.map((book, idx) => (
                <Link key={book.id} href={`/books/${book.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    transition: 'all 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
                    cursor: 'pointer', height: '100%',
                    display: 'flex', flexDirection: 'column',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = 'translateY(-4px)'
                      el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)'
                      el.style.borderColor = 'rgba(37,99,235,0.3)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.transform = ''
                      el.style.boxShadow = ''
                      el.style.borderColor = 'var(--card-border)'
                    }}
                  >
                    {/* Cover */}
                    <div style={{
                      aspectRatio: '3/4',
                      position: 'relative', overflow: 'hidden',
                      background: GRADIENTS[idx % GRADIENTS.length],
                    }}>
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 36,
                        }}>📗</div>
                      )}
                      {/* Access badge */}
                      {book.access_type === 'restricted' && (
                        <div style={{ position: 'absolute', top: 6, right: 6 }}>
                          <span style={{
                            background: 'rgba(0,0,0,0.65)', color: '#fbbf24',
                            fontSize: 10, padding: '2px 6px', borderRadius: 6,
                            fontWeight: 600,
                          }}>🔒</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {book.category?.name && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: 'var(--badge-blue-text)',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          marginBottom: 4, display: 'block',
                        }}>{book.category.name}</span>
                      )}
                      <h3 style={{
                        fontSize: '0.8125rem', fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: 4,
                        flex: 1,
                      }}>{book.title}</h3>
                      <p style={{
                        fontSize: '0.75rem', color: 'var(--text-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{book.author}</p>
                      {book.year && (
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-disabled)', marginTop: 2 }}>{book.year}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── PAGINATION ── */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, paddingBottom: 40,
              }}>
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '8px 14px', borderRadius: 9,
                    border: '1px solid var(--border-base)',
                    background: 'var(--card-bg)', color: 'var(--text-secondary)',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, fontSize: '0.875rem',
                  }}
                >← Prev</button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number
                  if (totalPages <= 5) {
                    p = i + 1
                  } else if (page <= 3) {
                    p = i + 1
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i
                  } else {
                    p = page - 2 + i
                  }
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      style={{
                        width: 36, height: 36, borderRadius: 9,
                        border: '1px solid var(--border-base)',
                        background: p === page ? '#2563eb' : 'var(--card-bg)',
                        color: p === page ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '0.875rem', fontWeight: p === page ? 700 : 400,
                      }}
                    >{p}</button>
                  )
                })}

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '8px 14px', borderRadius: 9,
                    border: '1px solid var(--border-base)',
                    background: 'var(--card-bg)', color: 'var(--text-secondary)',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, fontSize: '0.875rem',
                  }}
                >Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA for non-logged in users */}
      {!session && !loading && books.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #1e3a6e 0%, #2563eb 100%)',
          padding: '32px 16px', textAlign: 'center', marginTop: 8,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 8 }}>
            Daftar untuk membaca e-book dan menyimpan progres Anda
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{
              background: '#fff', color: '#1d4ed8',
              padding: '10px 22px', borderRadius: 10,
              fontSize: '0.9375rem', fontWeight: 700, textDecoration: 'none',
            }}>Daftar Gratis</Link>
            <Link href="/auth/login" style={{
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              padding: '10px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)',
              fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none',
            }}>Masuk</Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 16px',
        textAlign: 'center',
        color: 'var(--text-disabled)',
        fontSize: '0.75rem',
        marginTop: 8,
      }}>
        © {new Date().getFullYear()} E-Library Perusahaan. Confidential.
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        /* Mobile: show filter button, hide desktop filters */
        @media (max-width: 640px) {
          .desktop-filters { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .mobile-filter-panel { display: flex !important; }
          .desktop-nav { display: none !important; }
          .nav-logo-text { display: block !important; }
          .mobile-only { display: flex !important; }
          .desktop-only { display: none !important; }
        }
        @media (min-width: 641px) {
          .desktop-filters { display: flex !important; }
          .mobile-filter-btn { display: none !important; }
          .mobile-filter-panel { display: none !important; }
          .desktop-nav { display: flex !important; }
          .nav-logo-text { display: block !important; }
          .mobile-only { display: none !important; }
          .desktop-only { display: flex !important; }
        }
      `}</style>
    </div>
  )
}